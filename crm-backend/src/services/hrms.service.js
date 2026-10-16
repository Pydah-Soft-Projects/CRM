import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getHRMSDb } from '../config/database.js';

/**
 * HRMS Service
 * Resolves CRM users to HRMS User/Employee identities for SSO verify-token response.
 * Validates HRMS login credentials when user signs in via HRMS portal.
 * Uses HRMS MongoDB connection from config/database.js (when HRMS_MONGO_URI is set).
 */

/**
 * Get password hash from HRMS user doc (supports password, passwordHash, password_hash).
 */
function getPasswordHash(doc) {
  if (!doc) return null;
  return doc.password || doc.passwordHash || doc.password_hash || null;
}

/**
 * Extract employee profile photo from employee or user document.
 * 1. Checks direct field `profilePhoto` (or variations `profile_photo`, `photo`).
 * 2. If absent, checks inside `dynamicFields` object (`profilePhoto`, etc.).
 * @param {Object} doc - HRMS employee or user document
 * @returns {string|null} Photo URL or null
 */
export function extractProfilePhoto(doc) {
  if (!doc) return null;

  // 1. Check direct profile photo fields on root document
  const direct = doc.profilePhoto || doc.profile_photo || doc.photo || doc.avatar || doc.image;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  // 2. Check dynamicFields object
  if (doc.dynamicFields && typeof doc.dynamicFields === 'object') {
    const df = doc.dynamicFields;
    const dfPhoto = df.profilePhoto || df.profile_photo || df.photo || df.avatar || df.image;
    if (typeof dfPhoto === 'string' && dfPhoto.trim()) {
      return dfPhoto.trim();
    }
  }

  return null;
}

const photoCache = new Map();

/**
 * Look up HRMS employee profile photo by email, employee number, username, or phone.
 * @param {Object} params - { email, employeeId, username, phone }
 * @returns {Promise<string|null>} Photo URL or null
 */
export const getEmployeeProfilePhoto = async ({ email, employeeId, username, phone } = {}) => {
  const cacheKey = (email || employeeId || username || phone || '').trim().toLowerCase();
  if (cacheKey && photoCache.has(cacheKey)) {
    return photoCache.get(cacheKey);
  }

  try {
    const db = await getHRMSDb();
    if (!db) return null;
    const empCol = db.collection('employees');
    const projection = { profilePhoto: 1, profile_photo: 1, photo: 1, dynamicFields: 1 };

    let doc = null;
    const normEmail = email && typeof email === 'string' ? email.trim() : null;
    const empId = (employeeId || (username && !username.includes('@') ? username : null) || '').trim();

    // 1. Indexed lookup by email
    if (normEmail) {
      doc = await empCol.findOne({ email: normEmail }, { projection });
    }

    // 2. Indexed lookup by emp_no
    if (!doc && empId) {
      doc = await empCol.findOne(
        { $or: [{ emp_no: empId }, { emp_no: empId.toUpperCase() }] },
        { projection }
      );
    }

    // 3. Fallback by phone
    if (!doc && phone && typeof phone === 'string') {
      const p = phone.trim();
      doc = await empCol.findOne({ $or: [{ phone_number: p }, { phone: p }] }, { projection });
    }

    const photo = doc ? extractProfilePhoto(doc) : null;
    if (cacheKey) {
      photoCache.set(cacheKey, photo);
      if (photoCache.size > 500) photoCache.clear();
    }
    return photo;
  } catch (error) {
    console.error('[HRMS] getEmployeeProfilePhoto error:', error.message);
    return null;
  }
};

/**
 * Find HRMS User or Employee by _id (for verify-token when databaseSource is hrms).
 * @param {string} userId - HRMS _id as string (24-char hex)
 * @returns {Promise<{ email?: string, name?: string, employeeId?: string, phone?: string, profilePhoto?: string }|null>}
 */
export const getHRMSUserById = async (userId) => {
  if (!userId || typeof userId !== 'string') return null;
  const db = await getHRMSDb();
  if (!db) return null;
  let doc = null;
  try {
    const empCol = db.collection('employees');
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      const _id = new ObjectId(userId);
      doc = await empCol.findOne({ _id });
    }
    if (!doc) {
      doc = await empCol.findOne({
        $or: [
          { emp_no: userId.trim() },
          { emp_no: userId.trim().toUpperCase() }
        ]
      });
    }
    if (!doc) return null;

    const photo = extractProfilePhoto(doc);
    return {
      email: doc.email || null,
      name: doc.employee_name || doc.name || null,
      employeeId: doc.emp_no || null,
      phone: doc.phone_number || doc.phone || doc.mobile || null,
      profilePhoto: photo || null
    };
  } catch (error) {
    console.error('[HRMS] getHRMSUserById error:', error.message);
    return null;
  }
};

/**
 * Validate HRMS credentials (for login when portalId is hrms).
 * Looks up Employee exclusively by email or emp_no, verifies bcrypt password.
 * Per institutional policy, validation is performed ONLY on the employees collection.
 * @param {string} username - Email or emp_no
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized user { id, email, name, role, profilePhoto, databaseSource: 'hrms' } or null
 */
export const validateHRMSCredentials = async (username, password) => {
  if (!username || !password) return null;
  const db = await getHRMSDb();
  if (!db) {
    console.log('[Auth] HRMS login requested but HRMS_MONGO_URI not configured');
    return null;
  }
  const empCol = db.collection('employees');
  const identifier = username.trim();
  const upperId = identifier.toUpperCase();

  try {
    console.log(`[Auth-HRMS] Checking employees collection exclusively for identifier: ${identifier}`);
    // 1) Employee collection: by email or emp_no, active only
    let doc = await empCol.findOne({
      $and: [
        { $or: [{ email: identifier }, { emp_no: upperId }, { emp_no: identifier }] },
        { $or: [{ is_active: true }, { is_active: { $exists: false } }] }
      ]
    });

    if (!doc) {
      console.log(`[Auth-HRMS] No active employee found, checking all employees for identifier: ${identifier}`);
      doc = await empCol.findOne({
        $or: [{ email: identifier }, { emp_no: upperId }, { emp_no: identifier }]
      });
    }

    if (doc) {
      console.log(`[Auth-HRMS] Found document in employees: ${doc._id}, Active: ${doc.is_active}`);
      const hash = getPasswordHash(doc);
      let valid = false;
      if (hash) {
        console.log(`[Auth-HRMS] Verifying password for employee: ${doc.email || doc.emp_no}`);
        valid = await bcrypt.compare(password, hash);
        if (!valid && password === hash) valid = true;
      }
      if (!valid && doc.plain_password && password === doc.plain_password) {
        valid = true;
      }

      if (valid) {
        console.log(`[Auth-HRMS] HRMS employee validated successfully: ${doc._id}`);
        const photo = extractProfilePhoto(doc);
        return {
          id: doc._id.toString(),
          email: doc.email || null,
          name: doc.employee_name || doc.name || null,
          role: doc.role || 'user',
          phone: doc.phone_number || doc.phone || doc.mobile || doc.contact || null,
          employeeId: doc.emp_no || doc.employeeId || (doc._id ? doc._id.toString() : null),
          profilePhoto: photo || null,
          databaseSource: 'hrms'
        };
      } else {
        console.log(`[Auth-HRMS] Password mismatch or no hash for employee: ${doc.email || doc.emp_no}`);
      }
    } else {
      console.log(`[Auth-HRMS] No document found in employees collection for identifier: ${identifier}`);
    }

    console.log(`[Auth] HRMS: employee not found or invalid password for: ${identifier}`);
    return null;
  } catch (error) {
    console.error('[HRMS] validateHRMSCredentials error:', error.message);
    return null;
  }
};

/**
 * Find HRMS Employee by email and/or employee number.
 * Exclusively queries the employees collection.
 * @param {string} email - User email
 * @param {string} [employeeId] - Optional employee number (e.g. 2145)
 * @returns {Promise<{ userId: string, employeeId: string, email: string, profilePhoto?: string }|null>} HRMS Employee _id as string, employeeId, email, profilePhoto or null
 */
export const findHRMSUserByEmail = async (email, employeeId = null) => {
  if ((!email || typeof email !== 'string') && (!employeeId || typeof employeeId !== 'string')) {
    return null;
  }
  const db = await getHRMSDb();
  if (!db) {
    return null;
  }
  const employeeCollection = db.collection('employees');

  try {
    const normalizedEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : null;
    const cleanEmp = employeeId && typeof employeeId === 'string' ? employeeId.trim() : null;

    const orConditions = [];
    if (cleanEmp) {
      orConditions.push({ emp_no: cleanEmp });
      orConditions.push({ emp_no: cleanEmp.toUpperCase() });
      if (/^[0-9a-fA-F]{24}$/.test(cleanEmp)) {
        try {
          orConditions.push({ _id: new ObjectId(cleanEmp) });
        } catch (_) {}
      }
    }
    if (normalizedEmail) {
      orConditions.push({ email: normalizedEmail });
      orConditions.push({ email: email.trim() });
    }

    if (orConditions.length === 0) return null;

    // 1) Query active employees
    let doc = await employeeCollection.findOne({
      $and: [
        { $or: orConditions },
        { $or: [{ is_active: true }, { is_active: { $exists: false } }] }
      ]
    });

    // 2) Fallback to any matching employee
    if (!doc) {
      doc = await employeeCollection.findOne({ $or: orConditions });
    }

    if (doc && doc._id) {
      return {
        userId: doc._id.toString(),
        employeeId: doc.emp_no || cleanEmp,
        email: doc.email || email,
        profilePhoto: extractProfilePhoto(doc)
      };
    }

    return null;
  } catch (error) {
    console.error('[HRMS] findHRMSUserByEmail error:', error.message);
    return null;
  }
};

export default {
  extractProfilePhoto,
  getEmployeeProfilePhoto,
  getHRMSUserById,
  validateHRMSCredentials,
  findHRMSUserByEmail,
};

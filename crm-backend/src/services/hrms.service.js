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
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      const _id = new ObjectId(userId);
      doc = await db.collection('users').findOne({ _id });
      if (!doc) doc = await db.collection('employees').findOne({ _id });
    }
    if (!doc) return null;

    let photo = extractProfilePhoto(doc);
    if (!photo && (doc.email || doc.employeeId || doc.emp_no)) {
      const empCol = db.collection('employees');
      const orConditions = [];
      if (doc.email) orConditions.push({ email: doc.email });
      if (doc.employeeId) {
        orConditions.push({ emp_no: doc.employeeId });
        orConditions.push({ emp_no: doc.employeeId.toUpperCase() });
      }
      if (orConditions.length > 0) {
        const emp = await empCol.findOne({ $or: orConditions });
        if (emp) photo = extractProfilePhoto(emp);
      }
    }

    return {
      email: doc.email || null,
      name: doc.name || doc.employee_name || doc.username || null,
      employeeId: doc.employeeId || doc.emp_no || null,
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
 * Looks up User then Employee by email or username, verifies bcrypt password.
 * @param {string} username - Email or username
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
  const userCol = db.collection('users');
  const empCol = db.collection('employees');
  const identifier = username.trim();

  try {
    console.log(`[Auth-HRMS] Checking user collection for identifier: ${identifier}`);
    let doc = await userCol.findOne({
      $and: [
        { $or: [{ email: identifier }, { username: identifier }] },
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
      ]
    });
    
    if (!doc) {
      console.log(`[Auth-HRMS] No active user found, checking all users for identifier: ${identifier}`);
      doc = await userCol.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      });
    }

    if (doc) {
      console.log(`[Auth-HRMS] Found document in users: ${doc._id}, Active: ${doc.isActive}`);
      const hash = getPasswordHash(doc);
      let valid = false;
      if (hash) {
        console.log(`[Auth-HRMS] Verifying password for user: ${doc.email || doc.username}`);
        valid = await bcrypt.compare(password, hash);
        if (!valid && password === hash) valid = true;
      }
      if (!valid && doc.plain_password && password === doc.plain_password) {
        valid = true;
      }

      if (valid) {
        console.log(`[Auth-HRMS] HRMS user validated successfully: ${doc._id}`);
        let photo = extractProfilePhoto(doc);
        if (!photo) {
          const empDoc = await empCol.findOne({
            $or: [
              ...(doc.email ? [{ email: doc.email }] : []),
              ...(doc.employeeId ? [{ emp_no: doc.employeeId }, { emp_no: doc.employeeId.toUpperCase() }] : []),
              ...(doc.username ? [{ emp_no: doc.username }, { emp_no: doc.username.toUpperCase() }] : [])
            ]
          });
          if (empDoc) photo = extractProfilePhoto(empDoc);
        }
        return {
          id: doc._id.toString(),
          email: doc.email || null,
          name: doc.name || doc.username || null,
          role: doc.role || 'user',
          phone: doc.phone_number || doc.phone || doc.mobile || doc.contact || null,
          employeeId: doc.employeeId || (doc._id ? doc._id.toString() : null),
          profilePhoto: photo || null,
          databaseSource: 'hrms'
        };
      } else {
        console.log(`[Auth-HRMS] Password mismatch or no hash for user: ${doc.email || doc.username}`);
      }
    } else {
      console.log(`[Auth-HRMS] No document found in users collection for identifier: ${identifier}`);
    }

    console.log(`[Auth-HRMS] Checking employees collection for identifier: ${identifier}`);
    const upperId = identifier.toUpperCase();
    // 2) Employee collection: by email or emp_no, active only
    doc = await empCol.findOne({
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
        console.log(`[Auth-HRMS] Verifying password for employee: ${doc.email}`);
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
        console.log(`[Auth-HRMS] Password mismatch or no hash for employee: ${doc.email}`);
      }
    } else {
      console.log(`[Auth-HRMS] No document found in employees collection for email: ${identifier}`);
    }

    console.log(`[Auth] HRMS: user not found or invalid password for: ${identifier}`);
    return null;
  } catch (error) {
    console.error('[HRMS] validateHRMSCredentials error:', error.message);
    return null;
  }
};

/**
 * Find HRMS User or Employee by email (and optionally by employee number).
 * HRMS resolves in order: _id (ObjectId), email, employeeId/emp_no, name.
 * @param {string} email - User email
 * @param {string} [employeeId] - Optional employee number (e.g. EMP001)
 * @returns {Promise<{ userId: string, email: string, profilePhoto?: string }|null>} HRMS _id as string, email, profilePhoto or null
 */
export const findHRMSUserByEmail = async (email, employeeId = null) => {
  if ((!email || typeof email !== 'string') && (!employeeId || typeof employeeId !== 'string')) {
    return null;
  }
  const db = await getHRMSDb();
  if (!db) {
    return null;
  }
  const userCollection = db.collection('users');
  const employeeCollection = db.collection('employees');

  try {
    const normalizedEmail = email && typeof email === 'string' ? email.trim() : null;
    // 1) Try by email in User collection (only active users) if email exists
    if (normalizedEmail) {
      let doc = await userCollection.findOne({
        email: normalizedEmail,
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
      });
      if (doc && doc._id) {
        let photo = extractProfilePhoto(doc);
        if (!photo) {
          const emp = await employeeCollection.findOne({ email: normalizedEmail });
          if (emp) photo = extractProfilePhoto(emp);
        }
        return { userId: doc._id.toString(), email: doc.email || email, profilePhoto: photo || null };
      }

      // 2) Try by email in Employee collection (only active)
      doc = await employeeCollection.findOne({
        email: normalizedEmail,
        $or: [{ is_active: true }, { is_active: { $exists: false } }]
      });
      if (doc && doc._id) {
        return { userId: doc._id.toString(), email: doc.email || email, profilePhoto: extractProfilePhoto(doc) };
      }
    }

    // 3) If we have employee number, try User.employeeId or Employee.emp_no (HRMS treats uppercase)
    if (employeeId && typeof employeeId === 'string') {
      const empNo = employeeId.trim().toUpperCase();
      doc = await userCollection.findOne({
        $or: [
          { employeeId: empNo },
          { employeeId: employeeId.trim() }
        ]
      });
      if (doc && doc._id) {
        let photo = extractProfilePhoto(doc);
        if (!photo) {
          const emp = await employeeCollection.findOne({ $or: [{ emp_no: empNo }, { emp_no: employeeId.trim() }] });
          if (emp) photo = extractProfilePhoto(emp);
        }
        return { userId: doc._id.toString(), email: doc.email || email, profilePhoto: photo || null };
      }
      doc = await employeeCollection.findOne({
        $or: [
          { emp_no: empNo },
          { emp_no: employeeId.trim() }
        ]
      });
      if (doc && doc._id) {
        return { userId: doc._id.toString(), email: doc.email || email, profilePhoto: extractProfilePhoto(doc) };
      }
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

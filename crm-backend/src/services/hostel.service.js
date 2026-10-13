import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getHostelDb } from '../config/database.js';

/**
 * Hostel Service
 * Validates hostel login credentials and resolves users for SSO verify-token.
 * Uses Hostel MongoDB: collections `admins` (staff) and `users` (students).
 * Both use `password` field with bcrypt (same as HRMS pattern).
 */

const ADMINS_COLLECTION = 'admins';
const USERS_COLLECTION = 'users';

/**
 * Validate hostel credentials (for login when portalId is hostel-automation).
 * Tries admins by username first, then users (students) by rollNumber or admissionNumber.
 * Passwords are bcrypt-hashed in both collections.
 * @param {string} username - Username (admin) or rollNumber/admissionNumber (student)
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized user { id, username, email, name, role, databaseSource: 'hostel' } or null
 */
export const validateHostelCredentials = async (username, password) => {
  if (!username || !password) return null;
  const db = await getHostelDb();
  if (!db) {
    console.log('[Auth] Hostel login requested but HOSTEL_MONGO_URI not configured');
    return null;
  }
  const identifier = String(username).trim();
  const adminsCol = db.collection(ADMINS_COLLECTION);
  const usersCol = db.collection(USERS_COLLECTION);

  try {
    // 1) Admins: by username, active only
    let doc = await adminsCol.findOne({
      username: identifier,
      $or: [{ isActive: true }, { isActive: { $exists: false } }]
    });
    if (doc && doc.password) {
      const valid = await bcrypt.compare(password, doc.password);
      if (valid) {
        console.log(`[Auth] Hostel admin found: ${doc._id}, username: ${doc.username}`);
        return {
          id: doc._id.toString(),
          username: doc.username,
          email: doc.email || null,
          name: doc.customRole || doc.role || doc.username,
          role: doc.role || 'sub_admin',
          databaseSource: 'hostel'
        };
      }
    }

    // 2) Users (students): by rollNumber or admissionNumber (uppercase per schema)
    const upperId = identifier.toUpperCase();
    doc = await usersCol.findOne({
      $or: [
        { rollNumber: upperId },
        { rollNumber: identifier },
        { admissionNumber: upperId },
        { admissionNumber: identifier }
      ],
      role: 'student'
    });
    if (doc && doc.password) {
      const valid = await bcrypt.compare(password, doc.password);
      if (valid) {
        console.log(`[Auth] Hostel student found: ${doc._id}, rollNumber: ${doc.rollNumber}`);
        return {
          id: doc._id.toString(),
          username: doc.rollNumber || doc.admissionNumber,
          email: doc.email || null,
          name: doc.name || doc.rollNumber,
          role: 'student',
          databaseSource: 'hostel'
        };
      }
    }

    console.log(`[Auth] Hostel: user not found or invalid password for: ${identifier}`);
    return null;
  } catch (error) {
    console.error('[Hostel] validateHostelCredentials error:', error.message);
    return null;
  }
};

/**
 * Get hostel user or admin by _id (for verify-token when databaseSource is hostel).
 * @param {string} userId - Hostel _id as string (24-char hex)
 * @returns {Promise<{ email?: string, name?: string, username?: string, role?: string }|null>}
 */
export const getHostelUserById = async (userId) => {
  if (!userId || typeof userId !== 'string') return null;
  const db = await getHostelDb();
  if (!db) return null;
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) return null;
    const _id = new ObjectId(userId);
    let doc = await db.collection(ADMINS_COLLECTION).findOne({ _id });
    if (doc) {
      return {
        email: doc.email || null,
        name: doc.customRole || doc.role || doc.username,
        username: doc.username,
        role: doc.role
      };
    }
    doc = await db.collection(USERS_COLLECTION).findOne({ _id });
    if (doc) {
      return {
        email: doc.email || null,
        name: doc.name || null,
        username: doc.rollNumber || doc.admissionNumber,
        role: doc.role || 'student'
      };
    }
    return null;
  } catch (error) {
    console.error('[Hostel] getHostelUserById error:', error.message);
    return null;
  }
};

/**
 * Resolve CRM user to Hostel identity for verify-token (so HMS can find user in users or admins).
 * Tries: admins by username/email, then users by email/rollNumber/admissionNumber.
 * @param {string} [email] - Email from CRM user
 * @param {string} [username] - Username from CRM user (can match admin username or student rollNumber)
 * @param {string} [rollNumber] - Optional roll/admission number for student match
 * @returns {Promise<{ userId: string, email?: string, username?: string, role?: string }|null>}
 */
export const findHostelUserForVerify = async (email = null, username = null, rollNumber = null) => {
  const db = await getHostelDb();
  if (!db) return null;
  const adminsCol = db.collection(ADMINS_COLLECTION);
  const usersCol = db.collection(USERS_COLLECTION);

  try {
    // 1) Admins: by email or username (active only)
    if (email || username) {
      const or = [];
      if (email) or.push({ email: email.trim().toLowerCase() });
      if (username) or.push({ username: username.trim() });
      if (or.length) {
        const doc = await adminsCol.findOne({
          $and: [
            { $or: or },
            { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
          ]
        });
        if (doc && doc._id) {
          return {
            userId: doc._id.toString(),
            email: doc.email || null,
            username: doc.username,
            role: doc.role
          };
        }
      }
    }

    // 2) Users (students): by email, rollNumber, or admissionNumber (uppercase)
    const idUpper = (rollNumber || username || '').toString().trim().toUpperCase();
    const emailNorm = email ? email.trim().toLowerCase() : null;
    const or = [];
    if (emailNorm) or.push({ email: emailNorm });
    if (idUpper) {
      or.push({ rollNumber: idUpper }, { admissionNumber: idUpper });
    }
    const usernameTrim = username ? String(username).trim() : null;
    if (usernameTrim && usernameTrim !== idUpper) {
      or.push({ rollNumber: usernameTrim }, { admissionNumber: usernameTrim });
    }
    if (or.length) {
      const doc = await usersCol.findOne({ $or: or, role: 'student' });
      if (doc && doc._id) {
        return {
          userId: doc._id.toString(),
          email: doc.email || null,
          username: doc.rollNumber || doc.admissionNumber,
          role: 'student'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Hostel] findHostelUserForVerify error:', error.message);
    return null;
  }
};

export default {
  validateHostelCredentials,
  getHostelUserById,
  findHostelUserForVerify
};

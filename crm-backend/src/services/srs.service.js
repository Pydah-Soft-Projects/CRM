import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getSRSDb } from '../config/database.js';

/**
 * Staff Recruitment System (SRS) Service
 * Handles authentication and user resolution for the Staff Recruitment portal (srs.pydah.edu.in).
 * Primary source of truth: 'users' collection (User model).
 */

/**
 * Validate SRS credentials (for login when portalId is staff-recruitment).
 * Checks 'users' collection for email / employeeId / name / phone and verifies password.
 * If employee has no local password, falls back to HRMS authentication.
 * 
 * @param {string} username - User email / employeeId / name / phone
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized user or null
 */
export const validateSRSCredentials = async (username, password) => {
  if (!username || !password) return null;

  const db = await getSRSDb();
  if (!db) {
    console.log('[Auth-SRS] SRS login requested but SRS_MONGO_URI not configured');
    return null;
  }

  const usersCol = db.collection('users');
  const identifier = username.trim();
  const lowerIdentifier = identifier.toLowerCase();

  try {
    console.log(`[Auth-SRS] Checking SRS users collection for: ${identifier}`);
    
    const orConds = [
      { email: lowerIdentifier },
      { email: identifier },
      { employeeId: identifier },
      { name: identifier }
    ];

    if (/^\d{10}$/.test(identifier)) {
      orConds.push({ 'profile.phone': identifier });
    }

    const user = await usersCol.findOne({
      $or: orConds,
      $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }]
    });

    if (user) {
      console.log(`[Auth-SRS] Found user: ${user.name} (${user.email}), role: ${user.role}`);

      // 1. If user has a local password hash in SRS, verify with bcrypt
      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          console.log(`[Auth-SRS] SRS user validated successfully via local password: ${user._id}`);
          return normalizeSRSUser(user);
        } else {
          console.log(`[Auth-SRS] Local password mismatch for: ${user.email}`);
        }
      }

      // 2. If user is an HRMS employee without a local password (or password mismatch), authenticate via HRMS
      if (user.employeeId || !user.password) {
        console.log(`[Auth-SRS] Attempting HRMS fallback authentication for employeeId: ${user.employeeId || user.email}`);
        try {
          const { validateCredentialsForHRMS } = await import('./auth.service.js');
          const hrmsUser = await validateCredentialsForHRMS(user.employeeId || user.email, password);
          if (hrmsUser) {
            console.log(`[Auth-SRS] HRMS fallback authentication succeeded for SRS user: ${user._id}`);
            return normalizeSRSUser(user);
          }
        } catch (hrmsErr) {
          console.warn('[Auth-SRS] HRMS fallback check error:', hrmsErr.message);
        }
      }
    } else {
      console.log(`[Auth-SRS] No active SRS user found with identifier: ${identifier}`);
    }

    return null;
  } catch (error) {
    console.error('[SRS] validateSRSCredentials error:', error.message);
    return null;
  }
};

/**
 * Find SRS User by _id (for verify-token lookup).
 * @param {string} userId - User _id as string
 * @returns {Promise<Object|null>} Normalized SRS user or null
 */
export const getSRSUserById = async (userId) => {
  if (!userId) return null;
  const db = await getSRSDb();
  if (!db) return null;

  try {
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) return null;
    const objId = new ObjectId(userId);

    const user = await db.collection('users').findOne({
      _id: objId,
      $or: [{ isActive: true }, { isActive: { $exists: false } }]
    });

    if (user) {
      return normalizeSRSUser(user);
    }

    return null;
  } catch (error) {
    console.error('[SRS] getSRSUserById error:', error.message);
    return null;
  }
};

/**
 * Find SRS User by query filter (email, employeeId, phone, name).
 * @param {Object} query - MongoDB query filter
 * @returns {Promise<Object|null>} Normalized SRS user or null
 */
export const findSRSUser = async (query) => {
  if (!query) return null;
  const db = await getSRSDb();
  if (!db) return null;

  try {
    const user = await db.collection('users').findOne({
      ...query,
      $or: [{ isActive: true }, { isActive: { $exists: false } }]
    });

    if (user) {
      return normalizeSRSUser(user);
    }

    return null;
  } catch (error) {
    console.error('[SRS] findSRSUser error:', error.message);
    return null;
  }
};

/**
 * Helper to normalize SRS user document into standard CRM auth payload
 */
function normalizeSRSUser(user) {
  return {
    id: user._id.toString(),
    userId: user._id.toString(),
    username: user.email || user.name || user.employeeId,
    name: user.name,
    email: user.email ? user.email.trim().toLowerCase() : null,
    role: user.role || 'candidate',
    employeeId: user.employeeId || null,
    empNo: user.employeeId || null,
    campus: user.campus || null,
    courses: user.courses || [],
    permissions: user.permissions || {},
    hasPanelMemberAccess: Boolean(user.hasPanelMemberAccess),
    profile: user.profile || {},
    phone: user.profile?.phone || null,
    isActive: user.isActive !== false,
    databaseSource: 'srs'
  };
}

export default {
  validateSRSCredentials,
  getSRSUserById,
  findSRSUser
};

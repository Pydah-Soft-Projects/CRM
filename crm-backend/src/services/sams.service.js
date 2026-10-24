import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getSAMSDb } from '../config/database.js';

/**
 * SAMS (Labour Management System) Service
 * Handles authentication and user resolution for SAMS portal (sams.pydah.edu.in).
 * Primary source of truth: 'systemusers' collection (SystemUser model).
 */

/**
 * Helper to get the SystemUsers collection (handling potential case variations)
 */
async function getSystemUsersCollection(db) {
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);
  if (names.includes('systemusers')) return db.collection('systemusers');
  if (names.includes('systemUsers')) return db.collection('systemUsers');
  if (names.includes('SystemUsers')) return db.collection('SystemUsers');
  return db.collection('systemusers');
}

/**
 * Validate SAMS credentials (for login when portalId is sams).
 * Checks 'systemusers' collection for username / email / hrmsEmployeeId / displayName.
 * Compares passwordHash via bcrypt, or falls back to HRMS auth for employees with hrmsEmployeeId.
 * 
 * @param {string} username - Username / email / hrmsEmployeeId / displayName
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized SAMS user or null
 */
export const validateSAMSCredentials = async (username, password) => {
  if (!username || !password) return null;

  const db = await getSAMSDb();
  if (!db) {
    console.log('[Auth-SAMS] SAMS login requested but SAMS_MONGO_URI not configured');
    return null;
  }

  const identifier = username.trim();
  const lowerIdentifier = identifier.toLowerCase();

  try {
    const col = await getSystemUsersCollection(db);
    console.log(`[Auth-SAMS] Checking SAMS systemusers collection for: ${identifier}`);

    const orConds = [
      { username: lowerIdentifier },
      { username: identifier },
      { email: lowerIdentifier },
      { email: identifier },
      { hrmsEmployeeId: identifier },
      { displayName: identifier }
    ];

    const user = await col.findOne({
      $or: orConds,
      $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }]
    });

    if (user) {
      console.log(`[Auth-SAMS] Found SAMS user: ${user.username} (${user.displayName}), isSuperAdmin: ${user.isSuperAdmin}`);

      // 1. If user has a passwordHash in SAMS, verify with bcrypt
      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
          console.log(`[Auth-SAMS] SAMS user validated successfully via passwordHash: ${user._id}`);
          return normalizeSAMSUser(user);
        } else {
          console.log(`[Auth-SAMS] Password hash mismatch for SAMS user: ${user.username}`);
        }
      }

      // 2. If user is linked to HRMS employee ID, fallback to HRMS authentication
      if (user.hrmsEmployeeId) {
        console.log(`[Auth-SAMS] Attempting HRMS fallback authentication for hrmsEmployeeId: ${user.hrmsEmployeeId}`);
        try {
          const { validateCredentialsForHRMS } = await import('./auth.service.js');
          const hrmsUser = await validateCredentialsForHRMS(user.hrmsEmployeeId, password);
          if (hrmsUser) {
            console.log(`[Auth-SAMS] HRMS fallback authentication succeeded for SAMS user: ${user._id}`);
            return normalizeSAMSUser(user);
          }
        } catch (hrmsErr) {
          console.warn('[Auth-SAMS] HRMS fallback check error:', hrmsErr.message);
        }
      }
    } else {
      console.log(`[Auth-SAMS] No active SAMS user found with identifier: ${identifier}`);
    }

    return null;
  } catch (error) {
    console.error('[SAMS] validateSAMSCredentials error:', error.message);
    return null;
  }
};

/**
 * Find SAMS SystemUser by _id (for verify-token lookup).
 * @param {string} userId - User _id as string
 * @returns {Promise<Object|null>} Normalized SAMS user or null
 */
export const getSAMSUserById = async (userId) => {
  if (!userId) return null;
  const db = await getSAMSDb();
  if (!db) return null;

  try {
    const col = await getSystemUsersCollection(db);
    const orConditions = [];

    if (/^[0-9a-fA-F]{24}$/.test(String(userId))) {
      try {
        orConditions.push({ _id: new ObjectId(String(userId)) });
      } catch (_) {}
    }
    orConditions.push({ hrmsEmployeeId: String(userId).trim() });
    orConditions.push({ username: String(userId).trim().toLowerCase() });

    const user = await col.findOne({
      $or: orConditions,
      $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }]
    });

    if (user) {
      return normalizeSAMSUser(user);
    }

    return null;
  } catch (error) {
    console.error('[SAMS] getSAMSUserById error:', error.message);
    return null;
  }
};

/**
 * Find SAMS SystemUser by query filter.
 * @param {Object} query - MongoDB query filter
 * @returns {Promise<Object|null>} Normalized SAMS user or null
 */
export const findSAMSUser = async (query) => {
  if (!query || Object.keys(query).length === 0) return null;
  const db = await getSAMSDb();
  if (!db) return null;

  try {
    const col = await getSystemUsersCollection(db);
    const activeCondition = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };
    const finalFilter = {
      $and: [
        query,
        activeCondition
      ]
    };

    const user = await col.findOne(finalFilter);

    if (user) {
      return normalizeSAMSUser(user);
    }

    return null;
  } catch (error) {
    console.error('[SAMS] findSAMSUser error:', error.message);
    return null;
  }
};

/**
 * Helper to normalize SAMS SystemUser document into standard CRM auth payload
 */
function normalizeSAMSUser(user) {
  return {
    id: user._id.toString(),
    userId: user._id.toString(),
    username: user.username,
    name: user.displayName || user.username,
    displayName: user.displayName,
    email: user.email ? user.email.trim().toLowerCase() : null,
    role: user.isSuperAdmin ? 'super_admin' : 'operator',
    isSuperAdmin: Boolean(user.isSuperAdmin),
    hrmsEmployeeId: user.hrmsEmployeeId || null,
    employeeId: user.hrmsEmployeeId || null,
    empNo: user.hrmsEmployeeId || null,
    systemRoleId: user.systemRoleId ? user.systemRoleId.toString() : null,
    divisionIds: (user.divisionIds || []).map(id => id.toString()),
    gateIds: (user.gateIds || []).map(id => id.toString()),
    departmentIds: (user.departmentIds || []).map(id => id.toString()),
    allowedLocationIds: (user.allowedLocationIds || []).map(id => id.toString()),
    gateAccessModes: user.gateAccessModes || {},
    departmentAccessModes: user.departmentAccessModes || {},
    isActive: user.isActive !== false,
    databaseSource: 'sams'
  };
}

export default {
  validateSAMSCredentials,
  getSAMSUserById,
  findSAMSUser
};

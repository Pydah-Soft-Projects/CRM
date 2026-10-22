import bcrypt from 'bcryptjs';
import { getStationaryDb } from '../config/database.js';

/**
 * Stationary Service
 * Handles authentication for the Stationary Management portal.
 * Primary source of truth: 'subadmins' collection (SubAdmin model).
 */

/**
 * Validate Stationary credentials (for login when portalId is stationary-management).
 * Checks 'subadmins' collection for username/name/empNo and verifies password.
 * @param {string} username - User username / name / empNo
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized user or null
 */
export const validateStationaryCredentials = async (username, password) => {
  if (!username || !password) return null;

  const db = await getStationaryDb();
  if (!db) {
    console.log('[Auth-Stationary] Stationary login requested but STATIONARY_MONGO_URI not configured');
    return null;
  }

  const subAdminCol = db.collection('subadmins');
  const identifier = username.trim();

  try {
    console.log(`[Auth-Stationary] Checking subadmins collection for: ${identifier}`);
    // Check by name (login ID) or empNo (case-insensitive regex for name, exact/regex for empNo)
    let subAdmin = await subAdminCol.findOne({
      $or: [
        { name: identifier },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { empNo: identifier }
      ]
    });

    // Secondary fallback: check 'users' collection if present
    if (!subAdmin) {
      try {
        subAdmin = await db.collection('users').findOne({
          $or: [
            { username: identifier },
            { name: identifier },
            { email: identifier }
          ]
        });
      } catch (_) {}
    }

    if (subAdmin) {
      console.log(`[Auth-Stationary] Found subAdmin: ${subAdmin.name || subAdmin.username}`);

      if (subAdmin.password) {
        const isMatch = await bcrypt.compare(password, subAdmin.password);

        if (isMatch) {
          console.log(`[Auth-Stationary] Stationary subAdmin validated successfully: ${subAdmin._id}`);
          return {
            id: subAdmin._id.toString(),
            userId: subAdmin._id.toString(),
            username: subAdmin.name || subAdmin.username,
            name: subAdmin.name || subAdmin.username,
            role: subAdmin.role || 'Editor',
            empNo: subAdmin.empNo || null,
            employeeId: subAdmin.empNo || null,
            hrms_id: subAdmin.empNo || null,
            permissions: subAdmin.permissions || [],
            assignedCollege: subAdmin.assignedCollege ? subAdmin.assignedCollege.toString() : null,
            assignedBranch: subAdmin.assignedBranch ? subAdmin.assignedBranch.toString() : null,
            databaseSource: 'stationary'
          };
        } else {
          console.log(`[Auth-Stationary] Password mismatch for: ${subAdmin.name || subAdmin.username}`);
        }
      } else {
        console.log(`[Auth-Stationary] SubAdmin ${subAdmin.name} found but has no password set in Stationary DB`);
      }
    } else {
      console.log(`[Auth-Stationary] No subAdmin found with identifier: ${identifier}`);
    }

    return null;
  } catch (error) {
    console.error('[Stationary] validateStationaryCredentials error:', error.message);
    return null;
  }
};

/**
 * Find Stationary SubAdmin by _id (for verify-token lookup).
 * @param {string} userId - User _id as string
 * @returns {Promise<Object|null>}
 */
export const getStationarySubAdminById = async (userId) => {
  if (!userId) return null;
  const db = await getStationaryDb();
  if (!db) return null;

  try {
    const { ObjectId } = await import('mongodb');
    let subAdmin = null;
    try {
      subAdmin = await db.collection('subadmins').findOne({ _id: new ObjectId(userId) });
    } catch (_) {}

    if (!subAdmin) {
      try {
        subAdmin = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      } catch (_) {}
    }

    if (!subAdmin) return null;

    return {
      id: subAdmin._id.toString(),
      userId: subAdmin._id.toString(),
      username: subAdmin.name || subAdmin.username,
      name: subAdmin.name || subAdmin.username,
      role: subAdmin.role || 'Editor',
      empNo: subAdmin.empNo || null,
      employeeId: subAdmin.empNo || null,
      hrms_id: subAdmin.empNo || null,
      permissions: subAdmin.permissions || [],
      assignedCollege: subAdmin.assignedCollege ? subAdmin.assignedCollege.toString() : null,
      assignedBranch: subAdmin.assignedBranch ? subAdmin.assignedBranch.toString() : null,
      databaseSource: 'stationary'
    };
  } catch (error) {
    console.error('[Stationary] getStationarySubAdminById error:', error.message);
    return null;
  }
};

/**
 * Find Stationary SubAdmin by query filter (name, empNo, etc.)
 * @param {Object} query - Mongo query filter
 * @returns {Promise<Object|null>}
 */
export const findStationarySubAdmin = async (query) => {
  if (!query) return null;
  const db = await getStationaryDb();
  if (!db) return null;

  try {
    const subAdmin = await db.collection('subadmins').findOne(query);
    if (!subAdmin) return null;

    return {
      id: subAdmin._id.toString(),
      userId: subAdmin._id.toString(),
      username: subAdmin.name || subAdmin.username,
      name: subAdmin.name || subAdmin.username,
      role: subAdmin.role || 'Editor',
      empNo: subAdmin.empNo || null,
      employeeId: subAdmin.empNo || null,
      hrms_id: subAdmin.empNo || null,
      permissions: subAdmin.permissions || [],
      assignedCollege: subAdmin.assignedCollege ? subAdmin.assignedCollege.toString() : null,
      assignedBranch: subAdmin.assignedBranch ? subAdmin.assignedBranch.toString() : null,
      databaseSource: 'stationary'
    };
  } catch (error) {
    console.error('[Stationary] findStationarySubAdmin error:', error.message);
    return null;
  }
};

export default {
  validateStationaryCredentials,
  getStationarySubAdminById,
  findStationarySubAdmin
};

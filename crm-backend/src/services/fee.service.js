import bcrypt from 'bcryptjs';
import { getFeeDb } from '../config/database.js';

/**
 * Fee Service
 * Handles authentication for the Fee Management portal.
 * Use the 'User' model/collection as the primary source of truth.
 */

/**
 * Validate Fee credentials (for login when portalId is fee-management).
 * Checks 'users' collection for username and verifies password.
 * @param {string} username - User username
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized user { id, username, role, databaseSource: 'fee' } or null
 */
export const validateFeeCredentials = async (username, password) => {
  if (!username || !password) return null;
  
  const db = await getFeeDb();
  if (!db) {
    console.log('[Auth-Fee] Fee login requested but FEE_MONGO_URI not configured');
    return null;
  }

  const userCol = db.collection('users');
  const identifier = username.trim();

  try {
    console.log(`[Auth-Fee] Checking users collection for username: ${identifier}`);
    const user = await userCol.findOne({ username: identifier });

    if (user) {
      console.log(`[Auth-Fee] Found fee user: ${user.username}`);
      
      // If password is present, check it. (User mentioned it might be optional if it comes from external DB, 
      // but for local 'users' check we usually need a password)
      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
          console.log(`[Auth-Fee] Fee user validated successfully: ${user._id}`);
          return {
            id: user._id.toString(),
            username: user.username,
            name: user.name || user.username,
            role: user.role || 'office_staff',
            employeeId: user.employeeId || null,
            hrms_id: user.employeeId || null,
            phone: user.mobile || null,
            mobile: user.mobile || null,
            email: user.email || null,
            databaseSource: 'fee'
          };
        } else {
          console.log(`[Auth-Fee] Password mismatch for user: ${user.username}`);
        }
      } else {
        console.log(`[Auth-Fee] User ${user.username} found but has no password set in Fee DB`);
      }
    } else {
      console.log(`[Auth-Fee] No user found with username: ${identifier}`);
    }

    return null;
  } catch (error) {
    console.error('[Fee] validateFeeCredentials error:', error.message);
    return null;
  }
};

/**
 * Find Fee User by _id (for verify-token lookup).
 * @param {string} userId - User _id as string
 * @returns {Promise<Object|null>}
 */
export const getFeeUserById = async (userId) => {
  if (!userId) return null;
  const db = await getFeeDb();
  if (!db) return null;

  try {
    const { ObjectId } = await import('mongodb');
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      username: user.username,
      name: user.name || user.username,
      email: user.email || null,
      role: user.role || 'office_staff',
      employeeId: user.employeeId || null,
      hrms_id: user.employeeId || null,
      phone: user.mobile || null,
      mobile: user.mobile || null
    };
  } catch (error) {
    console.error('[Fee] getFeeUserById error:', error.message);
    return null;
  }
};

export default {
  validateFeeCredentials,
  getFeeUserById
};

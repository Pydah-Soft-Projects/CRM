import { getStudentPool } from '../config/database.js';

/**
 * RBAC Model
 * Handles all database operations for rbac_users table
 */

/**
 * Find RBAC user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findRBACUserByUsername = async (username) => {
  try {
    const pool = getStudentPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, username, password, role, 
              college_id, course_id, branch_id, college_ids, course_ids, branch_ids,
              all_courses, all_branches, permissions, is_active, 
              created_by, created_at, updated_at, hrms_id 
       FROM rbac_users 
       WHERE username = ? AND is_active = 1`,
      [username]
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return {
      ...user,
      role: user.role, // Already in correct format
    };
  } catch (error) {
    console.error('Error finding RBAC user by username:', error);
    throw error;
  }
};

/**
 * Find RBAC user by email
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findRBACUserByEmail = async (email) => {
  try {
    const pool = getStudentPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, username, password, role, 
              college_id, course_id, branch_id, college_ids, course_ids, branch_ids,
              all_courses, all_branches, permissions, is_active, 
              created_by, created_at, updated_at, hrms_id 
       FROM rbac_users 
       WHERE email = ? AND is_active = 1`,
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return {
      ...user,
      role: user.role,
    };
  } catch (error) {
    console.error('Error finding RBAC user by email:', error);
    throw error;
  }
};

/**
 * Find RBAC user by ID
 * @param {string|number} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findRBACUserById = async (id) => {
  try {
    const pool = getStudentPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, username, password, role, 
              college_id, course_id, branch_id, college_ids, course_ids, branch_ids,
              all_courses, all_branches, permissions, is_active, 
              created_by, created_at, updated_at, hrms_id 
       FROM rbac_users 
       WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return {
      ...user,
      role: user.role,
    };
  } catch (error) {
    console.error('Error finding RBAC user by ID:', error);
    throw error;
  }
};

/**
 * Find RBAC user by username or email
 * @param {string} identifier - Username or email to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findRBACUserByIdentifier = async (identifier) => {
  try {
    // Try username first
    let user = await findRBACUserByUsername(identifier);
    if (user) {
      return user;
    }

    // If not found, try email
    user = await findRBACUserByEmail(identifier);
    return user;
  } catch (error) {
    console.error('Error finding RBAC user by identifier:', error);
    throw error;
  }
};

export default {
  findRBACUserByUsername,
  findRBACUserByEmail,
  findRBACUserById,
  findRBACUserByIdentifier,
};

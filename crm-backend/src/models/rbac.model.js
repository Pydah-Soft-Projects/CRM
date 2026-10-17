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

export const findRBACUserByHrmsId = async (hrmsId) => {
  try {
    if (!hrmsId) return null;
    const pool = getStudentPool();
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, username, password, role, 
              college_id, course_id, branch_id, college_ids, course_ids, branch_ids,
              all_courses, all_branches, permissions, is_active, 
              created_by, created_at, updated_at, hrms_id 
       FROM rbac_users 
       WHERE hrms_id = ? AND is_active = 1`,
      [String(hrmsId)]
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
    console.error('Error finding RBAC user by hrms_id:', error);
    throw error;
  }
};

/**
 * Find RBAC user by username, email, hrms_id, or numeric employee number
 * @param {string} identifier - Username, email, emp_no, or hrms_id to search for
 * @param {Object} [options] - Optional secondary fields { email, hrmsId }
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findRBACUserByIdentifier = async (identifier, options = {}) => {
  try {
    if (!identifier && !options.email && !options.hrmsId) return null;
    const pool = getStudentPool();

    // 1. If explicit hrmsId provided, try that first
    if (options.hrmsId) {
      const byHrms = await findRBACUserByHrmsId(options.hrmsId);
      if (byHrms) return byHrms;
    }

    if (identifier) {
      const strId = String(identifier).trim();

      // 2. Try username
      let user = await findRBACUserByUsername(strId);
      if (user) return user;

      // 3. Try email
      user = await findRBACUserByEmail(strId);
      if (user) return user;

      // 4. Try hrms_id if 24 hex characters
      if (/^[0-9a-fA-F]{24}$/.test(strId)) {
        user = await findRBACUserByHrmsId(strId);
        if (user) return user;
      }

      // 5. If numeric (e.g. employee number '1559', '2153'), match email = ? or email LIKE CONCAT(?, '@%')
      if (/^\d+$/.test(strId)) {
        const [rows] = await pool.execute(
          `SELECT id, name, email, phone, username, password, role, 
                  college_id, course_id, branch_id, college_ids, course_ids, branch_ids,
                  all_courses, all_branches, permissions, is_active, 
                  created_by, created_at, updated_at, hrms_id 
           FROM rbac_users 
           WHERE (email = ? OR email LIKE CONCAT(?, '@%') OR username = ?) AND is_active = 1 LIMIT 1`,
          [strId, strId, strId]
        );
        if (rows.length > 0) return rows[0];
      }
    }

    // 6. If email option provided
    if (options.email) {
      const user = await findRBACUserByEmail(options.email);
      if (user) return user;
    }

    return null;
  } catch (error) {
    console.error('Error finding RBAC user by identifier:', error);
    throw error;
  }
};

export default {
  findRBACUserByUsername,
  findRBACUserByEmail,
  findRBACUserById,
  findRBACUserByHrmsId,
  findRBACUserByIdentifier,
};

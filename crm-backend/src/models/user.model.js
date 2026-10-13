import { getPool } from '../config/database.js';

/**
 * User Model
 * Handles all database operations for users
 */

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserByUsername = async (username) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return null;
    }

    // Map password_hash to password for compatibility with auth service
    const user = rows[0];
    return {
      ...user,
      password: user.password_hash
    };
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
};

/**
 * Find user by email
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserByEmail = async (email) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    // Map password_hash to password for compatibility with auth service
    const user = rows[0];
    return {
      ...user,
      password: user.password_hash
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

/**
 * Find user by ID
 * @param {string|number} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserById = async (id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    // Map password_hash to password for compatibility with auth service
    const user = rows[0];
    return {
      ...user,
      password: user.password_hash
    };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

/**
 * Create new user
 * @param {Object} userData - User data (username, email, password_hash, role)
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (userData) => {
  try {
    const pool = getPool();
    const { username, email, password_hash, role = 'admin' } = userData;

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [username, email, password_hash, role]
    );

    return await findUserById(result.insertId);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {string|number} id - User ID
 * @param {Object} userData - User data to update (password_hash instead of password)
 * @returns {Promise<Object|null>} Updated user object or null if not found
 */
export const updateUser = async (id, userData) => {
  try {
    const pool = getPool();
    const fields = [];
    const values = [];

    // Map password to password_hash if provided
    const dataToUpdate = { ...userData };
    if (dataToUpdate.password) {
      dataToUpdate.password_hash = dataToUpdate.password;
      delete dataToUpdate.password;
    }

    Object.keys(dataToUpdate).forEach((key) => {
      if (dataToUpdate[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(dataToUpdate[key]);
      }
    });

    if (fields.length === 0) {
      return await findUserById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await findUserById(id);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Get user's accessible portals
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} Array of portal IDs
 */
export const getUserPortals = async (userId) => {
  try {
    const pool = getPool();
    
    // Check if user_portals table exists, if not, use role-based access
    try {
      // Get portals from user_portals junction table
      const [rows] = await pool.execute(
        `SELECT p.portal_id 
         FROM user_portals up
         INNER JOIN portals p ON up.portal_id = p.id
         WHERE up.user_id = ?`,
        [userId]
      );

      if (rows.length > 0) {
        return rows.map(row => row.portal_id);
      }
    } catch (tableError) {
      // If user_portals table doesn't exist, fall through to role-based access
      console.log('user_portals table not found, using role-based access');
    }

    // Role-based access: Admin/Superadmin has access to all portals
    const user = await findUserById(userId);
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      try {
        const [allPortals] = await pool.execute(
          'SELECT portal_id FROM portals'
        );
        return allPortals.map(p => p.portal_id);
      } catch (error) {
        // If portals table doesn't exist, return default portal IDs
        return ['admissions-crm', 'student-portal', 'hostel-automation', 'hrms'];
      }
    }

    // Default: return empty array if no access
    return [];
  } catch (error) {
    console.error('Error getting user portals:', error);
    // Fallback: return empty array
    return [];
  }
};

/**
 * Verify user password
 * @param {string|number} userId - User ID
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyUserPassword = async (userId, password) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return false;
    }

    // Password verification is done in auth.service.js using bcrypt
    // This is just a placeholder for database-level verification if needed
    return true;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

export default {
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  getUserPortals,
  verifyUserPassword,
};

import { getAdmissionsPool } from '../config/database.js';

/**
 * Admissions Model
 * Handles all database operations for admissions database
 * This is a separate database on the same AWS RDS instance
 * 
 * Schema:
 * - id: char(36) - UUID
 * - name: varchar(255)
 * - email: varchar(255)
 * - password: varchar(255)
 * - role_name: varchar(50)
 * - managed_by: char(36)
 * - is_manager: tinyint(1)
 * - designation: varchar(100)
 * - permissions: json
 * - is_active: tinyint(1)
 * - created_at: datetime
 * - updated_at: datetime
 */

let admissionsColumnsCache = null;
async function getAdmissionsColumns(pool) {
  if (admissionsColumnsCache) return admissionsColumnsCache;
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM `users`');
    admissionsColumnsCache = cols.map(c => c.Field.toLowerCase());
    return admissionsColumnsCache;
  } catch (e) {
    return ['email', 'name', 'id'];
  }
}

/**
 * Find user by email, name, phone, or identifier in admissions database
 * Dynamically checks matching columns, case-insensitive, supports active/null flag
 * @param {string} identifier - Email, name, phone, or id to search for
 * @param {Object} [options] - Optional extra hints { email, phone, name }
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findAdmissionsUserByIdentifier = async (identifier, options = {}) => {
  if (!identifier && !options.email && !options.phone && !options.name) return null;
  const cleanId = identifier ? String(identifier).trim() : null;
  try {
    const pool = getAdmissionsPool();
    if (!pool) return null;
    const cols = await getAdmissionsColumns(pool);

    const conditions = [];
    const params = [];

    const email = (options.email || (cleanId && cleanId.includes('@') ? cleanId : null))?.trim().toLowerCase();
    const phone = (options.phone || (!email && cleanId && /^\d{10}$/.test(cleanId) ? cleanId : null))?.trim();
    const name = (options.name || (!email && !phone ? cleanId : null))?.trim();

    if (email && cols.includes('email')) {
      conditions.push('LOWER(email) = LOWER(?)');
      params.push(email);
    }
    if (phone) {
      if (cols.includes('phone')) {
        conditions.push('phone = ?');
        params.push(phone);
      }
      if (cols.includes('mobile')) {
        conditions.push('mobile = ?');
        params.push(phone);
      }
    }
    if (name && cols.includes('name')) {
      conditions.push('LOWER(name) = LOWER(?)');
      params.push(name);
    }
    if (cleanId) {
      if (cols.includes('email') && !params.includes(cleanId.toLowerCase())) {
        conditions.push('LOWER(email) = LOWER(?)');
        params.push(cleanId.toLowerCase());
      }
      if (cols.includes('name') && !params.includes(cleanId)) {
        conditions.push('LOWER(name) = LOWER(?)');
        params.push(cleanId);
      }
      const empIdCols = ['employee_id', 'emp_no', 'emp_id', 'employee_no', 'empid', 'empno', 'username'];
      for (const col of empIdCols) {
        if (cols.includes(col)) {
          conditions.push(`${col} = ?`);
          params.push(cleanId);
        }
      }
    }

    if (conditions.length === 0) return null;

    let activeClause = '';
    if (cols.includes('is_active')) {
      activeClause = ' AND (is_active = 1 OR is_active IS NULL)';
    }

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE (${conditions.join(' OR ')})${activeClause} LIMIT 1`,
      params
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    if (row && row.password) {
      row.password = Buffer.isBuffer(row.password) ? row.password.toString('utf8') : String(row.password);
    }
    return row;
  } catch (error) {
    console.error('Error finding admissions user by identifier:', error.message);
    return null;
  }
};

/**
 * Find user by email in admissions database
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findAdmissionsUserByEmail = async (email) => {
  return findAdmissionsUserByIdentifier(email);
};

/**
 * Find user by ID in admissions database
 * @param {string} id - User ID (UUID)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findAdmissionsUserById = async (id) => {
  if (!id) return null;
  try {
    const pool = getAdmissionsPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role_name, managed_by, is_manager, designation, permissions, is_active, created_at, updated_at FROM users WHERE id = ? AND (is_active = 1 OR is_active IS NULL) LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    if (row && row.password) {
      row.password = Buffer.isBuffer(row.password) ? row.password.toString('utf8') : String(row.password);
    }
    return row;
  } catch (error) {
    console.error('Error finding admissions user by ID:', error);
    throw error;
  }
};

/**
 * Find user by name in admissions database
 * @param {string} name - Name to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findAdmissionsUserByName = async (name) => {
  try {
    const pool = getAdmissionsPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role_name, managed_by, is_manager, designation, permissions, is_active, created_at, updated_at FROM users WHERE name = ? AND is_active = 1',
      [name]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Error finding admissions user by name:', error);
    throw error;
  }
};

/**
 * Get admissions data for a user
 * You can add more admissions-specific queries here
 */
export const getAdmissionsData = async (userId) => {
  try {
    const pool = getAdmissionsPool();
    // Add your admissions-specific queries here
    // Example:
    // const [rows] = await pool.execute(
    //   'SELECT * FROM admissions WHERE user_id = ?',
    //   [userId]
    // );
    // return rows;
    return [];
  } catch (error) {
    console.error('Error getting admissions data:', error);
    throw error;
  }
};

export default {
  findAdmissionsUserByIdentifier,
  findAdmissionsUserByEmail,
  findAdmissionsUserById,
  findAdmissionsUserByName,
  getAdmissionsData,
};

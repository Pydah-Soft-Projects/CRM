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
 * @param {string} identifier - Email, name, phone, emp_no, hrms_id, or UUID to search for
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
    const name = (options.name || (!email && !phone && cleanId && cleanId.length > 2 && isNaN(cleanId) ? cleanId : null))?.trim();

    // 1. Match by Email (case-insensitive)
    if (email && cols.includes('email')) {
      conditions.push('LOWER(email) = LOWER(?)');
      params.push(email);
    }

    // 2. Match by Phone / Mobile
    if (phone) {
      if (cols.includes('mobile_number')) {
        conditions.push('mobile_number = ?');
        params.push(phone);
      }
      if (cols.includes('mobile')) {
        conditions.push('mobile = ?');
        params.push(phone);
      }
      if (cols.includes('phone')) {
        conditions.push('phone = ?');
        params.push(phone);
      }
    }

    // 3. Match by Name (case-insensitive)
    if (name && cols.includes('name')) {
      conditions.push('LOWER(name) = LOWER(?)');
      params.push(name);
    }

    // 4. Match by Exact Identifier (UUID id, hrms_id, emp_no)
    if (cleanId) {
      // Check primary key id (UUID)
      if (cols.includes('id') && cleanId.length >= 32) {
        conditions.push('id = ?');
        params.push(cleanId);
      }
      // Check hrms_id (MongoDB ObjectId hex or employee string)
      if (cols.includes('hrms_id')) {
        conditions.push('hrms_id = ?');
        params.push(cleanId);
      }
      // Check emp_no / employee_id
      const empIdCols = ['emp_no', 'employee_id', 'emp_id', 'employee_no', 'empid', 'empno', 'username'];
      for (const col of empIdCols) {
        if (cols.includes(col)) {
          conditions.push(`${col} = ?`);
          params.push(cleanId);
        }
      }
      // Fallback cleanId email or name check if not already added
      if (cols.includes('email') && !params.includes(cleanId.toLowerCase())) {
        conditions.push('LOWER(email) = LOWER(?)');
        params.push(cleanId.toLowerCase());
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
 * Selects all columns including hrms_id, emp_no, mobile_number, etc.
 * @param {string} id - User ID (UUID)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findAdmissionsUserById = async (id) => {
  if (!id) return null;
  try {
    const pool = getAdmissionsPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND (is_active = 1 OR is_active IS NULL) LIMIT 1',
      [String(id).trim()]
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
  if (!name) return null;
  try {
    const pool = getAdmissionsPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(name) = LOWER(?) AND (is_active = 1 OR is_active IS NULL) LIMIT 1',
      [String(name).trim()]
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

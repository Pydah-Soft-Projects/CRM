import { getExaminationPool } from '../config/database.js';

/**
 * Examination Portal Model
 * Queries user tables in the examination_portal database on MySQL RDS.
 * Dynamically resolves table schema (e.g. ems_users, users, ep_users) and caches columns.
 */

let cachedUserTable = null;
let cachedColumns = null;

async function getCandidateUserTable(pool) {
  if (cachedUserTable && cachedColumns) {
    return { table: cachedUserTable, columns: cachedColumns };
  }

  try {
    const [tables] = await pool.query('SHOW TABLES');
    if (!tables || tables.length === 0) return null;

    const tableNames = tables.map((t) => Object.values(t)[0].toLowerCase());
    const candidates = ['ems_users', 'ep_users', 'examination_users', 'users', 'staff_users', 'admin_users', 'staff'];
    const matchedTable = candidates.find((c) => tableNames.includes(c)) || tableNames.find((t) => t.includes('user'));

    if (!matchedTable) {
      console.warn('[ExaminationModel] No recognizable users table found in examination_portal. Tables:', tableNames);
      return null;
    }

    const [cols] = await pool.query(`DESCRIBE \`${matchedTable}\``);
    const colNames = cols.map((c) => c.Field.toLowerCase());

    cachedUserTable = matchedTable;
    cachedColumns = new Set(colNames);

    console.log(`[ExaminationModel] Detected user table: '${cachedUserTable}' with columns: [${Array.from(cachedColumns).join(', ')}]`);
    return { table: cachedUserTable, columns: cachedColumns };
  } catch (err) {
    console.error('[ExaminationModel] getCandidateUserTable error:', err.message);
    return null;
  }
}

/**
 * Find active user in examination_portal by email, username, employeeId, or phone.
 * @param {Object} query - { email, employeeId, username, phone }
 * @returns {Promise<Object|null>} Matching examination user or null
 */
export const findExaminationUser = async ({ email, employeeId, username, phone }) => {
  try {
    const pool = getExaminationPool();
    if (!pool) {
      return null;
    }

    const schema = await getCandidateUserTable(pool);
    if (!schema) {
      return null;
    }

    const { table, columns } = schema;
    const conditions = [];
    const params = [];

    const normEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : null;
    const normUsername = username && typeof username === 'string' ? username.trim() : null;
    const normEmpId = employeeId && typeof employeeId === 'string' ? employeeId.trim() : null;
    const normPhone = phone && typeof phone === 'string' ? phone.trim() : null;

    if (columns.has('email') && normEmail) {
      conditions.push('`email` = ?');
      params.push(normEmail);
    }

    if (columns.has('username')) {
      if (normUsername) {
        conditions.push('`username` = ?');
        params.push(normUsername);
      }
      if (normEmpId && normEmpId !== normUsername) {
        conditions.push('`username` = ?');
        params.push(normEmpId);
      }
    }

    if (columns.has('employee_id') && normEmpId) {
      conditions.push('`employee_id` = ?');
      params.push(normEmpId);
    } else if (columns.has('emp_id') && normEmpId) {
      conditions.push('`emp_id` = ?');
      params.push(normEmpId);
    } else if (columns.has('emp_no') && normEmpId) {
      conditions.push('`emp_no` = ?');
      params.push(normEmpId);
    }

    if (columns.has('phone') && normPhone) {
      conditions.push('`phone` = ?');
      params.push(normPhone);
    } else if (columns.has('phone_number') && normPhone) {
      conditions.push('`phone_number` = ?');
      params.push(normPhone);
    } else if (columns.has('mobile') && normPhone) {
      conditions.push('`mobile` = ?');
      params.push(normPhone);
    }

    if (conditions.length === 0) {
      return null;
    }

    let activeClause = '';
    if (columns.has('is_active')) {
      activeClause = ' AND is_active = 1';
    } else if (columns.has('status')) {
      activeClause = " AND (`status` = 'active' OR `status` = '1')";
    } else if (columns.has('active')) {
      activeClause = ' AND active = 1';
    }

    const query = `SELECT * FROM \`${table}\` WHERE (${conditions.join(' OR ')})${activeClause} LIMIT 1`;
    const [rows] = await pool.query(query, params);

    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        id: String(u.id || u.user_id || u._id || ''),
        employee_id: u.employee_id || u.emp_no || u.emp_id || u.username || normEmpId || null,
        email: u.email || normEmail || null,
        role: u.role || u.role_name || 'staff',
        name: u.name || u.full_name || u.username || null,
        username: u.username || normUsername || null,
        pinNo: u.pin_no || u.pinNo || u.roll_number || u.admission_number || null
      };
    }

    return null;
  } catch (error) {
    console.error('[ExaminationModel] findExaminationUser error:', error.message);
    return null;
  }
};

/**
 * Find active user in examination_portal by id.
 * @param {string|number} id
 * @returns {Promise<Object|null>} Matching examination user or null
 */
export const findExaminationUserById = async (id) => {
  try {
    const pool = getExaminationPool();
    if (!pool || !id) return null;

    const schema = await getCandidateUserTable(pool);
    if (!schema) return null;

    const { table, columns } = schema;
    const idCol = columns.has('id') ? 'id' : (columns.has('user_id') ? 'user_id' : null);
    if (!idCol) return null;

    const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE \`${idCol}\` = ? LIMIT 1`, [id]);
    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        id: String(u[idCol]),
        employee_id: u.employee_id || u.emp_no || u.emp_id || u.username || null,
        email: u.email || null,
        role: u.role || u.role_name || 'staff',
        name: u.name || u.full_name || u.username || null,
        username: u.username || null
      };
    }
    return null;
  } catch (error) {
    console.error('[ExaminationModel] findExaminationUserById error:', error.message);
    return null;
  }
};

export default {
  findExaminationUser,
  findExaminationUserById
};

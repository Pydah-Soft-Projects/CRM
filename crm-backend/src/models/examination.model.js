import { getExaminationPool } from '../config/database.js';

/**
 * Examination Portal Model
 * Queries the 'ems_users' table directly in the examination_portal database on MySQL RDS.
 */

/**
 * Find active user in examination_portal.ems_users by email, username, employeeId, or phone.
 * @param {Object} query - { email, employeeId, username, phone }
 * @returns {Promise<Object|null>} Matching examination user or null
 */
export const findExaminationUser = async ({ email, employeeId, username, phone }) => {
  try {
    const pool = getExaminationPool();
    if (!pool) return null;

    const conditions = [];
    const params = [];

    const normEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : null;
    const normUsername = username && typeof username === 'string' ? username.trim() : null;
    const normEmpId = employeeId && typeof employeeId === 'string' ? employeeId.trim() : null;
    const normPhone = phone && typeof phone === 'string' ? phone.trim() : null;

    if (normEmail) {
      conditions.push('email = ?');
      params.push(normEmail);
    }

    if (normUsername) {
      conditions.push('username = ?');
      params.push(normUsername);
    }

    if (normEmpId && normEmpId !== normUsername) {
      conditions.push('username = ?');
      params.push(normEmpId);
    }

    if (normPhone) {
      conditions.push('phone = ?');
      params.push(normPhone);
    }

    if (conditions.length === 0) return null;

    const query = `SELECT * FROM \`ems_users\` WHERE (${conditions.join(' OR ')}) LIMIT 1`;
    const [rows] = await pool.query(query, params);

    if (rows && rows.length > 0) {
      const u = rows[0];

      // Check if user is active
      const isActive = u.is_active !== undefined ? (u.is_active == 1 || u.is_active === true) :
                       u.status !== undefined ? (u.status !== 'inactive' && u.status !== 'disabled' && u.status != 0) : true;
      if (!isActive) {
        return null;
      }

      // Check if user has an assigned role
      const rawRole = u.role || u.role_name || (u.role_id ? String(u.role_id) : null);
      if (!rawRole || rawRole === 'none' || rawRole === 'null' || rawRole === '' || rawRole === 'undefined') {
        return null;
      }

      return {
        id: String(u.id || u.user_id || u._id || ''),
        employee_id: u.employee_id || u.emp_no || u.username || normEmpId || null,
        email: u.email || normEmail || null,
        role: rawRole,
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
 * Find active user in examination_portal.ems_users by id.
 * @param {string|number} id
 * @returns {Promise<Object|null>} Matching examination user or null
 */
export const findExaminationUserById = async (id) => {
  try {
    const pool = getExaminationPool();
    if (!pool || !id) return null;

    const query = 'SELECT * FROM `ems_users` WHERE id = ? LIMIT 1';
    const [rows] = await pool.query(query, [id]);
    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        id: String(u.id || ''),
        employee_id: u.employee_id || u.emp_no || u.username || null,
        email: u.email || null,
        role: u.role || u.role_name || 'staff',
        name: u.name || u.full_name || u.username || null,
        username: u.username || null
      };
    }
    return null;
  } catch (err) {
    console.error('[ExaminationModel] findExaminationUserById error:', err.message);
    return null;
  }
};

export default {
  findExaminationUser,
  findExaminationUserById
};

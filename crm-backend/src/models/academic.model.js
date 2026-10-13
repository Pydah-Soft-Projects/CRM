import { getAcademicPool } from '../config/database.js';

/**
 * Academic Portal Model
 * Queries the 'ap_users' table directly in the academic_portal database on MySQL RDS.
 */

/**
 * Find active user in academic_portal.ap_users by email, username, employeeId, or phone.
 * @param {Object} query - { email, employeeId, username, phone }
 * @returns {Promise<Object|null>} Matching academic user or null
 */
export const findAcademicUser = async ({ email, employeeId, username, phone }) => {
  try {
    const pool = getAcademicPool();
    if (!pool) {
      return null;
    }

    const conditions = [];
    const params = [];

    if (email && typeof email === 'string' && email.trim()) {
      conditions.push('email = ?');
      params.push(email.trim().toLowerCase());
    }

    if (username && typeof username === 'string' && username.trim()) {
      conditions.push('username = ?');
      params.push(username.trim());
    }

    if (employeeId && typeof employeeId === 'string' && employeeId.trim() && employeeId.trim() !== username?.trim()) {
      conditions.push('username = ?');
      params.push(employeeId.trim());
    }

    if (phone && typeof phone === 'string' && phone.trim()) {
      conditions.push('phone = ?');
      params.push(phone.trim());
    }

    if (conditions.length === 0) {
      return null;
    }

    const query = `SELECT * FROM ap_users WHERE (${conditions.join(' OR ')}) AND is_active = 1 LIMIT 1`;
    const [rows] = await pool.query(query, params);

    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        id: String(u.id || ''),
        employee_id: u.employee_id || u.username || employeeId || null,
        email: u.email || email || null,
        role: u.role || u.role_name || 'faculty',
        name: u.name || u.full_name || u.username || null,
        username: u.username || null
      };
    }

    return null;
  } catch (error) {
    console.error('[AcademicModel] findAcademicUser error:', error.message);
    return null;
  }
};

export default {
  findAcademicUser
};

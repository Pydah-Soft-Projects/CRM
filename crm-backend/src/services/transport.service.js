import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getTransportDb } from '../config/database.js';

/**
 * Transport Service
 * Handles authentication and authorization for the Transport Management portal.
 * Checks 'userroles' collection (linked by employeeId ObjectId, phone, email)
 * and 'admins' collection for direct transport administrators.
 */

/**
 * Find Transport User Role in 'userroles' collection or 'admins' collection.
 * Transport assigns user permissions via 'userroles' schema:
 * {
 *   _id: ObjectId(...),
 *   employeeId: ObjectId(...), // references HRMS employee
 *   phone: "9490484418",
 *   email: "",
 *   roles: [...],
 *   permissions: [...],
 *   campuses: [...],
 *   colleges: [...],
 *   courses: [...]
 * }
 * @param {Object} user - User query parameters { id, employeeId, email, phone, username, databaseSource }
 * @returns {Promise<Object|null>} Matching document or null
 */
export const findTransportUserRole = async (user) => {
  if (!user) return null;
  const db = await getTransportDb();
  if (!db) {
    console.log('[Transport] Database not configured');
    return null;
  }

  try {
    const userRolesCol = db.collection('userroles');
    const adminCol = db.collection('admins');
    const orConditions = [];

    // 0. Auto-resolve employee number (like '2144') from HRMS to obtain employeeId ObjectId, phone, and email
    const rawEmpNo = user.employeeId || user.emp_no || (/^\d+$/.test(user.username) ? user.username : null);
    if (rawEmpNo && (!user.phone || !user.email)) {
      try {
        const { getHRMSDb } = await import('../config/database.js');
        const hrmsDb = await getHRMSDb();
        if (hrmsDb) {
          const emp = await hrmsDb.collection('employees').findOne({
            $or: [{ emp_no: String(rawEmpNo) }, { emp_no: String(rawEmpNo).toUpperCase() }]
          });
          if (emp) {
            if (emp._id && !user.employeeId) user.employeeId = emp._id;
            if ((emp.phone || emp.phone_number) && !user.phone) user.phone = emp.phone || emp.phone_number;
            if (emp.email && !user.email) user.email = emp.email;
            if (emp._id) orConditions.push({ employeeId: emp._id });
          }
        }
      } catch (_) {}
    }

    // 1. Match by employeeId ObjectId (from HRMS user.id or employeeId)
    const empIdCandidates = [user.employeeId, user.empId, user.emp_no];
    if (user.databaseSource === 'hrms' || !user.databaseSource) {
      empIdCandidates.push(user.id);
    }

    for (const candidate of empIdCandidates) {
      if (candidate) {
        if (typeof candidate === 'string' && /^[0-9a-fA-F]{24}$/.test(candidate)) {
          const oid = new ObjectId(candidate);
          if (!orConditions.some(c => c.employeeId && c.employeeId.equals(oid))) {
            orConditions.push({ employeeId: oid });
          }
        } else if (candidate instanceof ObjectId) {
          if (!orConditions.some(c => c.employeeId && c.employeeId.equals(candidate))) {
            orConditions.push({ employeeId: candidate });
          }
        }
      }
    }

    // 2. Match by phone number
    const phone = user.phone || user.mobile || user.contact || (/^\d{10}$/.test(user.username) ? user.username : null);
    if (phone && typeof phone === 'string' && phone.trim()) {
      orConditions.push({ phone: phone.trim() });
    }

    // 3. Match by email (only if non-empty string)
    const email = user.email || (user.username && user.username.includes('@') ? user.username : null);
    if (email && typeof email === 'string' && email.trim()) {
      orConditions.push({ email: email.trim().toLowerCase() });
      orConditions.push({ email: email.trim() });
    }

    // Query userroles collection
    if (orConditions.length > 0) {
      console.log(`[Transport] Checking 'userroles' collection with ${orConditions.length} conditions`);
      const roleDoc = await userRolesCol.findOne({ $or: orConditions });
      if (roleDoc) {
        // Exclude generic 'user' role. Only consider active staff/admin transport roles
        const rawRoles = Array.isArray(roleDoc.roles) ? roleDoc.roles : (roleDoc.role ? [roleDoc.role] : []);
        const validRoles = rawRoles
          .map(r => String(r).toLowerCase().trim())
          .filter(r => r && r !== 'user' && r !== 'none');

        const hasValidPermissions = Array.isArray(roleDoc.permissions) && roleDoc.permissions.length > 0;

        if (validRoles.length > 0 || hasValidPermissions) {
          console.log(`[Transport] Match found in 'userroles': id=${roleDoc._id}, phone=${roleDoc.phone}, roles=${JSON.stringify(roleDoc.roles)}`);
          return {
            ...roleDoc,
            sourceCollection: 'userroles'
          };
        } else {
          console.log(`[Transport] Document found in 'userroles' (id=${roleDoc._id}), but user only has basic 'user' or no valid roles`);
        }
      }
    }

    // 4. Fallback: Check admins collection by username/email
    const identifier = (user.username || email || '').trim();
    if (identifier) {
      const adminDoc = await adminCol.findOne({
        $or: [
          { username: identifier },
          { email: identifier }
        ]
      });
      if (adminDoc) {
        console.log(`[Transport] Match found in 'admins': id=${adminDoc._id}, username=${adminDoc.username}`);
        return {
          ...adminDoc,
          sourceCollection: 'admins'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Transport] findTransportUserRole error:', error.message);
    return null;
  }
};

/**
 * Validate Transport credentials (for login when portalId is transport-management).
 * Checks 'admins' collection for username and verifies password.
 * @param {string} username - Admin username
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} Normalized user { id, username, role: 'admin', databaseSource: 'transport' } or null
 */
export const validateTransportCredentials = async (username, password) => {
  if (!username || !password) return null;
  
  const db = await getTransportDb();
  if (!db) {
    console.log('[Auth-Transport] Transport login requested but TRANSPORT_MONGO_URI not configured');
    return null;
  }

  const adminCol = db.collection('admins');
  const identifier = username.trim();

  try {
    console.log(`[Auth-Transport] Checking admins collection for username: ${identifier}`);
    const admin = await adminCol.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (admin) {
      console.log(`[Auth-Transport] Found admin user: ${admin.username}`);
      
      if (admin.password) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
          console.log(`[Auth-Transport] Transport admin validated successfully: ${admin._id}`);
          return {
            id: admin._id.toString(),
            username: admin.username,
            name: admin.name || admin.username,
            role: admin.role || 'admin',
            databaseSource: 'transport'
          };
        } else {
          console.log(`[Auth-Transport] Password mismatch for admin: ${admin.username}`);
        }
      } else {
        console.log(`[Auth-Transport] Admin ${admin.username} has no password set`);
      }
    } else {
      console.log(`[Auth-Transport] No admin found with identifier: ${identifier}`);
    }

    return null;
  } catch (error) {
    console.error('[Transport] validateTransportCredentials error:', error.message);
    return null;
  }
};

/**
 * Find Transport Admin or UserRole by _id (for verify-token lookup).
 * @param {string} userId - User _id as string
 * @returns {Promise<Object|null>}
 */
export const getTransportUserById = async (userId) => {
  if (!userId) return null;
  const db = await getTransportDb();
  if (!db) return null;

  try {
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) return null;
    const objId = new ObjectId(userId);
    
    // Check admins first
    const admin = await db.collection('admins').findOne({ _id: objId });
    if (admin) {
      return {
        username: admin.username,
        name: admin.name || admin.username,
        email: admin.email || null,
        role: admin.role || 'admin'
      };
    }
    
    // Check userroles by _id or employeeId
    const roleDoc = await db.collection('userroles').findOne({
      $or: [{ _id: objId }, { employeeId: objId }]
    });
    if (roleDoc) {
      return {
        username: roleDoc.phone || null,
        name: null,
        email: roleDoc.email || null,
        roles: roleDoc.roles || [],
        permissions: roleDoc.permissions || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Transport] getTransportUserById error:', error.message);
    return null;
  }
};

export default {
  findTransportUserRole,
  validateTransportCredentials,
  getTransportUserById
};

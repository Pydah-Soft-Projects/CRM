import bcrypt from 'bcryptjs';
import { findRBACUserByIdentifier, findRBACUserById, findRBACUserByHrmsId } from '../models/rbac.model.js';
import { findAdmissionsUserByEmail, findAdmissionsUserById, findAdmissionsUserByIdentifier } from '../models/admissions.model.js';
import { findStudentByUsername, findStudentById } from '../models/student.model.js';
import { findAcademicUser, findAcademicUserById } from '../models/academic.model.js';
import { findExaminationUser, findExaminationUserById } from '../models/examination.model.js';
import { validateHRMSCredentials, getHRMSUserById, findHRMSUserByEmail, getEmployeeProfilePhoto } from './hrms.service.js';
import { validateHostelCredentials, getHostelUserById, findHostelUserForVerify } from './hostel.service.js';
import { validateTransportCredentials, getTransportUserById, findTransportUserRole } from './transport.service.js';
import { validateFeeCredentials, getFeeUserById } from './fee.service.js';
import { getFeeDb, getTransportDb, getHRMSDb, getAcademicPool, getStudentPool } from '../config/database.js';
import { generateSSOToken } from './token.service.js';
import { encryptToken } from './encryption.service.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Authentication Service
 * Handles authentication business logic
 * Supports both student_database and admissions_db
 */

/**
 * Discover user portals across all available database systems in parallel
 * Checks HRMS, Fee, Transport, Hostel, Admissions, and Student portals dynamically.
 * @param {Object} user - Authenticated user details
 * @param {string} databaseSource - Source database where user authenticated
 * @returns {Promise<Array<string>>} List of portal IDs the user is authorized for
 */
export const discoverUserPortals = async (user, databaseSource = null) => {
  try {
    const portals = new Set();

    // 1. Grant the portal of the primary authentication source
    if (databaseSource === 'hrms') portals.add('hrms');
    if (databaseSource === 'hostel' || databaseSource === 'hostel-automation') portals.add('hostel-automation');
    if (databaseSource === 'transport' || databaseSource === 'transport-management') portals.add('transport-management');
    if (databaseSource === 'fee' || databaseSource === 'fee-management') portals.add('fee-management');
    if (databaseSource === 'admissions_db' || databaseSource === 'admissions-crm') portals.add('admissions-crm');
    if (databaseSource === 'student_credentials' || databaseSource === 'student-portal') portals.add('student-portal');
    // rbac_users table in student_database is strictly for the Student Portal only
    if (databaseSource === 'rbac_users') portals.add('student-portal');
    if (databaseSource === 'academic_portal' || databaseSource === 'academic-portal') portals.add('academic-portal');
    if (databaseSource === 'examination_portal' || databaseSource === 'examination-portal') portals.add('examination-portal');

    const username = (user.username || '').trim();
    let email = (user.email || (username.includes('@') ? username : '')).trim().toLowerCase();
    let rollOrEmp = (user.admission_number || user.employeeId || user.emp_no || user.rollNumber || user.admissionNumber || user.employee_id || '').trim();
    if (!rollOrEmp && /^\d+$/.test(username)) {
      rollOrEmp = username;
    }
    let phone = user.phone || user.mobile || null;
    const name = (user.name || '').trim();

    // 1.4 If coming from Academic Portal, resolve user from ap_users to extract hrms_employee_id, email, phone
    if (databaseSource === 'academic_portal' || databaseSource === 'academic-portal') {
      try {
        const pool = getAcademicPool();
        if (pool && (user.id || user._id || username || email)) {
          const conds = [];
          const params = [];
          if (user.id || user._id) {
            conds.push('id = ?');
            params.push(user.id || user._id);
          }
          if (username) {
            conds.push('username = ?');
            params.push(username);
          }
          if (email) {
            conds.push('email = ?');
            params.push(email);
          }
          if (conds.length > 0) {
            const [rows] = await pool.query(`SELECT * FROM ap_users WHERE (${conds.join(' OR ')}) AND is_active = 1 LIMIT 1`, params);
            if (rows && rows.length > 0) {
              const ap = rows[0];
              if (ap.hrms_employee_id && !rollOrEmp) rollOrEmp = String(ap.hrms_employee_id).trim();
              if (ap.email && !email) email = ap.email.trim().toLowerCase();
              if (ap.phone && !phone) phone = ap.phone;
            }
          }
        }
      } catch (e) {
        console.error('[discoverUserPortals] ap_users lookup error:', e.message);
      }
    }

    // 1.5 If coming from Student Portal (rbac_users), resolve from rbac_users to extract username/hrms_id, email, phone
    if (databaseSource === 'rbac_users' || databaseSource === 'student-portal') {
      try {
        const pool = getStudentPool();
        if (pool && (user.id || user._id || username || email)) {
          const conds = [];
          const params = [];
          if (user.id || user._id) {
            conds.push('id = ?');
            params.push(user.id || user._id);
          }
          if (username) {
            conds.push('username = ?');
            params.push(username);
          }
          if (email) {
            conds.push('email = ?');
            params.push(email);
          }
          if (conds.length > 0) {
            const [rows] = await pool.query(`SELECT * FROM rbac_users WHERE (${conds.join(' OR ')}) AND is_active = 1 LIMIT 1`, params);
            if (rows && rows.length > 0) {
              const rbac = rows[0];
              if (rbac.username && /^\d+$/.test(rbac.username) && !rollOrEmp) rollOrEmp = rbac.username.trim();
              if (rbac.email && !email) email = rbac.email.trim().toLowerCase();
              if (rbac.phone && !phone) phone = rbac.phone;
            }
          }
        }
      } catch (e) {
        console.error('[discoverUserPortals] rbac_users lookup error:', e.message);
      }
    }

    // 1.6 Auto-enrich missing email, emp_no, or phone from HRMS employees or Fee/Hostel/Transport DBs
    if (!email || !rollOrEmp || !phone) {
      try {
        const hrmsDb = await getHRMSDb();
        if (hrmsDb) {
          const empQuery = [];
          if (rollOrEmp) {
            empQuery.push({ emp_no: rollOrEmp });
            empQuery.push({ emp_no: rollOrEmp.toUpperCase() });
          }
          if (email) empQuery.push({ email: email });
          if (name && name.length > 3) empQuery.push({ name: name }, { employee_name: name });
          if (empQuery.length > 0) {
            const emp = await hrmsDb.collection('employees').findOne({
              $or: empQuery,
              $and: [{ $or: [{ is_active: true }, { is_active: { $exists: false } }] }]
            });
            if (emp) {
              if (emp.email && !email) email = emp.email.trim().toLowerCase();
              if (emp.emp_no && !rollOrEmp) rollOrEmp = emp.emp_no;
              if ((emp.phone || emp.phone_number) && !phone) phone = emp.phone || emp.phone_number;
            }
          }
        }
      } catch (_) {}

      // Fallback check against Fee database if identity came from fee management
      if (!email && (databaseSource === 'fee' || databaseSource === 'fee-management')) {
        try {
          const feeDb = await getFeeDb();
          if (feeDb && (username || user.id || user._id)) {
            const feeConditions = [];
            if (username) feeConditions.push({ username });
            if (user.id || user._id) {
              try {
                const { ObjectId } = await import('mongodb');
                feeConditions.push({ _id: new ObjectId(user.id || user._id) });
              } catch (_) {}
            }
            if (feeConditions.length > 0) {
              const feeDoc = await feeDb.collection('users').findOne({ $or: feeConditions });
              if (feeDoc) {
                if (feeDoc.email && !email) email = feeDoc.email.trim().toLowerCase();
                if (feeDoc.mobile && !phone) phone = feeDoc.mobile;
                if (feeDoc.username && !rollOrEmp && /^\d+$/.test(feeDoc.username)) rollOrEmp = feeDoc.username;
              }
            }
          }
        } catch (_) {}
      }
    }

    const identifier = username || email;

    // Attach enriched fields back to user for downstream consumers
    if (email && !user.email) user.email = email;
    if (rollOrEmp && !user.employeeId) user.employeeId = rollOrEmp;
    if (phone && !user.phone) user.phone = phone;

    // 2. Concurrently check presence in all other portal databases
    const checks = [];

    // Check HRMS (Exclusively against employees collection)
    if (!portals.has('hrms')) {
      checks.push(
        (async () => {
          try {
            const hrmsTarget = email || (identifier.includes('@') ? identifier : null);
            if (hrmsTarget || rollOrEmp) {
              const hUser = await findHRMSUserByEmail(hrmsTarget, rollOrEmp);
              if (hUser) portals.add('hrms');
            } else if (identifier) {
              const db = await getHRMSDb();
              if (db) {
                const doc = await db.collection('employees').findOne({
                  $and: [
                    { $or: [{ emp_no: identifier }, { emp_no: identifier.toUpperCase() }, { email: identifier }] },
                    { $or: [{ is_active: true }, { is_active: { $exists: false } }] }
                  ]
                });
                if (doc) portals.add('hrms');
              }
            }
          } catch (e) {
            console.error('[discoverUserPortals] HRMS check error:', e.message);
          }
        })()
      );
    }

    // Check Fee Management
    if (!portals.has('fee-management')) {
      checks.push(
        (async () => {
          try {
            const db = await getFeeDb();
            if (db && (identifier || email)) {
              const orConditions = [];
              if (identifier) orConditions.push({ username: identifier });
              if (email) {
                orConditions.push({ email: email });
                orConditions.push({ username: email });
              }
              const feeUser = await db.collection('users').findOne({ $or: orConditions });
              if (feeUser) portals.add('fee-management');
            }
          } catch (e) {
            console.error('[discoverUserPortals] Fee check error:', e.message);
          }
        })()
      );
    }

    // Check Transport Management (checks 'userroles' collection by employeeId/phone/email and 'admins' collection)
    if (!portals.has('transport-management')) {
      checks.push(
        (async () => {
          try {
            const transportRole = await findTransportUserRole({
              id: user.id || user._id,
              employeeId: rollOrEmp || user.employeeId || user.emp_no,
              email: email,
              phone: user.phone || user.mobile,
              username: identifier,
              databaseSource: databaseSource
            });
            if (transportRole) {
              portals.add('transport-management');
            }
          } catch (e) {
            console.error('[discoverUserPortals] Transport check error:', e.message);
          }
        })()
      );
    }

    // Check Hostel Automation
    if (!portals.has('hostel-automation')) {
      checks.push(
        (async () => {
          try {
            const hostelUser = await findHostelUserForVerify(email, identifier, rollOrEmp);
            if (hostelUser) portals.add('hostel-automation');
          } catch (e) {
            console.error('[discoverUserPortals] Hostel check error:', e.message);
          }
        })()
      );
    }

    // Check Admissions CRM
    if (!portals.has('admissions-crm')) {
      checks.push(
        (async () => {
          try {
            const targets = [
              email, 
              user.name, 
              username, 
              identifier, 
              rollOrEmp,
              user.phone,
              user.mobile
            ].filter(Boolean);

            for (const t of targets) {
              const admUser = await findAdmissionsUserByIdentifier(t, {
                email,
                name: user.name,
                phone: user.phone || user.mobile
              });
              if (admUser) {
                console.log(`[discoverUserPortals] Admissions match found: userId=${admUser.id}, roleName=${admUser.role_name}`);
                portals.add('admissions-crm');
                break;
              }
            }
          } catch (e) {
            console.error('[discoverUserPortals] Admissions check error:', e.message);
          }
        })()
      );
    }

    // Check Student Portal (checks student_credentials or rbac_users in student_database)
    if (!portals.has('student-portal')) {
      checks.push(
        (async () => {
          try {
            const stuTarget = rollOrEmp || (username && /^\d+$/.test(username) ? username : null);
            if (stuTarget) {
              const stuUser = await findStudentByUsername(stuTarget);
              if (stuUser) {
                portals.add('student-portal');
                return;
              }
            }

            let rbacUser = null;
            if (user.id || user._id) {
              rbacUser = await findRBACUserByHrmsId(user.id || user._id);
            }
            if (!rbacUser && rollOrEmp) {
              rbacUser = await findRBACUserByIdentifier(rollOrEmp);
            }
            if (!rbacUser && email) {
              rbacUser = await findRBACUserByIdentifier(email);
            }
            if (!rbacUser && identifier && identifier !== name) {
              rbacUser = await findRBACUserByIdentifier(identifier);
            }
            if (rbacUser) {
              portals.add('student-portal');
            }
          } catch (e) {
            console.error('[discoverUserPortals] Student portal check error:', e.message);
          }
        })()
      );
    }

    // Check Academic Portal (checks academic_portal database)
    if (!portals.has('academic-portal')) {
      checks.push(
        (async () => {
          try {
            if (
              email === 'ravi@pydahsoft.in' ||
              user.role === 'super_admin' ||
              user.role === 'superadmin'
            ) {
              portals.add('academic-portal');
              return;
            }
            const academicUser = await findAcademicUser({
              email,
              employeeId: rollOrEmp || user.employeeId || user.emp_no,
              username: identifier,
              phone: user.phone || user.mobile
            });
            if (academicUser) {
              portals.add('academic-portal');
            }
          } catch (e) {
            console.warn('[discoverUserPortals] Academic check error:', e.message);
          }
        })()
      );
    }

    // Check Examination Portal (EMS)
    if (!portals.has('examination-portal')) {
      checks.push(
        (async () => {
          try {
            // 1. Students can access EMS portal
            if (databaseSource === 'student_credentials' || user.role === 'student' || user.admission_number || user.rollNumber) {
              portals.add('examination-portal');
              return;
            }

            // 2. Super administrator bypass only
            if (
              email === 'ravi@pydahsoft.in' ||
              user.role === 'super_admin' ||
              user.role === 'superadmin'
            ) {
              portals.add('examination-portal');
              return;
            }

            // 3. Staff & Faculty: Must exist in examination_portal database with an assigned role
            const examUser = await findExaminationUser({
              email,
              employeeId: rollOrEmp || user.employeeId || user.emp_no,
              username: identifier,
              phone: user.phone || user.mobile
            });

            if (examUser && examUser.role && examUser.role !== 'none' && examUser.role !== 'null') {
              portals.add('examination-portal');
              return;
            }
          } catch (e) {
            console.warn('[discoverUserPortals] Examination check error:', e.message);
          }
        })()
      );
    }

    await Promise.allSettled(checks);

    return Array.from(portals);
  } catch (error) {
    console.error('[discoverUserPortals] General error:', error);
    if (databaseSource === 'hrms') return ['hrms'];
    if (databaseSource === 'hostel') return ['hostel-automation'];
    if (databaseSource === 'transport') return ['transport-management'];
    if (databaseSource === 'fee') return ['fee-management'];
    if (databaseSource === 'admissions_db') return ['admissions-crm'];
    if (databaseSource === 'student_credentials') return ['student-portal'];
    return ['admissions-crm'];
  }
};

/**
 * Safely compare plain password against hash, handling Buffer, null, objects, and plain-text fallback
 */
const safeBcryptCompare = async (plainPassword, hash) => {
  if (!plainPassword || hash === null || hash === undefined) return false;
  try {
    const cleanPlain = String(plainPassword);
    const cleanHash = Buffer.isBuffer(hash)
      ? hash.toString('utf8').trim()
      : (typeof hash === 'string' ? hash.trim() : String(hash).trim());
    if (!cleanHash) return false;

    // Check plain text equality fallback
    if (cleanPlain === cleanHash) return true;

    // Bcrypt comparison
    return await bcrypt.compare(cleanPlain, cleanHash);
  } catch (err) {
    console.error('[Auth] safeBcryptCompare error:', err.message);
    return false;
  }
};

/**
 * Validate user credentials
 * Checks student_credentials, rbac_users, and admissions_db
 * @param {string} username - Username, admission number, or email
 * @param {string} password - Plain text password
 * @param {string} role - Optional role hint ('student', 'staff', etc.)
 * @returns {Object} User object if valid, null otherwise
 */
export const validateCredentials = async (username, password, role = null) => {
  try {
    let user = null;
    let databaseSource = null;

    // Unified login: Check in order across all databases without early-aborting on password mismatch
    // 1. rbac_users table (for staff/admin/RBAC in student_database)
    console.log(`[Auth] Checking rbac_users table for: ${username}`);
    const rbacCandidate = await findRBACUserByIdentifier(username);
    if (rbacCandidate) {
      const isValid = await safeBcryptCompare(password, rbacCandidate.password);
      if (isValid) {
        user = rbacCandidate;
        databaseSource = 'rbac_users';
        console.log(`[Auth] Authenticated via rbac_users: ${user.id}, role: ${user.role}`);
      } else {
        console.log(`[Auth] Password mismatch in rbac_users for: ${username}, checking other databases...`);
      }
    }

    // 2. admissions_db users table (for Admissions CRM counsellors, managers, super admins)
    if (!user) {
      console.log(`[Auth] Checking admissions_db for: ${username}`);
      const admCandidate = await findAdmissionsUserByIdentifier(username);
      if (admCandidate) {
        const isValid = await safeBcryptCompare(password, admCandidate.password);
        if (isValid) {
          user = admCandidate;
          databaseSource = 'admissions_db';
          console.log(`[Auth] Authenticated via admissions_db: ${user.id}, role: ${user.role_name}`);
        } else {
          console.log(`[Auth] Password mismatch in admissions_db for: ${username}, checking other databases...`);
        }
      }
    }

    // 3. student_credentials table (for students)
    if (!user) {
      console.log(`[Auth] Checking student_credentials table for: ${username}`);
      const studentCandidate = await findStudentByUsername(username);
      if (studentCandidate) {
        const isValid = await safeBcryptCompare(password, studentCandidate.password);
        if (isValid) {
          user = studentCandidate;
          databaseSource = 'student_credentials';
          console.log(`[Auth] Authenticated via student_credentials: ${user.id}`);
        } else {
          console.log(`[Auth] Password mismatch in student_credentials for: ${username}`);
        }
      }
    }

    // If user matched and authenticated in MySQL
    if (user) {
      console.log(`[Auth] User authenticated in MySQL: ${user.username || user.email || user.name || user.admission_number}, database: ${databaseSource}, role: ${user.role_name || user.role}`);

      const { password: _, ...userWithoutPassword } = user;
      const empId = user.employee_id || user.employeeId || user.emp_no || user.emp_id || user.empid || (databaseSource === 'admissions_db' && /^\d+$/.test(username) ? username : null);
      const normalizedUser = {
        ...userWithoutPassword,
        role: user.role_name || user.role || 'user',
        username: user.username || user.email || user.name || user.admission_number || username,
        employeeId: empId,
        emp_no: empId,
        databaseSource: databaseSource
      };

      if (!normalizedUser.profilePhoto) {
        try {
          const photo = await getEmployeeProfilePhoto({
            email: normalizedUser.email,
            employeeId: normalizedUser.employeeId || normalizedUser.emp_no || normalizedUser.admission_number,
            username: normalizedUser.username,
            phone: normalizedUser.phone || normalizedUser.mobile
          });
          if (photo) normalizedUser.profilePhoto = photo;
        } catch (e) {
          // ignore error
        }
      }

      normalizedUser.portals = await discoverUserPortals(normalizedUser, databaseSource);
      return normalizedUser;
    }

    // User not found in MySQL - check MongoDB databases (HRMS, Hostel, Transport, Fee)
    console.log(`[Auth] Checking HRMS MongoDB for: ${username}`);
    const hrmsUser = await validateHRMSCredentials(username, password);
    if (hrmsUser) {
      console.log(`[Auth] User authenticated via HRMS MongoDB: ${hrmsUser.id}`);
      const normalizedUser = {
        ...hrmsUser,
        username: hrmsUser.email || hrmsUser.name,
        databaseSource: 'hrms'
      };
      normalizedUser.portals = await discoverUserPortals(normalizedUser, 'hrms');
      return normalizedUser;
    }

    console.log(`[Auth] Checking Hostel MongoDB for: ${username}`);
    const hostelUser = await validateHostelCredentials(username, password);
    if (hostelUser) {
      console.log(`[Auth] User authenticated via Hostel MongoDB: ${hostelUser.id}`);
      const normalizedUser = {
        ...hostelUser,
        databaseSource: 'hostel'
      };
      if (!normalizedUser.profilePhoto) {
        try {
          const photo = await getEmployeeProfilePhoto({
            email: normalizedUser.email,
            employeeId: normalizedUser.employeeId || normalizedUser.emp_no || normalizedUser.rollNumber,
            username: normalizedUser.username,
            phone: normalizedUser.phone
          });
          if (photo) normalizedUser.profilePhoto = photo;
        } catch (e) {}
      }
      normalizedUser.portals = await discoverUserPortals(normalizedUser, 'hostel');
      return normalizedUser;
    }

    console.log(`[Auth] Checking Transport MongoDB for: ${username}`);
    const transportUser = await validateTransportCredentials(username, password);
    if (transportUser) {
      console.log(`[Auth] User authenticated via Transport MongoDB: ${transportUser.id}`);
      const normalizedUser = {
        ...transportUser,
        databaseSource: transportUser.databaseSource || 'transport'
      };
      if (!normalizedUser.profilePhoto) {
        try {
          const photo = await getEmployeeProfilePhoto({
            email: normalizedUser.email,
            employeeId: normalizedUser.employeeId || normalizedUser.emp_no,
            username: normalizedUser.username,
            phone: normalizedUser.phone
          });
          if (photo) normalizedUser.profilePhoto = photo;
        } catch (e) {}
      }
      normalizedUser.portals = await discoverUserPortals(normalizedUser, 'transport');
      return normalizedUser;
    }

    console.log(`[Auth] Checking Fee MongoDB for: ${username}`);
    const feeUser = await validateFeeCredentials(username, password);
    if (feeUser) {
      console.log(`[Auth] User authenticated via Fee MongoDB: ${feeUser.id}`);
      const normalizedUser = {
        ...feeUser,
        databaseSource: feeUser.databaseSource || 'fee'
      };
      if (!normalizedUser.profilePhoto) {
        try {
          const photo = await getEmployeeProfilePhoto({
            email: normalizedUser.email,
            employeeId: normalizedUser.employeeId || normalizedUser.emp_no,
            username: normalizedUser.username,
            phone: normalizedUser.phone
          });
          if (photo) normalizedUser.profilePhoto = photo;
        } catch (e) {}
      }
      normalizedUser.portals = await discoverUserPortals(normalizedUser, 'fee');
      return normalizedUser;
    }

    console.log(`[Auth] User not found or invalid credentials across all databases for username: ${username}`);
    return null;
  } catch (error) {
    console.error('Credential validation error:', error);
    throw new Error(ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Validate credentials against HRMS MongoDB only (when logging in via HRMS portal).
 * @param {string} username - Email or username
 * @param {string} password - Plain password
 * @returns {Object|null} User object with dynamically discovered portals
 */
export const validateCredentialsForHRMS = async (username, password) => {
  const user = await validateHRMSCredentials(username, password);
  if (!user) return null;
  const normalizedUser = {
    ...user,
    username: user.email || user.name,
    databaseSource: 'hrms'
  };
  if (!normalizedUser.profilePhoto) {
    try {
      const photo = await getEmployeeProfilePhoto({
        email: normalizedUser.email,
        employeeId: normalizedUser.employeeId || normalizedUser.emp_no,
        username: normalizedUser.username,
        phone: normalizedUser.phone
      });
      if (photo) normalizedUser.profilePhoto = photo;
    } catch (e) {}
  }
  normalizedUser.portals = await discoverUserPortals(normalizedUser, 'hrms');
  return normalizedUser;
};

/**
 * Validate credentials against Hostel MongoDB only (when logging in via Hostel portal).
 * Uses collections: admins (username + password), users (rollNumber/admissionNumber + password).
 * @param {string} username - Admin username or student rollNumber/admissionNumber
 * @param {string} password - Plain password
 * @returns {Object|null} User object with dynamically discovered portals
 */
export const validateCredentialsForHostel = async (username, password) => {
  const user = await validateHostelCredentials(username, password);
  if (!user) return null;
  const normalizedUser = {
    ...user,
    databaseSource: 'hostel'
  };
  if (!normalizedUser.profilePhoto) {
    try {
      const photo = await getEmployeeProfilePhoto({
        email: normalizedUser.email,
        employeeId: normalizedUser.employeeId || normalizedUser.emp_no || normalizedUser.rollNumber,
        username: normalizedUser.username,
        phone: normalizedUser.phone
      });
      if (photo) normalizedUser.profilePhoto = photo;
    } catch (e) {}
  }
  normalizedUser.portals = await discoverUserPortals(normalizedUser, 'hostel');
  return normalizedUser;
};

/**
 * Validate credentials against Transport MongoDB, fallout to HRMS MongoDB if not found.
 * @param {string} username - Username
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} User object with dynamically discovered portals
 */
export const validateCredentialsForTransport = async (username, password) => {
  // 1. Try Transport database first (Admin collection)
  console.log(`[Auth-Transport] Attempting login via Transport database for: ${username}`);
  let user = await validateTransportCredentials(username, password);
  let dbSource = 'transport';
  
  if (!user) {
    // 2. Fallback to HRMS database if not found in Transport
    console.log(`[Auth-Transport] User not found in Transport, falling back to HRMS database for: ${username}`);
    user = await validateHRMSCredentials(username, password);
    dbSource = 'hrms';
  }

  if (user) {
    const normalizedUser = {
      ...user,
      databaseSource: dbSource
    };
    if (!normalizedUser.profilePhoto) {
      try {
        const photo = await getEmployeeProfilePhoto({
          email: normalizedUser.email,
          employeeId: normalizedUser.employeeId || normalizedUser.emp_no,
          username: normalizedUser.username,
          phone: normalizedUser.phone
        });
        if (photo) normalizedUser.profilePhoto = photo;
      } catch (e) {}
    }
    normalizedUser.portals = await discoverUserPortals(normalizedUser, dbSource);
    return normalizedUser;
  }

  console.log(`[Auth-Transport] User not found in either Transport or HRMS for: ${username}`);
  return null;
};

/**
 * Validate credentials against Fee MongoDB, fallout to HRMS MongoDB if not found.
 * @param {string} username - Username
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} User object with dynamically discovered portals
 */
export const validateCredentialsForFee = async (username, password) => {
  // 1. Try Fee database first (User collection)
  console.log(`[Auth-Fee] Attempting login via Fee database for: ${username}`);
  let user = await validateFeeCredentials(username, password);
  let dbSource = 'fee';
  
  if (!user) {
    // 2. Fallback to HRMS database if not found in Fee
    console.log(`[Auth-Fee] User not found in Fee, falling back to HRMS database for: ${username}`);
    user = await validateHRMSCredentials(username, password);
    dbSource = 'hrms';
  }

  if (user) {
    const normalizedUser = {
      ...user,
      databaseSource: dbSource
    };
    if (!normalizedUser.profilePhoto) {
      try {
        const photo = await getEmployeeProfilePhoto({
          email: normalizedUser.email,
          employeeId: normalizedUser.employeeId || normalizedUser.emp_no,
          username: normalizedUser.username,
          phone: normalizedUser.phone
        });
        if (photo) normalizedUser.profilePhoto = photo;
      } catch (e) {}
    }
    normalizedUser.portals = await discoverUserPortals(normalizedUser, dbSource);
    return normalizedUser;
  }

  console.log(`[Auth-Fee] User not found in either Fee or HRMS for: ${username}`);
  return null;
};

/**
 * Generate encrypted SSO token for portal access
 * @param {string} userId - User ID
 * @param {string} portalId - Target portal identifier
 * @param {string} role - User role
 * @param {string} databaseSource - Which database the user came from ('rbac_users', 'student_credentials', 'admissions_db', 'hrms', etc.)
 * @param {string} [username] - User username/identifier
 * @param {Object} [options] - Optional session context { portals, email, phone, employeeId }
 * @returns {string} Encrypted SSO token
 */
export const generatePortalToken = async (userId, portalId, role, databaseSource = 'rbac_users', username = null, options = {}) => {
  try {
    let userPortals = [];
    const normalizedRole = (role || '').toLowerCase();
    
    if (Array.isArray(options.portals) && options.portals.length > 0) {
      // 1. Use portals verified and authorized during login session
      userPortals = options.portals;
    } else {
      // 2. Discover portals dynamically with full identity
      const email = options.email || (username && username.includes('@') ? username : null);
      userPortals = await discoverUserPortals({
        id: userId,
        username,
        email,
        phone: options.phone,
        employeeId: options.employeeId,
        role
      }, databaseSource);
    }
    
    if (!userPortals.includes(portalId)) {
      throw new Error('User does not have access to this portal');
    }

    // Generate SSO JWT token (include databaseSource, username, email, employeeId, phone, and portals for target portals)
    const ssoToken = generateSSOToken(userId, portalId, role, databaseSource, username, {
      ...(options.email && { email: options.email }),
      ...(options.employeeId && { employeeId: options.employeeId }),
      ...(options.phone && { phone: options.phone }),
      portals: userPortals
    });
    
    // Encrypt the token
    const encryptedToken = encryptToken(ssoToken);
    
    return encryptedToken;
  } catch (error) {
    console.error('Portal token generation error:', error);
    throw new Error(error.message || ERROR_MESSAGES.TOKEN_GENERATION_FAILED);
  }
};

/**
 * Get CRM user identity by id for verify-token (e.g. to resolve email for HRMS).
 * Tries databaseSource first if provided, then rbac → admissions → student.
 * @param {string|number} userId - CRM user id
 * @param {string} [databaseSource] - Optional: 'rbac_users', 'admissions_db', 'student_credentials'
 * @returns {Promise<{ email?: string, name?: string, employeeId?: string }|null>}
 */
export const getCRMUserForVerify = async (userId, databaseSource = null) => {
  try {
    if (databaseSource === 'hrms') {
      const hrmsUser = await getHRMSUserById(userId);
      if (hrmsUser) {
        return {
          email: hrmsUser.email || null,
          name: hrmsUser.name || null,
          employeeId: hrmsUser.employeeId || null,
          phone: hrmsUser.phone || null,
          profilePhoto: hrmsUser.profilePhoto || null
        };
      }
      return null;
    }
    if (databaseSource === 'hostel') {
      const hostelUser = await getHostelUserById(userId);
      if (hostelUser) {
        return {
          email: hostelUser.email || null,
          name: hostelUser.name || null,
          username: hostelUser.username || null
        };
      }
      return null;
    }
    if (databaseSource === 'transport') {
      const transportUser = await getTransportUserById(userId);
      if (transportUser) {
        return {
          email: transportUser.email || null,
          name: transportUser.name || null,
          username: transportUser.username || null
        };
      }
      return null;
    }
    if (databaseSource === 'fee') {
      const feeUser = await getFeeUserById(userId);
      if (feeUser) {
        return {
          email: feeUser.email || null,
          name: feeUser.name || null,
          username: feeUser.username || null,
          role: feeUser.role || null
        };
      }
      return null;
    }
    if (databaseSource === 'academic_portal' || databaseSource === 'academic-portal') {
      const academicUser = await findAcademicUserById(userId);
      if (academicUser) {
        return {
          email: academicUser.email || null,
          name: academicUser.name || null,
          employeeId: academicUser.employee_id || null,
          username: academicUser.username || null,
          phone: academicUser.phone || null,
          role: academicUser.role || null
        };
      }
      return null;
    }
    if (databaseSource === 'rbac_users' || databaseSource === 'student-portal') {
      const user = await findRBACUserById(userId);
      if (user) {
        return {
          email: user.email || null,
          name: user.name || user.username || null,
          employeeId: user.username && /^\d+$/.test(user.username) ? user.username : (user.employeeId || user.employee_id || null),
          username: user.username || null,
          phone: user.phone || null,
          role: user.role || null
        };
      }
    }
    if (databaseSource === 'admissions_db') {
      const user = await findAdmissionsUserById(userId);
      if (user) {
        return {
          email: user.email || null,
          name: user.name || null,
          employeeId: user.employeeId || user.employee_id || null
        };
      }
    }
    if (databaseSource === 'student_credentials') {
      const user = await findStudentById(userId);
      if (user) {
        return {
          email: user.email || null,
          name: user.name || user.username || null,
          employeeId: user.employeeId || user.employee_id || null
        };
      }
    }
    if (databaseSource === 'examination_portal') {
      const examUser = await findExaminationUserById(userId);
      if (examUser) {
        return {
          email: examUser.email || null,
          name: examUser.name || examUser.username || null,
          employeeId: examUser.employee_id || null,
          username: examUser.username || null,
          role: examUser.role || null
        };
      }
    }
    // Fallback: try all sources (for tokens issued before databaseSource was added)
    const acadUser = await findAcademicUserById(userId);
    if (acadUser) {
      return {
        email: acadUser.email || null,
        name: acadUser.name || null,
        employeeId: acadUser.employee_id || null,
        username: acadUser.username || null,
        role: acadUser.role || null
      };
    }
    let user = await findRBACUserById(userId);
    if (user) {
      return {
        email: user.email || null,
        name: user.name || user.username || null,
        employeeId: user.employeeId || user.employee_id || null
      };
    }
    user = await findAdmissionsUserById(userId);
    if (user) {
      return {
        email: user.email || null,
        name: user.name || null,
        employeeId: user.employeeId || user.employee_id || null
      };
    }
    user = await findStudentById(userId);
    if (user) {
      return {
        email: user.email || null,
        name: user.name || user.username || null,
        employeeId: user.employeeId || user.employee_id || null
      };
    }
    return null;
  } catch (error) {
    console.error('[Auth] getCRMUserForVerify error:', error);
    return null;
  }
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {boolean} True if password matches
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export default {
  validateCredentials,
  discoverUserPortals,
  validateCredentialsForHRMS,
  validateCredentialsForHostel,
  validateCredentialsForTransport,
  validateCredentialsForFee,
  generatePortalToken,
  getCRMUserForVerify,
  hashPassword,
  comparePassword
};

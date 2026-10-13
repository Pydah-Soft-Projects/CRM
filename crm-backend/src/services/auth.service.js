import bcrypt from 'bcryptjs';
import { findRBACUserByIdentifier, findRBACUserById } from '../models/rbac.model.js';
import { findAdmissionsUserByEmail, findAdmissionsUserById } from '../models/admissions.model.js';
import { findStudentByUsername, findStudentById } from '../models/student.model.js';
import { validateHRMSCredentials, getHRMSUserById } from './hrms.service.js';
import { validateHostelCredentials, getHostelUserById } from './hostel.service.js';
import { validateTransportCredentials, getTransportUserById } from './transport.service.js';
import { validateFeeCredentials, getFeeUserById } from './fee.service.js';
import { generateSSOToken } from './token.service.js';
import { encryptToken } from './encryption.service.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Authentication Service
 * Handles authentication business logic
 * Supports both student_database and admissions_db
 */

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

    // Unified login: Check in order across all databases
    // 1. rbac_users table (for staff/admin/RBAC)
    // 2. admissions_db users table
    // 3. student_credentials table (for students)
    
    console.log(`[Auth] Centralized login - Checking rbac_users table for: ${username}`);
    user = await findRBACUserByIdentifier(username);
    if (user) {
      databaseSource = 'rbac_users';
      console.log(`[Auth] RBAC user found: ${user.id}, role: ${user.role}`);
    } else {
      // Try admissions_db
      console.log(`[Auth] Checking admissions_db for: ${username}`);
      user = await findAdmissionsUserByEmail(username);
      if (user) {
        databaseSource = 'admissions_db';
        console.log(`[Auth] Admissions user found: ${user.id}`);
      } else {
        // Check student_credentials table (for students)
        console.log(`[Auth] Checking student_credentials table for: ${username}`);
        user = await findStudentByUsername(username);
        if (user) {
          databaseSource = 'student_credentials';
          console.log(`[Auth] Student found in student_credentials table: ${user.id}`);
        }
      }
    }

    // If user matched in MySQL, verify password
    if (user) {
      console.log(`[Auth] User found: ${user.username || user.admission_number}, database: ${databaseSource}, role: ${user.role}`);
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log(`[Auth] Password validation failed for MySQL user: ${user.username || user.admission_number}`);
        return null;
      }

      console.log(`[Auth] Password validated successfully for user: ${user.username || user.admission_number}`);

      let portals = [];
      if (databaseSource === 'rbac_users') {
        portals = ['admissions-crm', 'hostel-automation', 'hrms', 'student-portal', 'transport-management', 'fee-management', 'pharmacy'];
      } else if (databaseSource === 'admissions_db') {
        portals = ['admissions-crm'];
      } else if (databaseSource === 'student_credentials') {
        portals = ['student-portal'];
      }

      const { password: _, ...userWithoutPassword } = user;
      
      return {
        ...userWithoutPassword,
        role: user.role_name || user.role || 'user',
        username: user.username || user.email || user.name || user.admission_number,
        portals: portals,
        databaseSource: databaseSource
      };
    }

    // User not found in MySQL - check MongoDB databases (HRMS, Hostel, Transport, Fee)
    console.log(`[Auth] Checking HRMS MongoDB for: ${username}`);
    const hrmsUser = await validateHRMSCredentials(username, password);
    if (hrmsUser) {
      console.log(`[Auth] User authenticated via HRMS MongoDB: ${hrmsUser.id}`);
      return {
        ...hrmsUser,
        username: hrmsUser.email || hrmsUser.name,
        portals: ['hrms', 'transport-management'],
        databaseSource: 'hrms'
      };
    }

    console.log(`[Auth] Checking Hostel MongoDB for: ${username}`);
    const hostelUser = await validateHostelCredentials(username, password);
    if (hostelUser) {
      console.log(`[Auth] User authenticated via Hostel MongoDB: ${hostelUser.id}`);
      return {
        ...hostelUser,
        portals: ['hostel-automation'],
        databaseSource: 'hostel'
      };
    }

    console.log(`[Auth] Checking Transport MongoDB for: ${username}`);
    const transportUser = await validateTransportCredentials(username, password);
    if (transportUser) {
      console.log(`[Auth] User authenticated via Transport MongoDB: ${transportUser.id}`);
      return {
        ...transportUser,
        portals: transportUser.portals || ['transport-management'],
        databaseSource: transportUser.databaseSource || 'transport'
      };
    }

    console.log(`[Auth] Checking Fee MongoDB for: ${username}`);
    const feeUser = await validateFeeCredentials(username, password);
    if (feeUser) {
      console.log(`[Auth] User authenticated via Fee MongoDB: ${feeUser.id}`);
      return {
        ...feeUser,
        portals: feeUser.portals || ['fee-management'],
        databaseSource: feeUser.databaseSource || 'fee'
      };
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
 * @returns {Object|null} User object with portals: ['hrms'], databaseSource: 'hrms'
 */
export const validateCredentialsForHRMS = async (username, password) => {
  const user = await validateHRMSCredentials(username, password);
  if (!user) return null;
  return {
    ...user,
    username: user.email || user.name,
    portals: ['hrms'],
    databaseSource: 'hrms'
  };
};

/**
 * Validate credentials against Hostel MongoDB only (when logging in via Hostel portal).
 * Uses collections: admins (username + password), users (rollNumber/admissionNumber + password).
 * @param {string} username - Admin username or student rollNumber/admissionNumber
 * @param {string} password - Plain password
 * @returns {Object|null} User object with portals: ['hostel-automation'], databaseSource: 'hostel'
 */
export const validateCredentialsForHostel = async (username, password) => {
  const user = await validateHostelCredentials(username, password);
  if (!user) return null;
  return {
    ...user,
    portals: ['hostel-automation'],
    databaseSource: 'hostel'
  };
};

/**
 * Validate credentials against Transport MongoDB, fallout to HRMS MongoDB if not found.
 * @param {string} username - Username
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} User object with portals mapped
 */
export const validateCredentialsForTransport = async (username, password) => {
  // 1. Try Transport database first (Admin collection)
  console.log(`[Auth-Transport] Attempting login via Transport database for: ${username}`);
  let user = await validateTransportCredentials(username, password);
  
  if (user) {
    console.log(`[Auth-Transport] User found in Transport database: ${user.id}`);
    return {
      ...user,
      portals: ['transport-management'],
      databaseSource: 'transport'
    };
  }

  // 2. Fallback to HRMS database if not found in Transport
  console.log(`[Auth-Transport] User not found in Transport, falling back to HRMS database for: ${username}`);
  user = await validateHRMSCredentials(username, password);
  
  if (user) {
    console.log(`[Auth-Transport] User found in HRMS database via fallback: ${user.id}`);
    return {
      ...user,
      portals: ['transport-management', 'hrms'], // Grant both since they are valid HRMS users
      databaseSource: 'hrms'
    };
  }

  console.log(`[Auth-Transport] User not found in either Transport or HRMS for: ${username}`);
  return null;
};

/**
 * Validate credentials against Fee MongoDB, fallout to HRMS MongoDB if not found.
 * @param {string} username - Username
 * @param {string} password - Plain password
 * @returns {Promise<Object|null>} User object with portals mapped
 */
export const validateCredentialsForFee = async (username, password) => {
  // 1. Try Fee database first (User collection)
  console.log(`[Auth-Fee] Attempting login via Fee database for: ${username}`);
  let user = await validateFeeCredentials(username, password);
  
  if (user) {
    console.log(`[Auth-Fee] User found in Fee database: ${user.id}`);
    return {
      ...user,
      portals: ['fee-management'],
      databaseSource: 'fee'
    };
  }

  // 2. Fallback to HRMS database if not found in Fee
  console.log(`[Auth-Fee] User not found in Fee, falling back to HRMS database for: ${username}`);
  user = await validateHRMSCredentials(username, password);
  
  if (user) {
    console.log(`[Auth-Fee] User found in HRMS database via fallback: ${user.id}`);
    return {
      ...user,
      portals: ['fee-management', 'hrms'], // Grant both since they are valid HRMS users
      databaseSource: 'hrms'
    };
  }

  console.log(`[Auth-Fee] User not found in either Fee or HRMS for: ${username}`);
  return null;
};

/**
 * Generate encrypted SSO token for portal access
 * @param {string} userId - User ID
 * @param {string} portalId - Target portal identifier
 * @param {string} role - User role
 * @param {string} databaseSource - Which database the user came from ('rbac_users', 'student_credentials', or 'admissions_db')
 * @returns {string} Encrypted SSO token
 */
export const generatePortalToken = async (userId, portalId, role, databaseSource = 'rbac_users', username = null) => {
  try {
    let userPortals = [];
    
    // Get portals based on database source
    if (databaseSource === 'rbac_users') {
      // RBAC users have access to multiple portals
      userPortals = ['admissions-crm', 'hostel-automation', 'hrms', 'student-portal', 'transport-management', 'fee-management', 'pharmacy'];
    } else if (databaseSource === 'admissions_db') {
      // Admissions users have access to admissions-crm portal
      userPortals = ['admissions-crm'];
    } else if (databaseSource === 'student_credentials') {
      // Students have access to student-portal
      userPortals = ['student-portal'];
    } else if (databaseSource === 'hrms') {
      // HRMS users (from HRMS Mongo) have access to hrms and transport portals
      userPortals = ['hrms', 'transport-management'];
    } else if (databaseSource === 'hostel') {
      // Hostel users (from Hostel Mongo) have access to hostel-automation portal only
      userPortals = ['hostel-automation'];
    } else if (databaseSource === 'transport') {
      // Transport users (from Transport Mongo) have access to transport-management portal only
      userPortals = ['transport-management'];
    } else if (databaseSource === 'fee') {
      // Fee users (from Fee Mongo) have access to fee-management portal only
      userPortals = ['fee-management'];
    }
    
    if (!userPortals.includes(portalId)) {
      throw new Error('User does not have access to this portal');
    }

    // Generate SSO JWT token (include databaseSource and username for lookup/fallback)
    const ssoToken = generateSSOToken(userId, portalId, role, databaseSource, username);
    
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
          employeeId: hrmsUser.employeeId || null
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
    if (databaseSource === 'rbac_users') {
      const user = await findRBACUserById(userId);
      if (user) {
        return {
          email: user.email || null,
          name: user.name || user.username || null,
          employeeId: user.employeeId || user.employee_id || null
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
    // Fallback: try all sources (for tokens issued before databaseSource was added)
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
  validateCredentialsForHRMS,
  validateCredentialsForHostel,
  validateCredentialsForTransport,
  validateCredentialsForFee,
  generatePortalToken,
  getCRMUserForVerify,
  hashPassword,
  comparePassword
};

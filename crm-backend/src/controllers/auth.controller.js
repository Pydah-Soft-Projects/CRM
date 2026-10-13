import { 
  validateCredentials, 
  validateCredentialsForHRMS, 
  validateCredentialsForHostel, 
  validateCredentialsForTransport,
  validateCredentialsForFee,
  generatePortalToken, 
  getCRMUserForVerify 
} from '../services/auth.service.js';
import { generateToken, verifyToken as verifyJWTToken } from '../services/token.service.js';
import { findHRMSUserByEmail } from '../services/hrms.service.js';
import { findHostelUserForVerify } from '../services/hostel.service.js';
import { findTransportUserRole } from '../services/transport.service.js';
import { findAdmissionsUserByEmail, findAdmissionsUserById } from '../models/admissions.model.js';
import { findRBACUserByIdentifier, findRBACUserById } from '../models/rbac.model.js';
import { findStudentByUsername, findStudentById } from '../models/student.model.js';
import { getFeeDb } from '../config/database.js';
import { decryptToken } from '../services/encryption.service.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, TOKEN_TYPES, PORTAL_IDS } from '../config/constants.js';

/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

/**
 * Login endpoint handler
 * POST /auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { username, password, role, portalId } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_CREDENTIALS
      });
    }

    // When logging in via HRMS portal, validate against HRMS MongoDB only
    // When logging in via Hostel portal, validate against Hostel MongoDB only (admins + users)
    let user;
    if (portalId === PORTAL_IDS.HRMS) {
      user = await validateCredentialsForHRMS(username, password);
    } else if (portalId === PORTAL_IDS.HOSTEL_AUTOMATION) {
      user = await validateCredentialsForHostel(username, password);
    } else if (portalId === PORTAL_IDS.TRANSPORT_MANAGEMENT) {
      user = await validateCredentialsForTransport(username, password);
    } else if (portalId === PORTAL_IDS.FEE_MANAGEMENT) {
      user = await validateCredentialsForFee(username, password);
    } else {
      user = await validateCredentials(username, password, role);
    }

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Generate access token
    const accessToken = generateToken(
      {
        userId: user.id,
        username: user.username || user.email || user.name,
        email: user.email,
        name: user.name,
        phone: user.phone,
        employeeId: user.employeeId,
        role: user.role,
        portals: user.portals,
        databaseSource: user.databaseSource // Track which database the user came from
      },
      TOKEN_TYPES.ACCESS
    );

    // Generate refresh token
    const refreshToken = generateToken(
      {
        userId: user.id,
        username: user.username || user.email || user.name
      },
      TOKEN_TYPES.REFRESH
    );

    // Return success response
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: {
        user: {
          id: user.id,
          username: user.username || user.email || user.name,
          email: user.email,
          name: user.name,
          role: user.role,
          role_name: user.role_name,
          portals: user.portals,
          databaseSource: user.databaseSource
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate SSO token for portal access
 * POST /auth/generate-token
 */
export const generateTokenForPortal = async (req, res, next) => {
  try {
    const { portalId } = req.body;
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS
      });
    }

    if (!portalId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Portal ID is required'
      });
    }

    // Get user role, database source, and username
    const userRole = req.user?.role || 'user';
    const databaseSource = req.user?.databaseSource || 'rbac_users';
    const username = req.user?.username;
    const email = req.user?.email;
    const portals = req.user?.portals;
    const phone = req.user?.phone;
    const employeeId = req.user?.employeeId;

    // Generate encrypted SSO token
    const encryptedToken = await generatePortalToken(
      userId,
      portalId,
      userRole,
      databaseSource,
      username,
      { email, portals, phone, employeeId }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.TOKEN_GENERATED,
      data: {
        encryptedToken,
        portalId,
        expiresIn: process.env.JWT_SSO_EXPIRY || '15m'
      }
    });
  } catch (error) {
    if (error.message.includes('does not have access')) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Validate credentials endpoint
 * POST /auth/validate-credentials
 */
export const validateUserCredentials = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_CREDENTIALS
      });
    }

    // Validate credentials
    const user = await validateCredentials(username, password);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        valid: false
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CREDENTIALS_VALID,
      valid: true,
      data: {
        userId: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify token endpoint (for external portals)
 * POST /auth/verify-token
 */
export const verifyToken = async (req, res, next) => {
  try {
    console.log(`[VerifyToken] Request received from: ${req.headers.origin || 'unknown'}`);
    console.log(`[VerifyToken] Request body keys:`, Object.keys(req.body || {}));
    
    const { encryptedToken } = req.body;

    if (!encryptedToken) {
      console.log(`[VerifyToken] Missing encryptedToken in request`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_TOKEN
      });
    }

    console.log(`[VerifyToken] Attempting to decrypt and verify token...`);

    // Decrypt token
    const decryptedToken = decryptToken(encryptedToken);
    console.log(`[VerifyToken] Token decrypted successfully`);

    // Verify JWT token
    const decoded = verifyJWTToken(decryptedToken);
    console.log(`[VerifyToken] Token verified. UserId: ${decoded.userId}, PortalId: ${decoded.portalId}, Role: ${decoded.role}`);

    // Check if token is SSO type
    if (decoded.type !== TOKEN_TYPES.SSO) {
      console.log(`[VerifyToken] Invalid token type: ${decoded.type}, expected: ${TOKEN_TYPES.SSO}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    const baseData = {
      portalId: decoded.portalId,
      role: decoded.role,
      expiresAt
    };

    const crmUser = await getCRMUserForVerify(decoded.userId, decoded.databaseSource);
    const email = crmUser?.email || (decoded.username && decoded.username.includes('@') ? decoded.username : null);
    const username = crmUser?.username || decoded.username;
    const identifier = (email || username || '').trim();

    // 1. For HRMS portal: return userId (and email) that HRMS can use to find User/Employee in its DB
    if (decoded.portalId === PORTAL_IDS.HRMS) {
      if (decoded.databaseSource === 'hrms') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            email: email,
            ...baseData
          }
        });
      }

      if (email) {
        const hrmsIdentity = await findHRMSUserByEmail(email, crmUser?.employeeId);
        if (hrmsIdentity) {
          console.log(`[VerifyToken] HRMS lookup: resolved to userId=${hrmsIdentity.userId}`);
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: hrmsIdentity.userId,
              email: hrmsIdentity.email,
              ...baseData
            }
          });
        }
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: email,
            email,
            ...baseData
          }
        });
      }
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          ...(email && { email }),
          ...baseData
        }
      });
    }

    // 2. For Hostel portal: return userId (and role/email/username) that HMS can use to find User/Admin in its DB
    if (decoded.portalId === PORTAL_IDS.HOSTEL_AUTOMATION) {
      if (decoded.databaseSource === 'hostel') {
        const hostelUser = await getCRMUserForVerify(decoded.userId, 'hostel');
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            ...(hostelUser?.email && { email: hostelUser.email }),
            ...(hostelUser?.username && { username: hostelUser.username }),
            role: decoded.role,
            ...baseData
          }
        });
      }

      // CRM/HRMS user: resolve to hostel identity for HMS
      const hostelIdentity = await findHostelUserForVerify(email, username, null);
      if (hostelIdentity) {
        console.log(`[VerifyToken] Hostel lookup: resolved to userId=${hostelIdentity.userId}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: hostelIdentity.userId,
            ...(hostelIdentity.email && { email: hostelIdentity.email }),
            ...(hostelIdentity.username && { username: hostelIdentity.username }),
            ...(hostelIdentity.role && { role: hostelIdentity.role }),
            ...baseData
          }
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          ...(email && { email }),
          ...(username && { username }),
          ...baseData
        }
      });
    }

    // 3. For Admissions CRM: resolve to local user in admissions_db
    if (decoded.portalId === PORTAL_IDS.ADMISSIONS_CRM) {
      if (decoded.databaseSource === 'admissions_db') {
        const admSelf = await findAdmissionsUserById(decoded.userId);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: decoded.userId,
            email: admSelf?.email || email,
            name: admSelf?.name,
            role: admSelf?.role_name || decoded.role,
            ...baseData
          }
        });
      }

      let admUser = null;
      if (email) admUser = await findAdmissionsUserByEmail(email);
      if (!admUser && identifier) admUser = await findAdmissionsUserByEmail(identifier);
      if (admUser) {
        console.log(`[VerifyToken] Admissions lookup: resolved to userId=${admUser.id}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: admUser.id,
            email: admUser.email,
            name: admUser.name,
            role: admUser.role_name || decoded.role,
            ...baseData
          }
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: decoded.userId,
          ...(email && { email }),
          ...baseData
        }
      });
    }

    // 4. For Student Portal (SDMS): resolve to local identity in student_database (rbac_users or student_credentials)
    if (decoded.portalId === PORTAL_IDS.STUDENT_PORTAL) {
      if (decoded.databaseSource === 'rbac_users' || decoded.databaseSource === 'student_credentials') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: decoded.userId,
            email: email,
            username: username,
            ...baseData
          }
        });
      }

      let rbacUser = null;
      if (email) rbacUser = await findRBACUserByIdentifier(email);
      if (!rbacUser && identifier) rbacUser = await findRBACUserByIdentifier(identifier);
      if (rbacUser) {
        console.log(`[VerifyToken] Student portal lookup: resolved to rbac userId=${rbacUser.id}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: rbacUser.id,
            email: rbacUser.email,
            name: rbacUser.name,
            ...baseData
          }
        });
      }

      let stuUser = null;
      if (username) stuUser = await findStudentByUsername(username);
      if (stuUser) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: stuUser.id,
            role: 'student',
            username: stuUser.username,
            ...baseData
          }
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: decoded.userId,
          ...(email && { email }),
          ...baseData
        }
      });
    }

    // 5. For Transport portal: resolve to user in Transport MongoDB (userroles or admins)
    if (decoded.portalId === PORTAL_IDS.TRANSPORT_MANAGEMENT) {
      if (decoded.databaseSource === 'transport') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            ...(email && { email }),
            username: username,
            ...baseData
          }
        });
      }

      const transportRole = await findTransportUserRole({
        id: decoded.userId,
        employeeId: crmUser?.employeeId,
        email: email,
        phone: crmUser?.phone,
        username: username,
        databaseSource: decoded.databaseSource
      });
      if (transportRole) {
        // Transport's ssoLogin queries Employee.findById(crmUserId) || Employee.findOne({ emp_no: crmUserId })
        // and falls back to Admin.findById(crmUserId).
        // Therefore, userId MUST be the HRMS Employee _id (employeeId), not the userroles._id!
        const resolvedUserId = (transportRole.employeeId ? transportRole.employeeId.toString() : null)
          || (crmUser?.employeeId ? crmUser.employeeId.toString() : null)
          || (decoded.userId ? decoded.userId.toString() : null)
          || transportRole._id.toString();

        console.log(`[VerifyToken] Transport lookup: resolved to employee/admin userId=${resolvedUserId} (roleDoc _id=${transportRole._id})`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: resolvedUserId,
            employeeId: transportRole.employeeId ? transportRole.employeeId.toString() : (crmUser?.employeeId || null),
            roleId: transportRole._id ? transportRole._id.toString() : null,
            phone: transportRole.phone || crmUser?.phone || null,
            username: transportRole.phone || transportRole.username || username,
            role: (transportRole.roles && transportRole.roles[0]) || transportRole.role || decoded.role,
            email: transportRole.email || email,
            ...baseData
          }
        });
      }

      console.warn(`[VerifyToken] Forbidden: User ${decoded.userId} has no assigned role in Transport system`);
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        valid: false,
        message: 'User does not have an assigned role in Transport system'
      });
    }

    // 6. For Fee portal: resolve to user in Fee MongoDB (users collection)
    if (decoded.portalId === PORTAL_IDS.FEE_MANAGEMENT) {
      if (decoded.databaseSource === 'fee') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            ...(email && { email }),
            username: username,
            ...(crmUser?.role && { role: crmUser.role }),
            ...baseData
          }
        });
      }

      const feeDb = await getFeeDb();
      if (feeDb && identifier) {
        const orConditions = [];
        if (identifier) orConditions.push({ username: identifier });
        if (email) {
          orConditions.push({ email: email });
          orConditions.push({ username: email });
        }
        const feeUser = await feeDb.collection('users').findOne({ $or: orConditions });
        if (feeUser) {
          console.log(`[VerifyToken] Fee lookup: resolved to userId=${feeUser._id}`);
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: feeUser._id.toString(),
              username: feeUser.username,
              name: feeUser.name || feeUser.username,
              role: feeUser.role || decoded.role,
              email: feeUser.email || email,
              ...baseData
            }
          });
        }
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          ...(email && { email }),
          username: username,
          ...(crmUser?.role && { role: crmUser.role }),
          ...baseData
        }
      });
    }

    // 7. General fallback
    console.log(`[VerifyToken] Token verification successful for portal: ${decoded.portalId}`);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      valid: true,
      data: {
        userId: decoded.userId,
        ...(email && { email }),
        ...baseData
      }
    });
  } catch (error) {
    console.error(`[VerifyToken] Error:`, error.message);
    console.error(`[VerifyToken] Error stack:`, error.stack);
    
    // Handle specific error types
    if (error.message.includes('expired') || error.message.includes('Invalid') || error.message.includes('jwt')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        valid: false,
        message: ERROR_MESSAGES.INVALID_TOKEN || 'Token expired or invalid'
      });
    }
    
    // Handle decryption errors
    if (error.message.includes('decrypt') || error.message.includes('encryption')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        valid: false,
        message: 'Failed to decrypt token'
      });
    }
    
    // Generic error response
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      valid: false,
      message: 'Token verification failed'
    });
  }
};

export default {
  login,
  generateTokenForPortal,
  validateUserCredentials,
  verifyToken
};

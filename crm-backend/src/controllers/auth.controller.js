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

    // For HRMS portal: return userId (and email) that HRMS can use to find User/Employee in its DB
    if (decoded.portalId === PORTAL_IDS.HRMS) {
      const crmUser = await getCRMUserForVerify(decoded.userId, decoded.databaseSource);
      const email = crmUser?.email || null;

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
        // No match in HRMS Mongo: send email as userId so HRMS can resolve by email
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
      // No email in CRM user: return CRM userId (HRMS may resolve by employee number or name)
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          ...(crmUser?.email && { email: crmUser.email }),
          ...baseData
        }
      });
    }

    // For Hostel portal: return userId (and role/email/username) that HMS can use to find User/Admin in its DB
    if (decoded.portalId === PORTAL_IDS.HOSTEL_AUTOMATION) {
      const crmUser = await getCRMUserForVerify(decoded.userId, decoded.databaseSource);
      const email = crmUser?.email || null;
      const username = crmUser?.username || crmUser?.name || null;

      // If user logged in via hostel, decoded.userId is already hostel _id
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

      // CRM user (rbac/admissions/student): resolve to hostel identity for HMS
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
      // No match in Hostel Mongo: return CRM userId and email/username so HMS can try to resolve
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

    // For Transport portal: return userId (and username/email) that Transport can use
    if (decoded.portalId === PORTAL_IDS.TRANSPORT_MANAGEMENT) {
      const crmUser = await getCRMUserForVerify(decoded.userId, decoded.databaseSource);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          ...(crmUser?.email && { email: crmUser.email }),
          username: crmUser?.username || decoded.username,
          ...baseData
        }
      });
    }

    // For Fee portal: return userId (and username/email) that Fee can use
    if (decoded.portalId === PORTAL_IDS.FEE_MANAGEMENT) {
      const crmUser = await getCRMUserForVerify(decoded.userId, decoded.databaseSource);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          ...(crmUser?.email && { email: crmUser.email }),
          username: crmUser?.username || decoded.username,
          ...(crmUser?.role && { role: crmUser.role }),
          ...baseData
        }
      });
    }

    // Non-HRMS/Hostel portals: return CRM userId and optional email when available
    const crmUser = await getCRMUserForVerify(decoded.userId, decoded.databaseSource);
    console.log(`[VerifyToken] Token verification successful. Returning response.`);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      valid: true,
      data: {
        userId: decoded.userId,
        ...(crmUser?.email && { email: crmUser.email }),
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

import { 
  validateCredentials, 
  validateCredentialsForHRMS, 
  validateCredentialsForHostel, 
  validateCredentialsForTransport,
  validateCredentialsForFee,
  validateCredentialsForStationary,
  validateCredentialsForSRS,
  validateCredentialsForSAMS,
  generatePortalToken, 
  getCRMUserForVerify,
  discoverUserPortals
} from '../services/auth.service.js';
import { generateToken, verifyToken as verifyJWTToken } from '../services/token.service.js';
import { findHRMSUserByEmail } from '../services/hrms.service.js';
import { findHostelUserForVerify } from '../services/hostel.service.js';
import { findTransportUserRole } from '../services/transport.service.js';
import { findAdmissionsUserByEmail, findAdmissionsUserById, findAdmissionsUserByIdentifier } from '../models/admissions.model.js';
import { findRBACUserByIdentifier, findRBACUserById, findRBACUserByHrmsId, findRBACUserByEmail } from '../models/rbac.model.js';
import { findStudentByUsername, findStudentById } from '../models/student.model.js';
import { findAcademicUser } from '../models/academic.model.js';
import { findExaminationUser } from '../models/examination.model.js';
import { getFeeDb, getStationaryDb, getSRSDb, getSAMSDb } from '../config/database.js';
import { decryptToken } from '../services/encryption.service.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, TOKEN_TYPES, PORTAL_IDS, PORTAL_METADATA } from '../config/constants.js';

// Cache for tracking one-time used SSO tokens to prevent replay attacks
const usedSsoTokens = new Map();

function isTokenUsed(tokenKey) {
  const exp = usedSsoTokens.get(tokenKey);
  if (!exp) return false;
  if (Date.now() > exp) {
    usedSsoTokens.delete(tokenKey);
    return false;
  }
  return true;
}

function markTokenUsed(tokenKey, expTimestamp) {
  usedSsoTokens.set(tokenKey, expTimestamp || (Date.now() + 15 * 60 * 1000));
  if (usedSsoTokens.size > 1000) {
    const now = Date.now();
    for (const [k, exp] of usedSsoTokens.entries()) {
      if (now > exp) usedSsoTokens.delete(k);
    }
  }
}

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
    } else if (portalId === PORTAL_IDS.STATIONARY_MANAGEMENT) {
      user = await validateCredentialsForStationary(username, password);
    } else if (portalId === PORTAL_IDS.STAFF_RECRUITMENT) {
      user = await validateCredentialsForSRS(username, password);
    } else if (portalId === PORTAL_IDS.SAMS || portalId === 'sams' || portalId === 'labour-management') {
      user = await validateCredentialsForSAMS(username, password);
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
        databaseSource: user.databaseSource, // Track which database the user came from
        profilePhoto: user.profilePhoto || null
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
          databaseSource: user.databaseSource,
          profilePhoto: user.profilePhoto || null
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
    console.log(`[VerifyToken] Request received from: ${req.headers?.origin || 'unknown'}`);
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
      portals: Array.isArray(decoded.portals) ? decoded.portals : [],
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

      const targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) ? username : null);
      if (email || targetEmp) {
        const hrmsIdentity = await findHRMSUserByEmail(email, targetEmp);
        if (hrmsIdentity) {
          console.log(`[VerifyToken] HRMS lookup: resolved to userId=${hrmsIdentity.userId}`);
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: hrmsIdentity.userId,
              employeeId: hrmsIdentity.employeeId || targetEmp,
              email: hrmsIdentity.email || email,
              ...baseData
            }
          });
        }
        if (email) {
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
      const targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) ? username : null);
      const hostelIdentity = await findHostelUserForVerify(email || decoded.email, username, targetEmp);
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
      let admUser = null;

      // 1. If databaseSource was admissions_db, try finding by ID first
      if (decoded.databaseSource === 'admissions_db' && decoded.userId) {
        admUser = await findAdmissionsUserById(decoded.userId);
      }

      // 2. If not found or came from another database source, search by identity candidates
      if (!admUser) {
        const candidates = [decoded.userId, email, decoded.email, identifier, username, crmUser?.phone].filter(Boolean);
        for (const candidate of candidates) {
          admUser = await findAdmissionsUserByIdentifier(candidate, {
            email: email || decoded.email,
            phone: crmUser?.phone || decoded.phone,
            name: crmUser?.name
          });
          if (admUser) {
            console.log(`[VerifyToken] Admissions lookup: resolved candidate "${candidate}" to userId=${admUser.id}`);
            break;
          }
        }
      }

      // Deny access if user does not exist in Admissions database (unless master admin)
      const isMasterAdmin = (email || decoded.email || '').toLowerCase() === 'ravi@pydahsoft.in';
      if (!admUser && !isMasterAdmin && decoded.databaseSource !== 'admissions_db') {
        console.warn(`[VerifyToken] Access Denied: User ${decoded.userId} (${email || username}) not found in admissions database`);
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          valid: false,
          message: 'User does not have an active account in Admission Portal'
        });
      }

      // Parse permissions object
      let permissions = {};
      if (admUser?.permissions) {
        if (typeof admUser.permissions === 'string') {
          try {
            permissions = JSON.parse(admUser.permissions);
          } catch (e) {
            permissions = {};
          }
        } else if (typeof admUser.permissions === 'object') {
          permissions = admUser.permissions;
        }
      }

      // Format roleName specifically for Admissions Next.js route guards:
      // ('Super Admin', 'Sub Super Admin', 'Manager', 'Counsellor', etc.)
      let roleName = admUser?.role_name;
      if (!roleName) {
        const rawRole = String(decoded.role || '').trim().toLowerCase();
        if (['admin', 'superadmin', 'super_admin', 'super admin'].includes(rawRole) || isMasterAdmin) {
          roleName = 'Super Admin';
        } else if (rawRole === 'manager') {
          roleName = 'Manager';
        } else {
          roleName = decoded.role || 'Counsellor';
        }
      } else if (roleName.toLowerCase() === 'admin') {
        roleName = 'Super Admin';
      }

      const isManager = admUser ? (admUser.is_manager === 1 || admUser.is_manager === true) : (roleName === 'Manager');
      const isActive = admUser ? (admUser.is_active === 1 || admUser.is_active === true || admUser.is_active === null) : true;
      const finalUserId = admUser?.id || decoded.userId;
      const finalEmail = admUser?.email || email || decoded.email;
      const finalName = admUser?.name || crmUser?.name || username;

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: finalUserId,
          id: finalUserId,
          _id: finalUserId,
          email: finalEmail,
          name: finalName,
          role: roleName,
          roleName: roleName,
          isManager: isManager,
          managedBy: admUser?.managed_by || null,
          designation: admUser?.designation || null,
          permissions: permissions,
          isActive: isActive,
          ...(admUser?.created_at && { createdAt: admUser.created_at }),
          ...(admUser?.updated_at && { updatedAt: admUser.updated_at }),
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
      const targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) ? username : null);

      // Only check findRBACUserByHrmsId if token came from HRMS DB or explicit hrms_id exists (never raw user.id from other DBs)
      if (decoded.hrmsId) {
        rbacUser = await findRBACUserByHrmsId(decoded.hrmsId);
      } else if (decoded.databaseSource === 'hrms' && decoded.userId) {
        rbacUser = await findRBACUserByHrmsId(decoded.userId);
      }

      // Check by verified email
      const targetEmail = email || decoded.email;
      if (!rbacUser && targetEmail && targetEmail.includes('@')) {
        rbacUser = await findRBACUserByEmail(targetEmail);
      }

      // Check by verified employee number (avoid generic role names like 'admin', 'user')
      const GENERIC_NAMES = ['admin', 'superadmin', 'super_admin', 'sub_super_admin', 'subadmin', 'user', 'manager', 'counsellor', 'staff'];
      if (!rbacUser && targetEmp && !GENERIC_NAMES.includes(String(targetEmp).toLowerCase())) {
        rbacUser = await findRBACUserByIdentifier(String(targetEmp));
      }
      if (!rbacUser && username && !GENERIC_NAMES.includes(String(username).toLowerCase()) && !/^[0-9a-f-]{36}$/i.test(username)) {
        rbacUser = await findRBACUserByIdentifier(String(username));
      }

      if (rbacUser) {
        console.log(`[VerifyToken] Student portal lookup: resolved to rbac userId=${rbacUser.id}, role=${rbacUser.role}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            ...baseData,
            userId: rbacUser.id,
            id: rbacUser.id,
            username: rbacUser.username,
            email: rbacUser.email,
            name: rbacUser.name,
            role: rbacUser.role // Strictly use their local RBAC role in Student Portal!
          }
        });
      }

      let stuUser = null;
      if (username) stuUser = await findStudentByUsername(username);
      if (!stuUser && targetEmp) stuUser = await findStudentByUsername(targetEmp);
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

      // Master Admin bootstrap only
      if ((email || decoded.email || '').toLowerCase() === 'ravi@pydahsoft.in') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: 1,
            id: 1,
            role: 'super_admin',
            email: 'ravi@pydahsoft.in',
            username: 'superadmin',
            name: 'Master Admin',
            ...baseData
          }
        });
      }

      // Deny access if user does not exist in student_database (no bypassing for super_admin or sub_super_admin!)
      console.warn(`[VerifyToken] Access Denied: User ${decoded.userId} (${email || username}) has no active account in Student Portal`);
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        valid: false,
        message: 'User does not have an active account in Student Portal'
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

      const targetEmpId = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) ? username : null);
      const transportRole = await findTransportUserRole({
        id: decoded.userId,
        employeeId: targetEmpId,
        email: email || decoded.email,
        phone: decoded.phone || crmUser?.phone,
        username: username || decoded.username,
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
      const targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) ? username : null);
      if (feeDb && (identifier || targetEmp || email || decoded.email)) {
        const orConditions = [];
        if (identifier) orConditions.push({ username: identifier });
        if (targetEmp && targetEmp !== identifier) orConditions.push({ username: targetEmp });
        const targetEmail = email || decoded.email;
        if (targetEmail) {
          orConditions.push({ email: targetEmail });
          orConditions.push({ username: targetEmail });
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

    // 6.5 For Stationary Management portal: resolve to SubAdmin in Stationary MongoDB (subadmins collection)
    if (decoded.portalId === PORTAL_IDS.STATIONARY_MANAGEMENT || decoded.portalId === 'stationary') {
      if (decoded.databaseSource === 'stationary') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            name: decoded.name || username,
            username: username,
            ...(decoded.empNo && { empNo: decoded.empNo }),
            role: decoded.role || 'Editor',
            permissions: decoded.permissions || [],
            ...(decoded.assignedCollege && { assignedCollege: decoded.assignedCollege }),
            ...(decoded.assignedBranch && { assignedBranch: decoded.assignedBranch }),
            ...(email && { email }),
            ...baseData
          }
        });
      }

      const stationaryDb = await getStationaryDb();
      let targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) && !/^\d{10}$/.test(username) ? username : null);
      if (targetEmp && /^\d{10}$/.test(targetEmp)) targetEmp = null;
      if (!targetEmp && decoded.userId && /^\d+$/.test(String(decoded.userId)) && !/^\d{10}$/.test(String(decoded.userId))) {
        targetEmp = String(decoded.userId);
      }

      const lookupPhone = decoded.phone || crmUser?.phone || (/^\d{10}$/.test(username) ? username : null);

      if (!targetEmp && (email || decoded.email || lookupPhone || crmUser?.hrms_id)) {
        try {
          const hrmsDb = await getHRMSDb();
          if (hrmsDb) {
            const hrmsConds = [];
            if (email || decoded.email) hrmsConds.push({ email: email || decoded.email });
            if (lookupPhone) {
              hrmsConds.push({ phone: lookupPhone });
              hrmsConds.push({ phone_number: lookupPhone });
              hrmsConds.push({ mobile: lookupPhone });
            }
            if (crmUser?.hrms_id) {
              try {
                const { ObjectId } = await import('mongodb');
                hrmsConds.push({ _id: new ObjectId(crmUser.hrms_id) });
              } catch (_) {}
            }
            if (hrmsConds.length > 0) {
              const hrmsEmp = await hrmsDb.collection('employees').findOne({ $or: hrmsConds });
              if (hrmsEmp) {
                if (hrmsEmp.emp_no) targetEmp = String(hrmsEmp.emp_no).trim();
                if (hrmsEmp.employee_name && (!username || /^\d{10}$/.test(username))) {
                  username = hrmsEmp.employee_name;
                }
              }
            }
          }
        } catch (_) {}
      }

      if (stationaryDb && (identifier || targetEmp || username || decoded.userId || email || decoded.email)) {
        const orConditions = [];
        if (identifier) orConditions.push({ name: identifier });
        if (username && username !== identifier) orConditions.push({ name: username });
        if (crmUser?.name && crmUser.name !== username) orConditions.push({ name: crmUser.name });
        if (decoded.name && decoded.name !== username) orConditions.push({ name: decoded.name });
        if (email || decoded.email) {
          const em = (email || decoded.email).toLowerCase();
          orConditions.push({ email: em });
          orConditions.push({ email: email || decoded.email });
        }
        if (targetEmp) {
          orConditions.push({ empNo: String(targetEmp).trim() });
          if (/^\d+$/.test(String(targetEmp).trim())) {
            orConditions.push({ empNo: Number(targetEmp) });
          }
          orConditions.push({ name: String(targetEmp).trim() });
        }
        const rawUid = String(decoded.userId).trim();
        if (rawUid && /^[0-9a-fA-F]{24}$/.test(rawUid)) {
          try {
            const { ObjectId } = await import('mongodb');
            orConditions.push({ _id: new ObjectId(rawUid) });
          } catch (_) {}
        }

        let subAdmin = await stationaryDb.collection('subadmins').findOne({ $or: orConditions });
        if (!subAdmin) {
          try {
            subAdmin = await stationaryDb.collection('users').findOne({ $or: orConditions });
          } catch (_) {}
        }

        if (subAdmin) {
          console.log(`[VerifyToken] Stationary lookup: resolved to subAdmin _id=${subAdmin._id}, name=${subAdmin.name}`);
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: subAdmin._id.toString(),
              name: subAdmin.name,
              username: subAdmin.name,
              empNo: subAdmin.empNo || targetEmp || null,
              role: subAdmin.role || 'Editor',
              permissions: subAdmin.permissions || [],
              assignedCollege: subAdmin.assignedCollege ? subAdmin.assignedCollege.toString() : null,
              assignedBranch: subAdmin.assignedBranch ? subAdmin.assignedBranch.toString() : null,
              ...(email && { email }),
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
          name: username,
          username: username,
          empNo: targetEmp || null,
          role: crmUser?.role || decoded.role || 'Editor',
          permissions: [],
          ...(email && { email }),
          ...baseData
        }
      });
    }

    // 6.6 For Staff Recruitment System (SRS) portal: resolve to User in SRS MongoDB (users collection)
    // 6.6 For Staff Recruitment System (SRS) portal: resolve to User in SRS MongoDB (users collection)
    if (decoded.portalId === PORTAL_IDS.STAFF_RECRUITMENT || decoded.portalId === 'staff-recruitment' || decoded.portalId === 'srs') {
      const isMasterAdmin = (email || decoded.email || '').toLowerCase() === 'ravi@pydahsoft.in';

      if (decoded.databaseSource === 'srs' && decoded.userId) {
        const srsDoc = await getSRSUserById(decoded.userId);
        if (srsDoc) {
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: srsDoc.id,
              name: srsDoc.name,
              username: srsDoc.email || srsDoc.name,
              email: srsDoc.email,
              employeeId: srsDoc.employeeId || null,
              empNo: srsDoc.employeeId || null,
              role: srsDoc.role || 'candidate',
              campus: srsDoc.campus || null,
              permissions: srsDoc.permissions || {},
              hasPanelMemberAccess: Boolean(srsDoc.hasPanelMemberAccess),
              profile: srsDoc.profile || {},
              isActive: srsDoc.isActive !== false,
              ...baseData
            }
          });
        }
      }

      const srsDb = await getSRSDb();
      let targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) && !/^\d{10}$/.test(username) ? username : null);
      if (targetEmp && /^\d{10}$/.test(targetEmp)) targetEmp = null;
      if (!targetEmp && decoded.userId && /^\d+$/.test(String(decoded.userId)) && !/^\d{10}$/.test(String(decoded.userId))) {
        targetEmp = String(decoded.userId);
      }

      const lookupPhone = decoded.phone || crmUser?.phone || (/^\d{10}$/.test(username) ? username : null);

      if (!targetEmp && (email || decoded.email || lookupPhone || crmUser?.hrms_id)) {
        try {
          const hrmsDb = await getHRMSDb();
          if (hrmsDb) {
            const hrmsConds = [];
            if (email || decoded.email) hrmsConds.push({ email: email || decoded.email });
            if (lookupPhone && /^\d{10}$/.test(String(lookupPhone).trim())) {
              hrmsConds.push({ phone: String(lookupPhone).trim() });
              hrmsConds.push({ phone_number: String(lookupPhone).trim() });
              hrmsConds.push({ mobile: String(lookupPhone).trim() });
            }
            if (crmUser?.hrms_id) {
              try {
                const { ObjectId } = await import('mongodb');
                hrmsConds.push({ _id: new ObjectId(crmUser.hrms_id) });
              } catch (_) {}
            }
            if (hrmsConds.length > 0) {
              const hrmsEmp = await hrmsDb.collection('employees').findOne({ $or: hrmsConds });
              if (hrmsEmp) {
                if (hrmsEmp.emp_no) targetEmp = String(hrmsEmp.emp_no).trim();
                if (hrmsEmp.employee_name && (!username || /^\d{10}$/.test(username))) {
                  username = hrmsEmp.employee_name;
                }
              }
            }
          }
        } catch (_) {}
      }

      let srsUser = null;
      if (srsDb && (identifier || targetEmp || username || decoded.userId || email || decoded.email)) {
        const orConditions = [];
        if (decoded.userId && /^[0-9a-fA-F]{24}$/.test(String(decoded.userId))) {
          try {
            const { ObjectId } = await import('mongodb');
            orConditions.push({ _id: new ObjectId(decoded.userId) });
          } catch (_) {}
        }
        if (email || decoded.email) {
          orConditions.push({ email: (email || decoded.email).toLowerCase() });
          orConditions.push({ email: email || decoded.email });
        }
        if (targetEmp) {
          orConditions.push({ employeeId: String(targetEmp).trim() });
          if (/^\d+$/.test(String(targetEmp).trim())) {
            orConditions.push({ employeeId: Number(targetEmp) });
          }
        }
        if (identifier && identifier.includes('@')) {
          orConditions.push({ email: identifier.toLowerCase() });
          orConditions.push({ email: identifier });
        }
        const GENERIC_NAMES = ['admin', 'superadmin', 'super_admin', 'sub_super_admin', 'subadmin', 'user', 'manager', 'counsellor', 'staff', 'faculty', 'editor'];
        if (identifier && !identifier.includes('@') && !GENERIC_NAMES.includes(identifier.toLowerCase()) && !/^[0-9a-f-]{36}$/i.test(identifier)) {
          orConditions.push({ employeeId: identifier });
        }
        if (lookupPhone && /^\d{10}$/.test(String(lookupPhone).trim())) {
          orConditions.push({ 'profile.phone': String(lookupPhone).trim() });
        }

        if (orConditions.length > 0) {
          srsUser = await srsDb.collection('users').findOne({
            $or: orConditions,
            $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }]
          });
        }

        if (srsUser) {
          console.log(`[VerifyToken] SRS lookup: resolved to user _id=${srsUser._id}, name=${srsUser.name}, role=${srsUser.role}`);
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: srsUser._id.toString(),
              name: srsUser.name,
              username: srsUser.email || srsUser.name,
              email: srsUser.email,
              employeeId: srsUser.employeeId || targetEmp || null,
              empNo: srsUser.employeeId || targetEmp || null,
              role: srsUser.role || 'candidate',
              campus: srsUser.campus || null,
              permissions: srsUser.permissions || {},
              hasPanelMemberAccess: Boolean(srsUser.hasPanelMemberAccess),
              profile: srsUser.profile || {},
              isActive: srsUser.isActive !== false,
              ...baseData
            }
          });
        }
      }

      // Master Admin bootstrap only
      if (isMasterAdmin) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId || 'admin'),
            name: 'Master Admin',
            username: 'superadmin',
            email: 'ravi@pydahsoft.in',
            role: 'superadmin',
            campus: null,
            permissions: { admin: true },
            hasPanelMemberAccess: true,
            profile: {},
            isActive: true,
            ...baseData
          }
        });
      }

      // Deny access if user does not exist in SRS database
      console.warn(`[VerifyToken] Access Denied: User ${decoded.userId} (${email || username}) has no active account in Staff Recruitment System`);
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        valid: false,
        message: 'User does not have an active account in Staff Recruitment System'
      });
    }

    // 6.7. For SAMS (Labour Management): Resolve SystemUser from SAMS MongoDB or provide auto-provision payload
    if (
      decoded.portalId === PORTAL_IDS.SAMS ||
      decoded.portalId === 'sams' ||
      decoded.portalId === 'labour-management'
    ) {
      const tokenKey = `${decoded.userId}_${decoded.iat}_${decoded.portalId}`;
      if (isTokenUsed(tokenKey)) {
        console.warn(`[VerifyToken] SAMS token already used: ${tokenKey}`);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          valid: false,
          message: 'Invalid or expired token'
        });
      }
      markTokenUsed(tokenKey, decoded.exp * 1000);

      // If token originated directly from SAMS database session
      if (decoded.databaseSource === 'sams') {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            username: username || decoded.username,
            name: decoded.displayName || decoded.name || username,
            displayName: decoded.displayName || decoded.name || username,
            email: email || decoded.email || null,
            hrmsEmployeeId: decoded.hrmsEmployeeId || null,
            employeeId: decoded.hrmsEmployeeId || null,
            empNo: decoded.hrmsEmployeeId || null,
            role: decoded.isSuperAdmin ? 'super_admin' : (decoded.role || 'operator'),
            isSuperAdmin: Boolean(decoded.isSuperAdmin),
            systemRoleId: decoded.systemRoleId ? String(decoded.systemRoleId) : null,
            divisionIds: decoded.divisionIds || [],
            gateIds: decoded.gateIds || [],
            departmentIds: decoded.departmentIds || [],
            allowedLocationIds: decoded.allowedLocationIds || [],
            isActive: true,
            ...baseData
          }
        });
      }

      let targetEmp = decoded.hrmsEmployeeId || decoded.employeeId || decoded.empNo || crmUser?.employeeId || (/^\d+$/.test(username) && !/^\d{10}$/.test(username) ? username : null);
      if (!targetEmp && decoded.userId && /^\d+$/.test(String(decoded.userId)) && !/^\d{10}$/.test(String(decoded.userId))) {
        targetEmp = String(decoded.userId);
      }
      if (targetEmp && /^\d{10}$/.test(targetEmp)) targetEmp = null;

      const lookupPhone = decoded.phone || crmUser?.phone || (/^\d{10}$/.test(username) ? username : null);

      if (!targetEmp && (email || decoded.email || lookupPhone || crmUser?.hrms_id)) {
        try {
          const hrmsDb = await getHRMSDb();
          if (hrmsDb) {
            const hrmsConds = [];
            if (email || decoded.email) hrmsConds.push({ email: email || decoded.email });
            if (lookupPhone) {
              hrmsConds.push({ phone: lookupPhone });
              hrmsConds.push({ phone_number: lookupPhone });
              hrmsConds.push({ mobile: lookupPhone });
            }
            if (crmUser?.hrms_id) {
              try {
                const { ObjectId } = await import('mongodb');
                hrmsConds.push({ _id: new ObjectId(crmUser.hrms_id) });
              } catch (_) {}
            }
            if (hrmsConds.length > 0) {
              const hrmsEmp = await hrmsDb.collection('employees').findOne({ $or: hrmsConds });
              if (hrmsEmp) {
                if (hrmsEmp.emp_no) targetEmp = String(hrmsEmp.emp_no).trim();
                if (hrmsEmp.employee_name && (!username || /^\d{10}$/.test(username))) {
                  username = hrmsEmp.employee_name;
                }
              }
            }
          }
        } catch (_) {}
      }

      let samsDb = null;
      try {
        samsDb = await getSAMSDb();
      } catch (err) {
        console.warn('[VerifyToken] SAMS DB connection error:', err.message);
      }

      if (samsDb && (identifier || targetEmp || username || decoded.userId || email)) {
        const orConditions = [];
        if (decoded.userId) {
          try {
            const { ObjectId } = await import('mongodb');
            orConditions.push({ _id: new ObjectId(decoded.userId) });
          } catch (_) {}
        }
        if (targetEmp) {
          orConditions.push({ hrmsEmployeeId: targetEmp });
          orConditions.push({ username: targetEmp.toLowerCase() });
        }
        if (email || decoded.email) {
          orConditions.push({ email: (email || decoded.email).toLowerCase() });
          orConditions.push({ email: email || decoded.email });
        }
        if (username) {
          orConditions.push({ username: username.toLowerCase() });
          orConditions.push({ displayName: username });
        }
        if (identifier && identifier !== username) {
          orConditions.push({ username: identifier.toLowerCase() });
          orConditions.push({ displayName: identifier });
        }

        const samsCol = samsDb.collection('systemusers');
        const samsUser = await samsCol.findOne({
          $or: orConditions,
          $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }]
        });

        if (samsUser) {
          console.log(`[VerifyToken] SAMS lookup: resolved to user _id=${samsUser._id}, username=${samsUser.username}, isSuperAdmin=${samsUser.isSuperAdmin}`);
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            valid: true,
            data: {
              userId: samsUser._id.toString(),
              username: samsUser.username,
              name: samsUser.displayName || samsUser.username,
              displayName: samsUser.displayName,
              email: samsUser.email || email,
              hrmsEmployeeId: samsUser.hrmsEmployeeId || targetEmp || null,
              employeeId: samsUser.hrmsEmployeeId || targetEmp || null,
              empNo: samsUser.hrmsEmployeeId || targetEmp || null,
              role: samsUser.isSuperAdmin ? 'super_admin' : (decoded.role || 'operator'),
              isSuperAdmin: Boolean(samsUser.isSuperAdmin),
              systemRoleId: samsUser.systemRoleId ? samsUser.systemRoleId.toString() : null,
              divisionIds: (samsUser.divisionIds || []).map(id => id.toString()),
              gateIds: (samsUser.gateIds || []).map(id => id.toString()),
              departmentIds: (samsUser.departmentIds || []).map(id => id.toString()),
              allowedLocationIds: (samsUser.allowedLocationIds || []).map(id => id.toString()),
              gateAccessModes: samsUser.gateAccessModes || {},
              departmentAccessModes: samsUser.departmentAccessModes || {},
              isActive: samsUser.isActive !== false,
              ...baseData
            }
          });
        }
      }

      // Default/auto-provision payload if valid user coming from HRMS/CRM
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(decoded.userId),
          username: username || (email ? email.split('@')[0] : targetEmp) || 'user',
          name: crmUser?.name || decoded.name || username,
          displayName: crmUser?.name || decoded.name || username,
          email: email || decoded.email || null,
          hrmsEmployeeId: targetEmp || null,
          employeeId: targetEmp || null,
          empNo: targetEmp || null,
          role: decoded.role || 'operator',
          isSuperAdmin: false,
          systemRoleId: null,
          divisionIds: [],
          gateIds: [],
          departmentIds: [],
          allowedLocationIds: [],
          isActive: true,
          ...baseData
        }
      });
    }

    // 7. For Academic Portal: return verified user details (userId, role, email, employeeId, expiresAt)
    if (decoded.portalId === PORTAL_IDS.ACADEMIC_PORTAL) {
      // Prevent replay attacks (one-time token use)
      const tokenKey = `${decoded.userId}_${decoded.iat}_${decoded.portalId}`;
      if (isTokenUsed(tokenKey)) {
        console.warn(`[VerifyToken] Academic Portal token already used: ${tokenKey}`);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          valid: false,
          message: 'Invalid or expired token'
        });
      }
      markTokenUsed(tokenKey, decoded.exp * 1000);

      // Attempt to resolve user in academic_portal database
      let academicUser = null;
      try {
        academicUser = await findAcademicUser({
          email: email,
          employeeId: crmUser?.employeeId || decoded.employeeId,
          username: username,
          phone: crmUser?.phone || decoded.phone
        });
      } catch (err) {
        console.warn('[VerifyToken] Academic DB lookup error:', err.message);
      }

      if (!academicUser && decoded.databaseSource !== 'academic_portal') {
        console.warn(`[VerifyToken] Access Denied: User ${decoded.userId} (${email || username}) not found in academic_portal database`);
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          valid: false,
          message: 'User not found in Academic Portal system'
        });
      }

      const resolvedUserId = academicUser?.id ? String(academicUser.id) : (crmUser?.employeeId || String(decoded.userId));
      const resolvedEmployeeId = academicUser?.employee_id || academicUser?.employeeId || crmUser?.employeeId || String(decoded.userId);
      const resolvedRole = academicUser?.role || academicUser?.role_name || decoded.role || 'faculty';
      const resolvedEmail = academicUser?.email || email || '';

      console.log(`[VerifyToken] Academic Portal resolved: userId=${resolvedUserId}, employeeId=${resolvedEmployeeId}, role=${resolvedRole}`);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        data: {
          userId: String(resolvedUserId),
          portalId: 'academic-portal',
          role: resolvedRole,
          email: resolvedEmail,
          employeeId: String(resolvedEmployeeId),
          expiresAt
        }
      });
    }

    // 8. For Examination Management System (EMS / examination-portal)
    if (
      decoded.portalId === PORTAL_IDS.EXAMINATION_PORTAL ||
      decoded.portalId === 'ems' ||
      decoded.portalId === 'examination'
    ) {
      // Prevent replay attacks (one-time token use)
      const tokenKey = `${decoded.userId}_${decoded.iat}_${decoded.portalId}`;
      if (isTokenUsed(tokenKey)) {
        console.warn(`[VerifyToken] Examination Portal token already used: ${tokenKey}`);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          valid: false,
          message: 'Invalid or expired token'
        });
      }
      markTokenUsed(tokenKey, decoded.exp * 1000);

      // A. Check if Student
      const isStudent =
        decoded.role === 'student' ||
        decoded.databaseSource === 'student_credentials' ||
        (crmUser && (crmUser.admission_number || crmUser.rollNumber));

      if (isStudent) {
        let stuUser = null;
        if (username) stuUser = await findStudentByUsername(username);
        if (!stuUser && decoded.userId) stuUser = await findStudentById(decoded.userId);

        const studentPin = stuUser?.pin_no || stuUser?.admission_number || stuUser?.username || username || String(decoded.userId);
        const studentUserId = stuUser?.id ? String(stuUser.id) : String(decoded.userId);

        console.log(`[VerifyToken] Examination Portal resolved Student: userId=${studentUserId}, pinNo=${studentPin}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(studentUserId),
            portalId: 'examination-portal',
            role: 'student',
            pinNo: String(studentPin),
            username: String(studentPin),
            expiresAt
          }
        });
      }

      // B. Bootstrap Super Administrator
      if (email === 'ravi@pydahsoft.in') {
        console.log(`[VerifyToken] Examination Portal resolved Super Admin: ${email}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(decoded.userId),
            portalId: 'examination-portal',
            role: 'super_admin',
            email: 'ravi@pydahsoft.in',
            employeeId: crmUser?.employeeId || 'SUPER_ADMIN',
            username: username || 'ravi@pydahsoft.in',
            expiresAt
          }
        });
      }

      // C. Staff & Administrators: Check examination_portal database first
      let examUser = null;
      const targetEmp = decoded.employeeId || crmUser?.employeeId || (/^\d+$/.test(username) ? username : null);
      try {
        examUser = await findExaminationUser({
          email: email || decoded.email,
          employeeId: targetEmp,
          username: username || decoded.username,
          phone: crmUser?.phone || decoded.phone
        });
      } catch (err) {
        console.warn('[VerifyToken] Examination DB lookup error:', err.message);
      }

      if (examUser) {
        const resolvedUserId = examUser.id || crmUser?.employeeId || String(decoded.userId);
        const resolvedEmployeeId = examUser.employee_id || crmUser?.employeeId || username || String(decoded.userId);
        const resolvedRole = examUser.role || decoded.role || 'staff';
        const resolvedEmail = examUser.email || email || '';
        const resolvedUsername = examUser.username || username || resolvedEmail;

        console.log(`[VerifyToken] Examination Portal resolved from DB: userId=${resolvedUserId}, employeeId=${resolvedEmployeeId}, role=${resolvedRole}`);
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          valid: true,
          data: {
            userId: String(resolvedUserId),
            portalId: 'examination-portal',
            role: resolvedRole,
            email: resolvedEmail,
            employeeId: String(resolvedEmployeeId),
            username: resolvedUsername,
            expiresAt
          }
        });
      }

      // D. Deny access if user does not have an assigned role in Examination Management System
      console.warn(`[VerifyToken] Forbidden: User ${decoded.userId} (${email || username}) has no assigned role in Examination Portal`);
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        valid: false,
        message: 'User does not have an assigned role in Examination Management System'
      });
    }

    // 9. General fallback
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

/**
 * Quick portal switcher endpoint for CDN widget / cross-portal switching
 * POST /auth/switch-portal
 */
export const switchPortal = async (req, res, next) => {
  try {
    const { targetPortalId, currentPortalId, token: bodyToken, user: bodyUser } = req.body;

    if (!targetPortalId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'targetPortalId is required'
      });
    }

    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : bodyToken;

    let resolvedUserId = null;
    let resolvedUsername = null;
    let resolvedEmail = null;
    let resolvedRole = 'user';
    let resolvedDatabaseSource = currentPortalId || null;
    let resolvedPortals = [];
    let resolvedPhone = null;
    let resolvedEmployeeId = null;

    // 1. Try verifying as CRM JWT access token
    if (token) {
      try {
        const decoded = verifyJWTToken(token);
        if (decoded && (decoded.userId || decoded.username)) {
          resolvedUserId = decoded.userId;
          resolvedUsername = decoded.username;
          resolvedEmail = decoded.email;
          resolvedRole = decoded.role || 'user';
          resolvedDatabaseSource = decoded.databaseSource || currentPortalId || 'rbac_users';
          resolvedPortals = Array.isArray(decoded.portals) ? decoded.portals : [];
          resolvedPhone = decoded.phone;
          resolvedEmployeeId = decoded.employeeId;
        }
      } catch (e) {
        // Not a standard CRM token or expired; decode payload without verification as fallback
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4 !== 0) b64 += '=';
            const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            resolvedUserId = payload.userId || payload.id || payload._id || payload.sub;
            resolvedUsername = payload.username || payload.name;
            resolvedEmail = payload.email;
            resolvedRole = payload.role || 'user';
            resolvedEmployeeId = payload.employeeId || payload.emp_no || payload.hrmsEmployeeId;
            if (Array.isArray(payload.portals)) resolvedPortals = payload.portals;
          }
        } catch (_) {}
      }
    }

    // 2. Fallback to bodyUser object if provided by host portal
    if (bodyUser) {
      if (!resolvedUserId) resolvedUserId = bodyUser.id || bodyUser.userId || bodyUser._id;
      if (!resolvedUsername) resolvedUsername = bodyUser.username;
      if (!resolvedEmail) resolvedEmail = bodyUser.email;
      if (!resolvedPhone) resolvedPhone = bodyUser.phone || bodyUser.mobile;
      if (bodyUser.role) resolvedRole = bodyUser.role;
      if (bodyUser.databaseSource) resolvedDatabaseSource = bodyUser.databaseSource;
      if (Array.isArray(bodyUser.portals) && bodyUser.portals.length > 0) {
        resolvedPortals = bodyUser.portals;
      }
      if (!resolvedEmployeeId) resolvedEmployeeId = bodyUser.hrmsEmployeeId || bodyUser.employeeId || bodyUser.emp_no || bodyUser.rollNumber || bodyUser.empNo;
      if (!resolvedUsername && resolvedEmployeeId) resolvedUsername = resolvedEmployeeId;
      if (!resolvedUsername && !resolvedEmployeeId) resolvedUsername = bodyUser.name;
      if (!resolvedPhone && resolvedUsername && /^\d{10}$/.test(resolvedUsername)) {
        resolvedPhone = resolvedUsername;
      }
      if (!resolvedEmployeeId && resolvedUsername && /^\d+$/.test(resolvedUsername) && !/^\d{10}$/.test(resolvedUsername)) {
        resolvedEmployeeId = resolvedUsername;
      }
      if (!resolvedEmployeeId && resolvedUserId && /^\d+$/.test(String(resolvedUserId)) && !/^\d{10}$/.test(String(resolvedUserId))) {
        resolvedEmployeeId = String(resolvedUserId);
      }
    }

    const PORTAL_TO_DB_SOURCE = {
      'academic-portal': 'academic_portal',
      'academic_portal': 'academic_portal',
      'student-portal': 'rbac_users',
      'hrms': 'hrms',
      'fee-management': 'fee',
      'fee': 'fee',
      'stationary-management': 'stationary',
      'stationary': 'stationary',
      'transport-management': 'transport',
      'transport': 'transport',
      'hostel-automation': 'hostel',
      'hostel': 'hostel',
      'admissions-crm': 'admissions_db',
      'admissions': 'admissions_db',
      'examination-portal': 'examination_portal',
      'ems': 'examination_portal',
      'staff-recruitment': 'srs',
      'srs': 'srs',
      'sams': 'sams',
      'labour-management': 'sams'
    };

    if (!resolvedDatabaseSource && currentPortalId && PORTAL_TO_DB_SOURCE[currentPortalId]) {
      resolvedDatabaseSource = PORTAL_TO_DB_SOURCE[currentPortalId];
    }

    if (!resolvedPhone && resolvedUsername && /^\d{10}$/.test(resolvedUsername)) {
      resolvedPhone = resolvedUsername;
    }

    if (!resolvedEmployeeId && resolvedUsername && /^\d+$/.test(resolvedUsername) && !/^\d{10}$/.test(resolvedUsername)) {
      resolvedEmployeeId = resolvedUsername;
    }

    if (!resolvedUserId && !resolvedEmail && !resolvedUsername && !resolvedEmployeeId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No authenticated user identity provided. Please log in first.'
      });
    }

    // 3. Always discover authoritative user portals directly from live databases
    const userToDiscover = {
      id: resolvedUserId,
      username: resolvedUsername,
      email: resolvedEmail,
      phone: resolvedPhone,
      employeeId: resolvedEmployeeId,
      role: resolvedRole
    };

    resolvedPortals = await discoverUserPortals(userToDiscover, resolvedDatabaseSource);

    // Capture auto-enriched identity fields from discovery
    if (!resolvedEmail && userToDiscover.email) resolvedEmail = userToDiscover.email;
    if (!resolvedEmployeeId && userToDiscover.employeeId) resolvedEmployeeId = userToDiscover.employeeId;
    if (!resolvedPhone && userToDiscover.phone) resolvedPhone = userToDiscover.phone;

    // 4. Check permissions (Only central master admin gets unconditional access; others must be verified)
    const isMasterAdmin = (resolvedEmail || '').toLowerCase() === 'ravi@pydahsoft.in';
    if (!isMasterAdmin && !resolvedPortals.includes(targetPortalId)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Your account does not have access permissions for ${targetPortalId}.`
      });
    }

    // 5. Generate SSO token with target-portal specific role resolution
    let targetRole = resolvedRole;
    let targetUserId = resolvedUserId || resolvedEmail || resolvedUsername;
    let targetDatabaseSource = resolvedDatabaseSource || 'rbac_users';

    if ((targetPortalId === PORTAL_IDS.STATIONARY_MANAGEMENT || targetPortalId === 'stationary') && !isMasterAdmin) {
      try {
        const stationaryDb = await getStationaryDb();
        if (stationaryDb) {
          const targetEmp = resolvedEmployeeId || (/^\d+$/.test(resolvedUsername) ? resolvedUsername : null);
          const orConds = [];
          if (resolvedEmail) {
            orConds.push({ email: resolvedEmail.toLowerCase() });
            orConds.push({ email: resolvedEmail });
          }
          if (targetEmp) {
            orConds.push({ empNo: String(targetEmp).trim() });
            if (/^\d+$/.test(String(targetEmp).trim())) {
              orConds.push({ empNo: Number(targetEmp) });
            }
            orConds.push({ name: String(targetEmp).trim() });
          }
          if (resolvedUsername) {
            orConds.push({ name: resolvedUsername });
            orConds.push({ username: resolvedUsername });
          }
          if (userToDiscover.name) {
            orConds.push({ name: userToDiscover.name });
          }
          if (resolvedUserId && /^[0-9a-fA-F]{24}$/.test(String(resolvedUserId))) {
            try {
              const { ObjectId } = await import('mongodb');
              orConds.push({ _id: new ObjectId(resolvedUserId) });
            } catch (_) {}
          }
          if (orConds.length > 0) {
            let sAdmin = await stationaryDb.collection('subadmins').findOne({ $or: orConds });
            if (!sAdmin) {
              try {
                sAdmin = await stationaryDb.collection('users').findOne({ $or: orConds });
              } catch (_) {}
            }
            if (sAdmin) {
              targetUserId = sAdmin._id.toString();
              targetRole = sAdmin.role || 'Editor';
              targetDatabaseSource = 'stationary';
            }
          }
        }
      } catch (err) {
        console.error('[switchPortal] Stationary user resolution error:', err.message);
      }
    }

    if ((targetPortalId === PORTAL_IDS.STAFF_RECRUITMENT || targetPortalId === 'staff-recruitment' || targetPortalId === 'srs') && !isMasterAdmin) {
      try {
        const srsDb = await getSRSDb();
        if (srsDb) {
          const targetEmp = resolvedEmployeeId || (/^\d+$/.test(resolvedUsername) ? resolvedUsername : null);
          const orConds = [];
          if (resolvedEmail) {
            orConds.push({ email: resolvedEmail.toLowerCase() });
            orConds.push({ email: resolvedEmail });
          }
          if (targetEmp) {
            orConds.push({ employeeId: String(targetEmp).trim() });
            if (/^\d+$/.test(String(targetEmp).trim())) {
              orConds.push({ employeeId: Number(targetEmp) });
            }
          }
          if (resolvedPhone && /^\d{10}$/.test(String(resolvedPhone).trim())) {
            orConds.push({ 'profile.phone': String(resolvedPhone).trim() });
          }
          if (resolvedUserId && /^[0-9a-fA-F]{24}$/.test(String(resolvedUserId))) {
            try {
              const { ObjectId } = await import('mongodb');
              orConds.push({ _id: new ObjectId(resolvedUserId) });
            } catch (_) {}
          }
          let srsUser = null;
          if (orConds.length > 0) {
            srsUser = await srsDb.collection('users').findOne({
              $or: orConds,
              $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }]
            });
          }
          if (!srsUser) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
              success: false,
              message: 'Your account does not have access permissions for staff-recruitment.'
            });
          }
          targetUserId = srsUser._id.toString();
          targetRole = srsUser.role || 'candidate';
          targetDatabaseSource = 'srs';
        }
      } catch (err) {
        console.error('[switchPortal] SRS user resolution error:', err.message);
      }
    }

    if (targetPortalId === PORTAL_IDS.STUDENT_PORTAL && !isMasterAdmin) {
      // Resolve user's actual local role in Student Portal to prevent Admissions role leakage
      let resolvedStudentUser = null;
      let resolvedRbacUser = null;

      const targetEmp = resolvedEmployeeId || (/^\d+$/.test(resolvedUsername) ? resolvedUsername : null);
      if (targetEmp) {
        resolvedStudentUser = await findStudentByUsername(targetEmp);
      }
      if (!resolvedStudentUser && resolvedUsername && /^\d+$/.test(resolvedUsername)) {
        resolvedStudentUser = await findStudentByUsername(resolvedUsername);
      }

      if (resolvedStudentUser) {
        targetRole = 'student';
        targetUserId = resolvedStudentUser.id;
        targetDatabaseSource = 'student_credentials';
      } else {
        if (userToDiscover.hrms_id) {
          resolvedRbacUser = await findRBACUserByHrmsId(userToDiscover.hrms_id);
        } else if (resolvedDatabaseSource === 'hrms' && resolvedUserId) {
          resolvedRbacUser = await findRBACUserByHrmsId(resolvedUserId);
        }
        if (!resolvedRbacUser && resolvedEmail) {
          resolvedRbacUser = await findRBACUserByEmail(resolvedEmail);
        }
        const GENERIC_NAMES = ['admin', 'superadmin', 'super_admin', 'sub_super_admin', 'subadmin', 'user', 'manager', 'counsellor', 'staff'];
        if (!resolvedRbacUser && targetEmp && !GENERIC_NAMES.includes(String(targetEmp).toLowerCase())) {
          resolvedRbacUser = await findRBACUserByIdentifier(String(targetEmp), { email: resolvedEmail, hrmsId: userToDiscover.hrms_id });
        }
        if (!resolvedRbacUser && resolvedUsername && !GENERIC_NAMES.includes(String(resolvedUsername).toLowerCase())) {
          resolvedRbacUser = await findRBACUserByIdentifier(String(resolvedUsername), { email: resolvedEmail, hrmsId: userToDiscover.hrms_id });
        }

        if (resolvedRbacUser) {
          targetRole = resolvedRbacUser.role; // Local RBAC role in student_database
          targetUserId = resolvedRbacUser.id;
          targetDatabaseSource = 'rbac_users';
        } else {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Your account does not have access permissions for student-portal.'
          });
        }
      }
    }

    const encryptedToken = await generatePortalToken(
      targetUserId,
      targetPortalId,
      targetRole,
      targetDatabaseSource,
      resolvedUsername || resolvedEmail,
      {
        email: resolvedEmail,
        portals: resolvedPortals,
        phone: resolvedPhone,
        employeeId: resolvedEmployeeId
      }
    );

    // 6. Build target redirect URL
    const portalMeta = PORTAL_METADATA[targetPortalId] || (targetPortalId === 'stationary' ? PORTAL_METADATA[PORTAL_IDS.STATIONARY_MANAGEMENT] : null);
    let baseUrl = portalMeta ? portalMeta.url : 'https://crm.pydah.edu.in';

    // Special logic for Student Portal (staff vs student entrypoint)
    if (targetPortalId === PORTAL_IDS.STUDENT_PORTAL) {
      const parsed = new URL(baseUrl);
      const isStudent =
        targetRole === 'student' ||
        targetDatabaseSource === 'student_credentials' ||
        Boolean(bodyUser?.admission_number || bodyUser?.rollNumber);

      if (isStudent) {
        baseUrl = `${parsed.origin}/student/login`;
      } else {
        baseUrl = `${parsed.origin}/login`;
      }
    }

    const redirectUrlObj = new URL(baseUrl);
    redirectUrlObj.searchParams.set('token', encryptedToken);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Portal SSO redirect token generated successfully',
      data: {
        encryptedToken,
        targetPortalId,
        redirectUrl: redirectUrlObj.toString(),
        expiresIn: '15m'
      }
    });

  } catch (error) {
    console.error('[switchPortal] Error:', error.message);
    next(error);
  }
};

/**
 * Get user portals for CDN switcher widget
 * POST /auth/user-portals
 */
export const getUserPortals = async (req, res, next) => {
  try {
    const { token: bodyToken, user: bodyUser, currentPortalId } = req.body;
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : bodyToken;

    let userObj = bodyUser ? { ...bodyUser } : {};
    let resolvedPortals = Array.isArray(userObj.portals) ? userObj.portals : [];

    const PORTAL_TO_DB_SOURCE = {
      'academic-portal': 'academic_portal',
      'academic_portal': 'academic_portal',
      'student-portal': 'rbac_users',
      'hrms': 'hrms',
      'fee-management': 'fee',
      'fee': 'fee',
      'stationary-management': 'stationary',
      'stationary': 'stationary',
      'transport-management': 'transport',
      'transport': 'transport',
      'hostel-automation': 'hostel',
      'hostel': 'hostel',
      'admissions-crm': 'admissions_db',
      'admissions': 'admissions_db',
      'examination-portal': 'examination_portal',
      'ems': 'examination_portal',
      'staff-recruitment': 'srs',
      'srs': 'srs',
      'sams': 'sams',
      'labour-management': 'sams'
    };

    if (token) {
      try {
        const decoded = verifyJWTToken(token);
        if (decoded) {
          userObj = { ...userObj, ...decoded };
          if (Array.isArray(decoded.portals) && decoded.portals.length > 0) {
            resolvedPortals = decoded.portals;
          }
        }
      } catch (e) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4 !== 0) b64 += '=';
            const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            userObj = { ...payload, ...userObj };
            if (Array.isArray(payload.portals)) resolvedPortals = payload.portals;
          }
        } catch (_) {}
      }
    }

    if (!userObj.employeeId && userObj.hrmsEmployeeId) userObj.employeeId = userObj.hrmsEmployeeId;
    if (!userObj.employeeId && userObj.empNo) userObj.employeeId = userObj.empNo;
    if (!userObj.employeeId && userObj.emp_no) userObj.employeeId = userObj.emp_no;
    if (!userObj.employeeId && userObj.userId && /^\d+$/.test(String(userObj.userId)) && !/^\d{10}$/.test(String(userObj.userId))) {
      userObj.employeeId = String(userObj.userId);
    }

    const resolvedDbSource = userObj.databaseSource || (currentPortalId && PORTAL_TO_DB_SOURCE[currentPortalId]) || currentPortalId;

    if (userObj.id || userObj.userId || userObj.email || userObj.username || userObj.employeeId || userObj.phone || userObj.mobile) {
      resolvedPortals = await discoverUserPortals(userObj, resolvedDbSource);
    }

    const isMasterAdmin = (userObj.email || '').toLowerCase() === 'ravi@pydahsoft.in';

    const accessible = Object.values(PORTAL_METADATA).filter(p => {
      if (isMasterAdmin) return true;
      return resolvedPortals.includes(p.id);
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: {
          name: userObj.name || userObj.username || userObj.email || 'User',
          email: userObj.email || null,
          role: userObj.role || 'user',
          profilePhoto: userObj.profilePhoto || null
        },
        portals: accessible,
        allPortals: Object.values(PORTAL_METADATA)
      }
    });
  } catch (error) {
    console.error('[getUserPortals] Error:', error.message);
    next(error);
  }
};

export default {
  login,
  generateTokenForPortal,
  validateUserCredentials,
  verifyToken,
  switchPortal,
  getUserPortals
};

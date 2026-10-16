import { 
  validateCredentials, 
  validateCredentialsForHRMS, 
  validateCredentialsForHostel, 
  validateCredentialsForTransport,
  validateCredentialsForFee,
  generatePortalToken, 
  getCRMUserForVerify,
  discoverUserPortals
} from '../services/auth.service.js';
import { generateToken, verifyToken as verifyJWTToken } from '../services/token.service.js';
import { findHRMSUserByEmail } from '../services/hrms.service.js';
import { findHostelUserForVerify } from '../services/hostel.service.js';
import { findTransportUserRole } from '../services/transport.service.js';
import { findAdmissionsUserByEmail, findAdmissionsUserById, findAdmissionsUserByIdentifier } from '../models/admissions.model.js';
import { findRBACUserByIdentifier, findRBACUserById } from '../models/rbac.model.js';
import { findStudentByUsername, findStudentById } from '../models/student.model.js';
import { findAcademicUser } from '../models/academic.model.js';
import { findExaminationUser } from '../models/examination.model.js';
import { getFeeDb } from '../config/database.js';
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
      let admUser = null;

      // 1. If databaseSource was admissions_db, try finding by ID first
      if (decoded.databaseSource === 'admissions_db') {
        admUser = await findAdmissionsUserById(decoded.userId);
      }

      // 2. If not found or came from another database source, search by identity candidates
      if (!admUser) {
        const candidates = [email, identifier, username, decoded.userId, crmUser?.phone].filter(Boolean);
        for (const candidate of candidates) {
          admUser = await findAdmissionsUserByIdentifier(candidate, {
            email,
            phone: crmUser?.phone,
            name: crmUser?.name
          });
          if (admUser) {
            console.log(`[VerifyToken] Admissions lookup: resolved candidate "${candidate}" to userId=${admUser.id}`);
            break;
          }
        }
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
      const rawRole = String(decoded.role || '').trim().toLowerCase();
      const isAdminRole = ['admin', 'superadmin', 'super_admin', 'super admin'].includes(rawRole);
      let roleName = admUser?.role_name;

      if (!roleName) {
        if (isAdminRole) {
          roleName = 'Super Admin';
        } else if (rawRole === 'manager') {
          roleName = 'Manager';
        } else {
          roleName = decoded.role || 'Counsellor';
        }
      } else if (isAdminRole && roleName.toLowerCase() === 'admin') {
        roleName = 'Super Admin';
      }

      const isManager = admUser ? (admUser.is_manager === 1 || admUser.is_manager === true) : (roleName === 'Manager');
      const isActive = admUser ? (admUser.is_active === 1 || admUser.is_active === true || admUser.is_active === null) : true;
      const finalUserId = admUser?.id || decoded.userId;
      const finalEmail = admUser?.email || email;
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
      try {
        examUser = await findExaminationUser({
          email: email,
          employeeId: crmUser?.employeeId || decoded.employeeId,
          username: username,
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
            resolvedEmployeeId = payload.employeeId || payload.emp_no;
            if (Array.isArray(payload.portals)) resolvedPortals = payload.portals;
          }
        } catch (_) {}
      }
    }

    // 2. Fallback to bodyUser object if provided by host portal
    if (bodyUser) {
      if (!resolvedUserId) resolvedUserId = bodyUser.id || bodyUser.userId || bodyUser._id;
      if (!resolvedUsername) resolvedUsername = bodyUser.username || bodyUser.name;
      if (!resolvedEmail) resolvedEmail = bodyUser.email;
      if (bodyUser.role) resolvedRole = bodyUser.role;
      if (bodyUser.databaseSource) resolvedDatabaseSource = bodyUser.databaseSource;
      if (Array.isArray(bodyUser.portals) && bodyUser.portals.length > 0) {
        resolvedPortals = bodyUser.portals;
      }
      if (!resolvedPhone) resolvedPhone = bodyUser.phone || bodyUser.mobile;
      if (!resolvedEmployeeId) resolvedEmployeeId = bodyUser.employeeId || bodyUser.emp_no || bodyUser.rollNumber;
    }

    if (!resolvedUserId && !resolvedEmail && !resolvedUsername && !resolvedEmployeeId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No authenticated user identity provided. Please log in first.'
      });
    }

    // 3. Discover user portals if not already present
    if (resolvedPortals.length === 0) {
      resolvedPortals = await discoverUserPortals({
        id: resolvedUserId,
        username: resolvedUsername,
        email: resolvedEmail,
        phone: resolvedPhone,
        employeeId: resolvedEmployeeId,
        role: resolvedRole
      }, resolvedDatabaseSource);
    }

    // 4. Check permissions (Only super_admin gets all portals; others must be authorized)
    const normalizedRole = (resolvedRole || '').toLowerCase();
    const isSuperAdmin = ['super_admin', 'superadmin'].includes(normalizedRole);
    if (!isSuperAdmin && !resolvedPortals.includes(targetPortalId)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Your account does not have access permissions for ${targetPortalId}.`
      });
    }

    // 5. Generate SSO token
    const encryptedToken = await generatePortalToken(
      resolvedUserId || resolvedEmail || resolvedUsername,
      targetPortalId,
      resolvedRole,
      resolvedDatabaseSource || 'rbac_users',
      resolvedUsername || resolvedEmail,
      {
        email: resolvedEmail,
        portals: resolvedPortals,
        phone: resolvedPhone,
        employeeId: resolvedEmployeeId
      }
    );

    // 6. Build target redirect URL
    const portalMeta = PORTAL_METADATA[targetPortalId];
    let baseUrl = portalMeta ? portalMeta.url : 'https://crm.pydah.edu.in';

    // Special logic for Student Portal (staff vs student entrypoint)
    if (targetPortalId === PORTAL_IDS.STUDENT_PORTAL) {
      const parsed = new URL(baseUrl);
      if (resolvedDatabaseSource === 'rbac_users') {
        baseUrl = `${parsed.origin}/login`;
      } else {
        baseUrl = `${parsed.origin}/student/login`;
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

    if (resolvedPortals.length === 0 && (userObj.id || userObj.userId || userObj.email || userObj.username || userObj.employeeId)) {
      resolvedPortals = await discoverUserPortals(userObj, userObj.databaseSource || currentPortalId);
    }

    const normalizedRole = (userObj.role || '').toLowerCase();
    const isSuperAdmin = ['super_admin', 'superadmin'].includes(normalizedRole);

    const accessible = Object.values(PORTAL_METADATA).filter(p => {
      if (isSuperAdmin) return true;
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

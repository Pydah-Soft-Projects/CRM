import jwt from 'jsonwebtoken';
import { TOKEN_TYPES } from '../config/constants.js';

/**
 * Token Service
 * Handles JWT token generation and validation
 */

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (userId, role, portalId, etc.)
 * @param {string} type - Token type (access, refresh, sso)
 * @returns {string} JWT token
 */
export const generateToken = (payload, type = TOKEN_TYPES.ACCESS) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const expiresIn = type === TOKEN_TYPES.SSO 
      ? process.env.JWT_SSO_EXPIRY || '15m'  // Short-lived for SSO
      : type === TOKEN_TYPES.REFRESH
      ? process.env.JWT_REFRESH_EXPIRY || '7d'
      : process.env.JWT_EXPIRY || '1h';

    const tokenPayload = {
      ...payload,
      type,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, secret, { expiresIn });
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Generate SSO token for portal access
 * @param {string} userId - User ID
 * @param {string} portalId - Target portal identifier
 * @param {string} role - User role
 * @param {string} [databaseSource] - Which CRM DB user came from (rbac_users, admissions_db, student_credentials); used for HRMS verify-token lookup
 * @returns {string} SSO JWT token
 */
export const generateSSOToken = (userId, portalId, role, databaseSource = null, username = null, extra = {}) => {
  const payload = {
    userId,
    portalId,
    role,
    issuer: 'crm-auth-gateway',
    timestamp: Date.now(),
    ...extra
  };
  if (databaseSource) {
    payload.databaseSource = databaseSource;
  }
  if (username) {
    payload.username = username;
  }
  return generateToken(payload, TOKEN_TYPES.SSO);
};

/**
 * Decode token without verification (for inspection)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload (not verified)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default {
  generateToken,
  verifyToken,
  generateSSOToken,
  decodeToken
};

/**
 * API Service
 * Handles all backend API communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login user
   * @param {string} username
   * @param {string} password
   * @param {string} role - Optional role hint ('student', 'staff', etc.)
   * @param {string} portalId - When 'hrms', backend validates against HRMS MongoDB only
   * @returns {Promise<Object>} User data and tokens
   */
  login: async (username, password, role = null, portalId = null) => {
    const body = { username, password };
    if (role) body.role = role;
    if (portalId) body.portalId = portalId;
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Validate credentials
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object>} Validation result
   */
  validateCredentials: async (username, password) => {
    return apiRequest('/auth/validate-credentials', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Generate SSO token for portal access
   * Checks cache first, generates new token if needed
   * @param {string} portalId
   * @param {boolean} forceNew - Force generation of new token (skip cache)
   * @returns {Promise<Object>} Encrypted SSO token
   */
  generatePortalToken: async (portalId, forceNew = false) => {
    // Check if we have a cached token for this portal
    if (!forceNew) {
      const cachedToken = getCachedPortalToken(portalId);
      if (cachedToken) {
        console.log(`[TokenCache] Using cached token for portal: ${portalId}`);
        return {
          success: true,
          data: {
            encryptedToken: cachedToken.token,
            portalId: portalId,
            expiresIn: cachedToken.expiresIn,
            cached: true
          }
        };
      }
    }

    // Generate new token
    const response = await apiRequest('/auth/generate-token', {
      method: 'POST',
      body: JSON.stringify({ portalId }),
    });

    // Cache the token if generation was successful
    if (response.success && response.data.encryptedToken) {
      cachePortalToken(portalId, response.data.encryptedToken, response.data.expiresIn);
      console.log(`[TokenCache] Cached new token for portal: ${portalId}`);
    }

    return response;
  },

  /**
   * Verify token (for external portals)
   * @param {string} encryptedToken
   * @returns {Promise<Object>} Token verification result
   */
  verifyToken: async (encryptedToken) => {
    return apiRequest('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ encryptedToken }),
    });
  },

  /**
   * Clear all cached portal tokens
   */
  clearAllPortalTokens: () => {
    clearAllPortalTokens();
  },
};

/**
 * Portal ID mapping
 * Maps portal URLs to backend portal IDs
 */
export const PORTAL_IDS = {
  'https://admissions.pydah.edu.in': 'admissions-crm',
  'https://sdms.pydah.edu.in': 'student-portal',
  'https://pydahsdms.vercel.app': 'student-portal',
  'https://hms.pydahsoft.in': 'hostel-automation',
  'https://hrms.pydahsoft.in': 'hrms',
  'https://hrms.pydah.edu.in': 'hrms', // HRMS portal
  'http://localhost:3000': 'hostel-automation', // Hostel software (local dev; HRMS local may use another port)
  'https://pydah-fee-management.vercel.app': 'fee-management',
  'https://fees.pydah.edu.in': 'fee-management',
  'https://pydah-transport.vercel.app': 'transport-management',
  'https://transport.pydah.edu.in': 'transport-management',
  'https://academic.pydah.edu.in': 'academic-portal',
  'https://academic.pydah.edu.in/login': 'academic-portal',
  'https://acad.pydah.edu.in': 'academic-portal',
  'https://acad.pydah.edu.in/login': 'academic-portal'
};

/**
 * Get portal ID from URL
 */
export const getPortalIdFromUrl = (url) => {
  return PORTAL_IDS[url] || null;
};

/**
 * Portal Token Cache Management
 * Stores portal SSO tokens in localStorage with expiration
 */

const PORTAL_TOKEN_PREFIX = 'portalToken_';
const PORTAL_TOKEN_EXPIRY_PREFIX = 'portalTokenExpiry_';

/**
 * Cache a portal token
 * @param {string} portalId - Portal identifier
 * @param {string} token - Encrypted SSO token
 * @param {string} expiresIn - Expiration time (e.g., '15m')
 */
export const cachePortalToken = (portalId, token, expiresIn = '15m') => {
  try {
    // Calculate expiration timestamp
    const expiresInMs = parseExpiryTime(expiresIn);
    const expiryTimestamp = Date.now() + expiresInMs;

    // Store token and expiry
    localStorage.setItem(`${PORTAL_TOKEN_PREFIX}${portalId}`, token);
    localStorage.setItem(`${PORTAL_TOKEN_EXPIRY_PREFIX}${portalId}`, expiryTimestamp.toString());

    console.log(`[TokenCache] Cached token for ${portalId}, expires in ${expiresIn}`);
  } catch (error) {
    console.error('[TokenCache] Error caching token:', error);
  }
};

/**
 * Get cached portal token if valid
 * @param {string} portalId - Portal identifier
 * @returns {Object|null} Cached token object or null if expired/missing
 */
export const getCachedPortalToken = (portalId) => {
  try {
    const token = localStorage.getItem(`${PORTAL_TOKEN_PREFIX}${portalId}`);
    const expiryStr = localStorage.getItem(`${PORTAL_TOKEN_EXPIRY_PREFIX}${portalId}`);

    if (!token || !expiryStr) {
      return null;
    }

    const expiryTimestamp = parseInt(expiryStr, 10);
    const now = Date.now();

    // Check if token is expired
    if (now >= expiryTimestamp) {
      // Remove expired token
      clearPortalToken(portalId);
      console.log(`[TokenCache] Token for ${portalId} expired, removed from cache`);
      return null;
    }

    // Calculate remaining time
    const remainingMs = expiryTimestamp - now;
    const remainingMinutes = Math.floor(remainingMs / 60000);

    return {
      token,
      expiresIn: `${remainingMinutes}m`,
      expiresAt: new Date(expiryTimestamp).toISOString()
    };
  } catch (error) {
    console.error('[TokenCache] Error getting cached token:', error);
    return null;
  }
};

/**
 * Clear cached token for a portal
 * @param {string} portalId - Portal identifier
 */
export const clearPortalToken = (portalId) => {
  localStorage.removeItem(`${PORTAL_TOKEN_PREFIX}${portalId}`);
  localStorage.removeItem(`${PORTAL_TOKEN_EXPIRY_PREFIX}${portalId}`);
};

/**
 * Clear all cached portal tokens
 */
export const clearAllPortalTokens = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(PORTAL_TOKEN_PREFIX) || key.startsWith(PORTAL_TOKEN_EXPIRY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('[TokenCache] Cleared all portal tokens');
  } catch (error) {
    console.error('[TokenCache] Error clearing tokens:', error);
  }
};

/**
 * Get all cached portal tokens
 * @returns {Object} Object with portalId as key and token info as value
 */
export const getAllCachedPortalTokens = () => {
  const tokens = {};
  try {
    const keys = Object.keys(localStorage);
    const portalIds = new Set();

    // Find all portal IDs
    keys.forEach(key => {
      if (key.startsWith(PORTAL_TOKEN_PREFIX)) {
        const portalId = key.replace(PORTAL_TOKEN_PREFIX, '');
        portalIds.add(portalId);
      }
    });

    // Get token info for each portal
    portalIds.forEach(portalId => {
      const cached = getCachedPortalToken(portalId);
      if (cached) {
        tokens[portalId] = cached;
      }
    });

    return tokens;
  } catch (error) {
    console.error('[TokenCache] Error getting all tokens:', error);
    return {};
  }
};

/**
 * Parse expiry time string to milliseconds
 * @param {string} expiresIn - Time string (e.g., '15m', '1h', '30s')
 * @returns {number} Milliseconds
 */
const parseExpiryTime = (expiresIn) => {
  if (!expiresIn) return 15 * 60 * 1000; // Default 15 minutes

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default if invalid format

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000 // days
  };

  return value * (multipliers[unit] || 60 * 1000);
};

export default {
  authAPI,
  PORTAL_IDS,
  getPortalIdFromUrl,
  cachePortalToken,
  getCachedPortalToken,
  clearPortalToken,
  clearAllPortalTokens,
  getAllCachedPortalTokens,
};

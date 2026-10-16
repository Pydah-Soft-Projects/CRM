import express from 'express';
import { body } from 'express-validator';
import {
  login,
  generateTokenForPortal,
  validateUserCredentials,
  verifyToken,
  switchPortal,
  getUserPortals
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post(
  '/login',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validateRequest,
  login
);

/**
 * @route   POST /auth/generate-token
 * @desc    Generate encrypted SSO token for portal access
 * @access  Private (requires authentication)
 */
router.post(
  '/generate-token',
  authenticateToken,
  [
    body('portalId')
      .trim()
      .notEmpty()
      .withMessage('Portal ID is required')
  ],
  validateRequest,
  generateTokenForPortal
);

/**
 * @route   POST /auth/validate-credentials
 * @desc    Validate user credentials without generating tokens
 * @access  Public
 */
router.post(
  '/validate-credentials',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validateRequest,
  validateUserCredentials
);

/**
 * @route   POST /auth/verify-token
 * @desc    Verify encrypted SSO token (for external portals)
 * @access  Public (but token required)
 */
router.post(
  '/verify-token',
  [
    body('encryptedToken')
      .notEmpty()
      .withMessage('Encrypted token is required')
  ],
  validateRequest,
  verifyToken
);

/**
 * @route   POST /auth/switch-portal
 * @desc    Generate SSO redirect token for cross-portal floating switcher widget
 * @access  Public / Flexible (accepts bearer token or body user identity)
 */
router.post(
  '/switch-portal',
  [
    body('targetPortalId')
      .trim()
      .notEmpty()
      .withMessage('Target portal ID is required')
  ],
  validateRequest,
  switchPortal
);

/**
 * @route   POST /auth/user-portals
 * @desc    Retrieve list of accessible portals for the floating widget
 * @access  Public / Flexible (accepts bearer token or body user identity)
 */
router.post(
  '/user-portals',
  getUserPortals
);

export default router;

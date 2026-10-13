/**
 * Application Constants
 */

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  SSO: 'sso'
};

export const PORTAL_IDS = {
  ADMISSIONS_CRM: 'admissions-crm',
  STUDENT_PORTAL: 'student-portal',
  HOSTEL_AUTOMATION: 'hostel-automation',
  HRMS: 'hrms',
  TRANSPORT_MANAGEMENT: 'transport-management',
  FEE_MANAGEMENT: 'fee-management',
  ACADEMIC_PORTAL: 'academic-portal'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  MISSING_CREDENTIALS: 'Username and password are required',
  TOKEN_GENERATION_FAILED: 'Failed to generate authentication token',
  TOKEN_ENCRYPTION_FAILED: 'Failed to encrypt token',
  INVALID_TOKEN: 'Invalid or expired token',
  MISSING_TOKEN: 'Authentication token is required',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  INTERNAL_ERROR: 'Internal server error'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  TOKEN_GENERATED: 'Token generated successfully',
  CREDENTIALS_VALID: 'Credentials are valid'
};

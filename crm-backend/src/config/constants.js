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
  ACADEMIC_PORTAL: 'academic-portal',
  EXAMINATION_PORTAL: 'examination-portal'
};

export const PORTAL_METADATA = {
  [PORTAL_IDS.ACADEMIC_PORTAL]: {
    id: PORTAL_IDS.ACADEMIC_PORTAL,
    title: 'Academic Portal',
    category: 'Academics & Faculty',
    description: 'Course curriculum delivery, syllabus schedules, faculty workloads, and timetable.',
    color: '#0d9488',
    url: 'https://acad.pydah.edu.in/login'
  },
  [PORTAL_IDS.ADMISSIONS_CRM]: {
    id: PORTAL_IDS.ADMISSIONS_CRM,
    title: 'Admission Portal',
    category: 'Enrollment Management',
    description: 'Student inquiry pipeline, counselor workflows, and institutional admissions.',
    color: '#0284c7',
    url: 'https://admissions.pydah.edu.in/auth/login'
  },
  [PORTAL_IDS.EXAMINATION_PORTAL]: {
    id: PORTAL_IDS.EXAMINATION_PORTAL,
    title: 'Examination Management System',
    category: 'Exams & Assessment',
    description: 'Examination scheduling, hall tickets, marks evaluation, and result processing.',
    color: '#ea580c',
    url: 'https://ems.pydah.edu.in/login'
  },
  [PORTAL_IDS.FEE_MANAGEMENT]: {
    id: PORTAL_IDS.FEE_MANAGEMENT,
    title: 'Fee Management',
    category: 'Financial Operations',
    description: 'Tuition collection, pending balances, invoice records, and reconciliation.',
    color: '#059669',
    url: 'https://fees.pydah.edu.in/login'
  },
  [PORTAL_IDS.HOSTEL_AUTOMATION]: {
    id: PORTAL_IDS.HOSTEL_AUTOMATION,
    title: 'Hostel Automation',
    category: 'Facility Management',
    description: 'Campus room allotments, warden logs, hostel passes, and mess management.',
    color: '#db2777',
    url: 'https://hms.pydahsoft.in/login'
  },
  [PORTAL_IDS.HRMS]: {
    id: PORTAL_IDS.HRMS,
    title: 'HRMS & Payroll',
    category: 'Staff Operations',
    description: 'Staff directory, biometric attendance, salary payroll, and leave management.',
    color: '#7c3aed',
    url: 'https://hrms.pydah.edu.in/login'
  },
  [PORTAL_IDS.STUDENT_PORTAL]: {
    id: PORTAL_IDS.STUDENT_PORTAL,
    title: 'Student Portal',
    category: 'Learning & Academics',
    description: 'Central student profile, academic records, digital schedules, and updates.',
    color: '#2563eb',
    url: 'https://sdms.pydah.edu.in/student/login'
  },
  [PORTAL_IDS.TRANSPORT_MANAGEMENT]: {
    id: PORTAL_IDS.TRANSPORT_MANAGEMENT,
    title: 'Transport Management',
    category: 'Logistics Hub',
    description: 'Fleet vehicle tracking, bus transit routes, stops, and driver schedules.',
    color: '#d97706',
    url: 'https://transport.pydah.edu.in/login'
  }
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

export const PORTALS_DATA = [
  {
    portalId: 'admissions-crm',
    title: 'Admission Portal',
    category: 'Enrollment Management',
    desc: 'Inquiries, entrance verification, merit ranks, and branch seat allotments.',
    color: '#0284c7',
    badgeText: 'Enrollment & Outreach',
    metrics: ['Inquiry Pipeline', 'Merit Allotments', 'Document Verification'],
    emoji: '🎓',
    subEmoji: '✨',
    gradient: 'from-sky-500/15 via-blue-500/10 to-indigo-500/20',
    borderGlow: 'rgba(2, 132, 199, 0.35)',
    url: 'https://admissions.pydah.edu.in/auth/login',
  },
  {
    portalId: 'student-portal',
    title: 'Student Portal',
    category: 'Learning & Academics',
    desc: 'Semester attendance, timetables, internal marks, and exam results.',
    color: '#d97706',
    badgeText: 'Student Life & Records',
    metrics: ['Attendance 94.8%', 'Hall Tickets', 'Grade Reports'],
    emoji: '📚',
    subEmoji: '🌟',
    gradient: 'from-amber-500/15 via-orange-500/10 to-yellow-500/20',
    borderGlow: 'rgba(217, 119, 6, 0.35)',
    url: 'https://sdms.pydah.edu.in/student/login',
  },
  {
    portalId: 'fee-management',
    title: 'Fee Management',
    category: 'Financial Operations',
    desc: 'Tuition collection, digital receipt records, and online dues clearance.',
    color: '#0891b2',
    badgeText: 'Institutional Finance',
    metrics: ['Digital Invoicing', 'Instant UPI / Cards', 'No-Dues Clearance'],
    emoji: '💳',
    subEmoji: '🪙',
    gradient: 'from-cyan-500/15 via-teal-500/10 to-emerald-500/20',
    borderGlow: 'rgba(8, 145, 178, 0.35)',
    url: 'https://fees.pydah.edu.in/login',
  },
  {
    portalId: 'transport-management',
    title: 'Transport Management',
    category: 'Campus Logistics',
    desc: 'Campus fleet scheduling, bus route directories, and pass renewals.',
    color: '#2563eb',
    badgeText: 'Fleet & Commute',
    metrics: ['Route Directory', 'Live Schedules', 'Bus Pass Renewal'],
    emoji: '🚌',
    subEmoji: '📍',
    gradient: 'from-blue-600/15 via-indigo-500/10 to-sky-500/20',
    borderGlow: 'rgba(37, 99, 235, 0.35)',
    url: 'https://transport.pydah.edu.in/login',
  },
  {
    portalId: 'hostel-automation',
    title: 'Hostel Automation',
    category: 'Facility Management',
    desc: 'Residential room allotments, mess tracking, and digital gate passes.',
    color: '#059669',
    badgeText: 'Campus Housing',
    metrics: ['Room Allocation', 'Mess Records', 'Outing Passes'],
    emoji: '🏠',
    subEmoji: '🔑',
    gradient: 'from-emerald-600/15 via-green-500/10 to-teal-500/20',
    borderGlow: 'rgba(5, 150, 105, 0.35)',
    url: 'https://hms.pydahsoft.in/login',
  },
  {
    portalId: 'hrms',
    title: 'HRMS & Payroll',
    category: 'Staff Operations',
    desc: 'Faculty service profiles, biometric attendance, and salary pay-slips.',
    color: '#4f46e5',
    badgeText: 'Human Capital',
    metrics: ['Staff Profiles', 'Leave Management', 'Monthly Payroll'],
    emoji: '💼',
    subEmoji: '👥',
    gradient: 'from-indigo-600/15 via-purple-500/10 to-violet-500/20',
    borderGlow: 'rgba(79, 70, 229, 0.35)',
    url: 'https://hrms.pydah.edu.in/login',
  },
  {
    portalId: 'academic-portal',
    title: 'Academic Portal',
    category: 'Curriculum & Faculty',
    desc: 'Course curriculum coverage, lecture schedules, and internal marks.',
    color: '#7c3aed',
    badgeText: 'Curriculum & Exams',
    metrics: ['Syllabus Progress', 'Timetable Planner', 'Exam Evaluation'],
    emoji: '🏛️',
    subEmoji: '🏆',
    gradient: 'from-purple-600/15 via-fuchsia-500/10 to-pink-500/20',
    borderGlow: 'rgba(124, 58, 237, 0.35)',
    url: 'https://acad.pydah.edu.in/login',
  }
];

/**
 * Returns a random portal from PORTALS_DATA.
 * Optionally excludes a given portalId to ensure consecutive random picks always differ.
 */
export const getRandomPortal = (excludePortalId = null) => {
  const candidates = excludePortalId
    ? PORTALS_DATA.filter((p) => p.portalId !== excludePortalId)
    : PORTALS_DATA;
  const list = candidates.length > 0 ? candidates : PORTALS_DATA;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
};

/**
 * Look up portal details by portalId
 */
export const getPortalById = (portalId) => {
  return PORTALS_DATA.find((p) => p.portalId === portalId) || null;
};

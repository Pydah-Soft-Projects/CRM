import React from 'react';

/**
 * 3D-styled SVG Illustrations for EVERY Portal Card.
 * All graphics dynamically inherit and react to CSS variable `--card-color`
 * and `--card-color-soft`, ensuring that changing the card color in ONE place
 * automatically recolors the entire graphic!
 *
 * Supports size variants ('small', 'medium', 'large', 'xlarge') so that:
 * - Bigger cards (Academic, Admission, Stationary, Bottom cards) have BIG illustrations
 * - Smaller compact cards (Fee, Hostel, HRMS, Student) have SMALL illustrations
 */

const sizeClasses = {
    small: 'w-20 h-15 sm:w-24 sm:h-18 lg:w-26 lg:h-20 xl:w-28 xl:h-22',
    medium: 'w-24 h-18 sm:w-30 sm:h-23 lg:w-34 lg:h-26 xl:w-40 xl:h-30',
    large: 'w-28 h-22 sm:w-36 sm:h-28 lg:w-42 lg:h-32 xl:w-50 xl:h-38',
    xlarge: 'w-34 h-26 sm:w-44 sm:h-34 lg:w-50 lg:h-38 xl:w-60 xl:h-46'
};

// 1. Stack of 3D Books with Platform Pedestal (Academic Portal - 01: XLARGE)
export const Books3DIllustration = ({ className = '', size = 'xlarge' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.xlarge} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
                <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--card-color)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--card-color)" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id="bookCoverTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--card-color)" stopOpacity="0.88" />
                    <stop offset="100%" stopColor="var(--card-color)" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="bookCoverBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--card-color)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--card-color)" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="pagesGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <filter id="bookShadow" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="var(--card-color)" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* Pedestal Platform */}
            <polygon points="100,120 180,95 100,75 20,95" fill="url(#pedestalGrad)" />
            <polygon points="20,95 100,120 100,145 20,120" fill="var(--card-color)" fillOpacity="0.12" />
            <polygon points="100,120 180,95 180,120 100,145" fill="var(--card-color)" fillOpacity="0.08" />

            {/* Bottom Book */}
            <g filter="url(#bookShadow)">
                <polygon points="35,80 115,105 170,82 90,60" fill="url(#pagesGrad)" />
                <polygon points="35,80 115,105 115,116 35,92" fill="#cbd5e1" />
                <polygon points="115,105 170,82 170,93 115,116" fill="#94a3b8" />
                <polygon points="32,77 112,102 112,118 32,94" fill="url(#bookCoverBottom)" />
                <polygon points="112,102 172,78 172,82 112,106" fill="var(--card-color)" fillOpacity="0.9" />
                <polygon points="32,76 112,101 172,77 92,54" fill="url(#bookCoverBottom)" />
            </g>

            {/* Top Book (Tilted) */}
            <g filter="url(#bookShadow)">
                <polygon points="45,55 125,82 125,94 45,67" fill="url(#bookCoverTop)" />
                <polygon points="125,82 178,60 178,64 125,86" fill="var(--card-color)" fillOpacity="0.9" />
                <polygon points="48,53 123,78 175,56 100,34" fill="url(#pagesGrad)" />
                <polygon points="48,53 123,78 123,88 48,63" fill="#cbd5e1" />
                <polygon points="123,78 175,56 175,66 123,88" fill="#e2e8f0" />
                <line x1="52" y1="58" x2="120" y2="82" stroke="var(--card-color)" strokeOpacity="0.3" strokeWidth="1" />
                <line x1="55" y1="63" x2="118" y2="85" stroke="var(--card-color)" strokeOpacity="0.2" strokeWidth="1" />
                <polygon points="44,51 124,76 179,53 99,30" fill="url(#bookCoverTop)" />
                <polygon points="135,72 142,75 140,88 135,85" fill="#ffffff" fillOpacity="0.9" />
            </g>
        </svg>
    </div>
);

// 2. 3D Application Form / Clipboard with Stylus Pen (Admission Portal - 02: LARGE)
export const Admission3DIllustration = ({ className = '', size = 'large' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.large} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <defs>
                <linearGradient id="sheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <filter id="sheetShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="2" dy="6" stdDeviation="5" floodColor="var(--card-color)" floodOpacity="0.2" />
                </filter>
            </defs>
            <path d="M 60 10 Q 140 20 180 80 Q 190 130 140 150 Q 80 160 40 120 Z" fill="var(--card-color)" fillOpacity="0.08" />
            <g filter="url(#sheetShadow)" transform="rotate(-6 100 85)">
                <rect x="55" y="25" width="85" height="115" rx="10" fill="url(#sheetGrad)" stroke="#e2e8f0" strokeWidth="1" />
                <rect x="55" y="25" width="85" height="22" rx="10" fill="var(--card-color)" fillOpacity="0.15" />
                <rect x="65" y="32" width="30" height="8" rx="4" fill="var(--card-color)" fillOpacity="0.8" />
                <circle cx="75" cy="62" r="10" fill="var(--card-color)" fillOpacity="0.18" />
                <circle cx="75" cy="59" r="4" fill="var(--card-color)" fillOpacity="0.7" />
                <path d="M 69 68 C 69 65 81 65 81 68" stroke="var(--card-color)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
                <rect x="92" y="55" width="38" height="4" rx="2" fill="#cbd5e1" />
                <rect x="92" y="63" width="28" height="4" rx="2" fill="#e2e8f0" />
                <circle cx="68" cy="85" r="4" fill="var(--card-color)" fillOpacity="0.2" />
                <path d="M 66 85 L 67.5 86.5 L 70 83.5" stroke="var(--card-color)" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="76" y="83" width="54" height="4" rx="2" fill="#94a3b8" />
                <circle cx="68" cy="98" r="4" fill="var(--card-color)" fillOpacity="0.2" />
                <path d="M 66 98 L 67.5 99.5 L 70 96.5" stroke="var(--card-color)" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="76" y="96" width="46" height="4" rx="2" fill="#cbd5e1" />
                <circle cx="124" cy="118" r="10" fill="var(--card-color)" fillOpacity="0.12" stroke="var(--card-color)" strokeWidth="1" strokeDasharray="2 2" />
            </g>
            <g transform="rotate(24 150 75)">
                <rect x="145" y="20" width="8" height="85" rx="4" fill="var(--card-color)" />
                <polygon points="145,105 153,105 149,118" fill="#475569" />
                <polygon points="147.5,114 150.5,114 149,118" fill="#0f172a" />
                <rect x="146" y="32" width="2" height="24" rx="1" fill="#ffffff" fillOpacity="0.8" />
            </g>
        </svg>
    </div>
);

// 3. 3D Examination System Graphic with Result Badge (EMS - 03: MEDIUM)
export const EMSExam3DIllustration = ({ className = '', size = 'medium' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.medium} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="90" cy="120" rx="55" ry="12" fill="var(--card-color)" fillOpacity="0.1" />
            <rect x="40" y="20" width="80" height="100" rx="10" fill="#ffffff" stroke="var(--card-color)" strokeWidth="1.5" strokeOpacity="0.3" />
            <rect x="52" y="14" width="56" height="12" rx="4" fill="var(--card-color)" fillOpacity="0.85" />
            <circle cx="80" cy="20" r="3" fill="#ffffff" />
            <rect x="50" y="38" width="50" height="4" rx="2" fill="#cbd5e1" />
            <rect x="50" y="48" width="60" height="3" rx="1.5" fill="#e2e8f0" />
            <rect x="50" y="56" width="54" height="3" rx="1.5" fill="#e2e8f0" />
            <rect x="50" y="64" width="58" height="3" rx="1.5" fill="#e2e8f0" />
            <circle cx="108" cy="95" r="18" fill="var(--card-color)" />
            <circle cx="108" cy="95" r="15" fill="#ffffff" />
            <text x="101" y="100" fill="var(--card-color)" fontSize="12" fontWeight="900" fontFamily="sans-serif">A+</text>
        </svg>
    </div>
);

// 4. 3D Indian Rupee Coin Stack (Fee Management - 04: SMALL)
export const FeeCoins3DIllustration = ({ className = '', size = 'small' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.small} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="80" cy="110" rx="45" ry="10" fill="var(--card-color)" fillOpacity="0.12" />
            <g transform="translate(0, 30)">
                <ellipse cx="80" cy="65" rx="36" ry="14" fill="var(--card-color)" fillOpacity="0.9" />
                <rect x="44" y="65" width="72" height="12" fill="var(--card-color)" fillOpacity="0.8" />
                <ellipse cx="80" cy="77" rx="36" ry="14" fill="var(--card-color)" />
            </g>
            <g transform="translate(0, 15)">
                <ellipse cx="80" cy="55" rx="36" ry="14" fill="#ffffff" />
                <rect x="44" y="55" width="72" height="10" fill="var(--card-color)" fillOpacity="0.7" />
                <ellipse cx="80" cy="65" rx="36" ry="14" fill="var(--card-color)" fillOpacity="0.85" />
            </g>
            <g transform="translate(0, 0)">
                <ellipse cx="80" cy="45" rx="36" ry="14" fill="var(--card-color)" fillOpacity="0.7" />
                <rect x="44" y="45" width="72" height="8" fill="var(--card-color)" fillOpacity="0.9" />
                <ellipse cx="80" cy="53" rx="36" ry="14" fill="#ffffff" stroke="var(--card-color)" strokeWidth="2" />
                <ellipse cx="80" cy="53" rx="31" ry="11" fill="var(--card-color)" fillOpacity="0.15" />
                <text x="73" y="58" fill="var(--card-color)" fontSize="17" fontWeight="900" fontFamily="sans-serif">₹</text>
            </g>
        </svg>
    </div>
);

// 5. 3D Hostel Modern Dormitory Bed (Hostel Automation - 05: SMALL)
export const HostelBed3DIllustration = ({ className = '', size = 'small' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.small} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 170 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="85" cy="110" rx="50" ry="11" fill="var(--card-color)" fillOpacity="0.12" />
            <rect x="30" y="35" width="12" height="65" rx="3" fill="#64748b" />
            <rect x="135" y="60" width="10" height="40" rx="3" fill="#94a3b8" />
            <polygon points="40,65 140,75 125,95 25,85" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <polygon points="70,72 140,75 125,95 55,92" fill="var(--card-color)" fillOpacity="0.85" />
            <polygon points="55,92 125,95 125,102 55,99" fill="var(--card-color)" />
            <polygon points="42,60 68,62 62,72 36,70" fill="#ffffff" stroke="var(--card-color)" strokeWidth="1" strokeOpacity="0.4" />
        </svg>
    </div>
);

// 6. 3D Biometric ID Card & Staff Badge (HRMS & Payroll - 06: SMALL)
export const HRMSBadge3DIllustration = ({ className = '', size = 'small' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.small} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="80" cy="115" rx="45" ry="9" fill="var(--card-color)" fillOpacity="0.1" />
            <path d="M 65 10 Q 80 30 75 45" stroke="var(--card-color)" strokeWidth="3" fill="none" strokeOpacity="0.8" />
            <path d="M 95 10 Q 80 30 85 45" stroke="var(--card-color)" strokeWidth="3" fill="none" strokeOpacity="0.8" />
            <rect x="73" y="42" width="14" height="8" rx="2" fill="#475569" />
            <g transform="rotate(-5 80 75)">
                <rect x="45" y="48" width="70" height="58" rx="8" fill="#ffffff" stroke="var(--card-color)" strokeWidth="1.5" strokeOpacity="0.3" />
                <rect x="45" y="48" width="70" height="12" rx="8" fill="var(--card-color)" fillOpacity="0.2" />
                <rect x="52" y="66" width="18" height="20" rx="3" fill="var(--card-color)" fillOpacity="0.25" />
                <circle cx="61" cy="73" r="4" fill="var(--card-color)" />
                <rect x="75" y="68" width="32" height="4" rx="2" fill="#0f172a" fillOpacity="0.7" />
                <rect x="75" y="76" width="24" height="3" rx="1.5" fill="#94a3b8" />
                <rect x="54" y="88" width="12" height="8" rx="1.5" fill="#fbbf24" />
            </g>
        </svg>
    </div>
);

// 7. 3D Graduation Diploma Certificate & Cap (Student Portal - 07: SMALL)
export const StudentDiploma3DIllustration = ({ className = '', size = 'small' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.small} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 170 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="85" cy="115" rx="45" ry="9" fill="var(--card-color)" fillOpacity="0.1" />
            <polygon points="85,25 130,42 85,58 40,42" fill="var(--card-color)" />
            <polygon points="55,47 55,62 85,74 115,62 115,47 85,58" fill="var(--card-color)" fillOpacity="0.85" />
            <line x1="85" y1="42" x2="120" y2="60" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="120" cy="62" r="3" fill="#f59e0b" />
            <g transform="translate(45, 75) rotate(-10)">
                <rect x="0" y="0" width="75" height="22" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="28" y="0" width="12" height="22" fill="var(--card-color)" />
                <polygon points="32,22 36,32 40,22" fill="var(--card-color)" />
            </g>
        </svg>
    </div>
);

// 8. 3D Isometric Shipping Parcels & Storage Crates (Stationary Management - 08: LARGE)
export const Boxes3DIllustration = ({ className = '', size = 'large' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.large} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <defs>
                <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--card-color)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--card-color)" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--card-color)" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="var(--card-color)" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--card-color)" stopOpacity="0.98" />
                    <stop offset="100%" stopColor="var(--card-color)" stopOpacity="0.75" />
                </linearGradient>
            </defs>
            <ellipse cx="105" cy="138" rx="65" ry="12" fill="var(--card-color)" fillOpacity="0.1" />
            <g transform="translate(20, 38) scale(0.65)">
                <polygon points="50,20 85,38 50,56 15,38" fill="url(#boxTop)" />
                <polygon points="15,38 50,56 50,100 15,82" fill="url(#boxLeft)" />
                <polygon points="50,56 85,38 85,82 50,100" fill="url(#boxRight)" />
                <polygon points="32,29 67,47 67,52 32,34" fill="#ffffff" fillOpacity="0.4" />
            </g>
            <g transform="translate(68, 48)">
                <polygon points="50,15 90,36 50,57 10,36" fill="url(#boxTop)" />
                <polygon points="10,36 50,57 50,102 10,81" fill="url(#boxLeft)" />
                <polygon points="50,57 90,36 90,81 50,102" fill="url(#boxRight)" />
                <polygon points="30,25 70,46 70,51 30,30" fill="#ffffff" fillOpacity="0.45" />
                <rect x="58" y="55" width="16" height="10" rx="1" fill="#ffffff" fillOpacity="0.85" />
                <line x1="61" y1="57" x2="61" y2="63" stroke="#0f172a" strokeWidth="1" />
                <line x1="65" y1="57" x2="65" y2="63" stroke="#0f172a" strokeWidth="1.5" />
            </g>
            <g transform="translate(65, 0) scale(0.85)">
                <polygon points="50,15 90,36 50,57 10,36" fill="url(#boxTop)" />
                <polygon points="10,36 50,57 50,96 10,75" fill="url(#boxLeft)" />
                <polygon points="50,57 90,36 90,75 50,96" fill="url(#boxRight)" />
            </g>
        </svg>
    </div>
);

// 9. 3D Modern Transit Bus (Transport Management - 09: MEDIUM/LARGE)
export const Bus3DIllustration = ({ className = '', size = 'large' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.large} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <path d="M 40 140 C 90 70 140 100 200 80 L 200 160 L 40 160 Z" fill="var(--card-color)" fillOpacity="0.12" />
            <line x1="20" y1="135" x2="195" y2="135" stroke="var(--card-color)" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="8 6" />
            <g transform="translate(15, 45)">
                <circle cx="55" cy="85" r="13" fill="#1e293b" />
                <circle cx="55" cy="85" r="6" fill="#94a3b8" />
                <circle cx="135" cy="85" r="13" fill="#1e293b" />
                <circle cx="135" cy="85" r="6" fill="#94a3b8" />
                <rect x="25" y="20" width="140" height="64" rx="14" fill="var(--card-color)" />
                <path d="M 27 30 Q 30 22 40 22 L 150 22 Q 163 22 165 30 Z" fill="#ffffff" fillOpacity="0.9" />
                <rect x="32" y="28" width="28" height="24" rx="5" fill="#38bdf8" fillOpacity="0.85" />
                <rect x="65" y="28" width="22" height="22" rx="4" fill="#38bdf8" fillOpacity="0.85" />
                <rect x="92" y="28" width="22" height="22" rx="4" fill="#38bdf8" fillOpacity="0.85" />
                <rect x="119" y="28" width="22" height="22" rx="4" fill="#38bdf8" fillOpacity="0.85" />
                <rect x="23" y="62" width="6" height="8" rx="3" fill="#fef08a" />
                <line x1="30" y1="58" x2="162" y2="58" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.9" />
            </g>
        </svg>
    </div>
);

// 10. 3D Talent Briefcase & Search Badge (Staff Recruitment System - 10: MEDIUM)
export const Recruitment3DIllustration = ({ className = '', size = 'medium' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.medium} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="90" cy="120" rx="55" ry="11" fill="var(--card-color)" fillOpacity="0.12" />
            <path d="M 70 45 C 70 30 110 30 110 45" stroke="#475569" strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="42" y="45" width="96" height="65" rx="10" fill="var(--card-color)" />
            <polygon points="42,45 138,45 125,75 55,75" fill="var(--card-color)" fillOpacity="0.85" />
            <rect x="84" y="70" width="12" height="10" rx="2" fill="#fbbf24" />
            <line x1="42" y1="75" x2="138" y2="75" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
            <g transform="translate(100, 20) rotate(15)">
                <rect x="0" y="0" width="40" height="48" rx="5" fill="#ffffff" stroke="var(--card-color)" strokeWidth="1.2" />
                <circle cx="20" cy="16" r="6" fill="var(--card-color)" fillOpacity="0.3" />
                <circle cx="20" cy="14" r="3" fill="var(--card-color)" />
                <rect x="8" y="27" width="24" height="3" rx="1.5" fill="#cbd5e1" />
            </g>
        </svg>
    </div>
);

// 11. 3D Safety Helmet & Biometric Gate RFID Scanner (Labour Management SAMS - 11: MEDIUM)
export const LabourScanner3DIllustration = ({ className = '', size = 'medium' }) => (
    <div className={`relative ${sizeClasses[size] || sizeClasses.medium} pointer-events-none select-none ${className}`}>
        <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <ellipse cx="90" cy="122" rx="55" ry="11" fill="var(--card-color)" fillOpacity="0.12" />
            <rect x="45" y="85" width="90" height="26" rx="6" fill="#1e293b" />
            <rect x="52" y="89" width="76" height="18" rx="4" fill="#0f172a" />
            <line x1="58" y1="98" x2="122" y2="98" stroke="var(--card-color)" strokeWidth="2.5" strokeLinecap="round" />
            <g transform="translate(0, -5)">
                <path d="M 50 78 C 50 35 130 35 130 78 Z" fill="var(--card-color)" />
                <path d="M 82 42 C 82 35 98 35 98 42 L 98 78 L 82 78 Z" fill="#ffffff" fillOpacity="0.25" />
                <path d="M 40 76 Q 90 70 140 76 L 138 84 Q 90 78 42 84 Z" fill="var(--card-color)" fillOpacity="0.9" />
                <path d="M 50 68 Q 90 62 130 68" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.8" fill="none" />
            </g>
        </svg>
    </div>
);

// Fluid Corner Waves (Reusable ambient accent)
export const FluidWaveGraphic = ({ className = '', position = 'bottom-right' }) => {
    const isLeft = position === 'bottom-left';
    return (
        <div className={`absolute pointer-events-none select-none overflow-hidden ${isLeft ? 'bottom-0 left-0 w-32 h-24' : 'bottom-0 right-0 w-32 h-24'} ${className}`}>
            <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {isLeft ? (
                    <path d="M -20 180 Q 20 90 90 110 Q 150 130 180 180 Z" fill="var(--card-color)" fillOpacity="0.08" />
                ) : (
                    <path d="M 50 180 Q 90 100 160 110 Q 200 115 220 180 Z" fill="var(--card-color)" fillOpacity="0.08" />
                )}
            </svg>
        </div>
    );
};

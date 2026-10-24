import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, LogOut, Loader2,
    AlertCircle, Search, ShieldCheck, X, Palette
} from 'lucide-react';
import PortalBentoCard from './PortalBentoCard';

/**
 * Single-color configurable portals catalog.
 * CHANGING THE COLOR OF ANY ITEM HERE AUTOMATICALLY UPDATES THE ENTIRE CARD:
 * (category badge, icon squircle, icon SVG, borders, radial gradient aura,
 * circular action button, hover glow, and 3D illustrations!)
 */
export const initialPortalDetails = [
    {
        portalId: 'academic-portal',
        number: '01',
        title: 'Academic Portal',
        category: 'ACADEMICS & FACULTY',
        description: 'Course curriculum delivery, syllabus schedules, faculty workloads, and timetable.',
        color: '#0d9488', // <-- Teal Green: change this one color to change the entire card!
        image: '/academic-card.jpg',
        url: 'https://acad.pydah.edu.in/login',
        layout: 'tall'
    },
    {
        portalId: 'admissions-crm',
        number: '02',
        title: 'Admission Portal',
        category: 'ENROLLMENT MANAGEMENT',
        description: 'Student inquiry pipeline, counselor workflows, and institutional admissions.',
        color: '#0284c7', // <-- Sky Blue
        image: '/4e04c9e0dd9b0a5360fe5c9a5784b862.jpg',
        url: 'https://admissions.pydah.edu.in/auth/login',
        layout: 'wide'
    },
    {
        portalId: 'examination-portal',
        number: '03',
        title: 'Examination Management System',
        category: 'EXAMS & ASSESSMENT',
        description: 'Examination scheduling, hall tickets, marks evaluation, and result processing.',
        color: '#ea580c', // <-- Orange
        image: '/ems-card.jpg',
        url: 'https://ems.pydah.edu.in/login',
        layout: 'standard'
    },
    {
        portalId: 'fee-management',
        number: '04',
        title: 'Fee Management',
        category: 'FINANCIAL OPERATIONS',
        description: 'Tuition collection, pending balances, invoice records, and reconciliation.',
        color: '#059669', // <-- Emerald Green
        image: '/931962fb2d5f2bf75f94b526891c3f43.jpg',
        url: 'https://fees.pydah.edu.in/login',
        layout: 'compact'
    },
    {
        portalId: 'hostel-automation',
        number: '05',
        title: 'Hostel Automation',
        category: 'FACILITY MANAGEMENT',
        description: 'Campus room allotments, warden logs, hostel passes, and mess management.',
        color: '#db2777', // <-- Pink
        image: '/be5b597fc3fce8fb5502c228cafa87f1.jpg',
        url: 'https://hostel.pydah.edu.in/login',
        layout: 'compact'
    },
    {
        portalId: 'hrms',
        number: '06',
        title: 'HRMS & Payroll',
        category: 'STAFF OPERATIONS',
        description: 'Staff directory, biometric attendance, salary payroll, and leave management.',
        color: '#7c3aed', // <-- Purple
        image: '/7a41f43d70ae2960e8bead5fa240591f.jpg',
        url: 'https://hrms.pydah.edu.in/login',
        layout: 'compact'
    },
    {
        portalId: 'student-portal',
        number: '07',
        title: 'Student Portal',
        category: 'LEARNING & ACADEMICS',
        description: 'Central student profile, academic records, digital schedules, and updates.',
        color: '#2563eb', // <-- Royal Blue
        image: '/5a2e2b1a96243304c98937fb2b0444d5.jpg',
        url: 'https://sdms.pydah.edu.in/student/login',
        layout: 'standard'
    },
    {
        portalId: 'stationary-management',
        number: '08',
        title: 'Stationary Management',
        category: 'INVENTORY & OPERATIONS',
        description: 'Stationary stock distribution, inventory logs, sub-admin privileges, and campus allocations.',
        color: '#6366f1', // <-- Indigo / Violet
        image: '/stationary-card.jpg',
        url: 'https://stationary.pydah.edu.in/login',
        layout: 'wide'
    },
    {
        portalId: 'transport-management',
        number: '09',
        title: 'Transport Management',
        category: 'LOGISTICS HUB',
        description: 'Fleet vehicle tracking, bus transit routes, stops, and driver schedules.',
        color: '#d97706', // <-- Warm Amber
        image: '/Gemini_Generated_Image_xuaavlxuaavlxuaa.webp',
        url: 'https://transport.pydah.edu.in/login',
        layout: 'standard'
    },
    {
        portalId: 'staff-recruitment',
        number: '10',
        title: 'Staff Recruitment System',
        category: 'HIRING & TALENT ACQUISITION',
        description: 'Faculty and staff recruitment pipeline, panel interviews, candidate screening, and hiring approvals.',
        color: '#0891b2', // <-- Cyan
        image: '/Pastel Productivity Dashboard Hero Scene.webp',
        url: 'https://srs.pydah.edu.in/login',
        layout: 'standard'
    },
    {
        portalId: 'sams',
        number: '11',
        title: 'Labour Management (SAMS)',
        category: 'WORKFORCE & OPERATIONS',
        description: 'Labour attendance tracking, gate access control, shift scanning, and workforce management.',
        color: '#0f766e', // <-- Deep Teal
        image: '/Gemini_Generated_Image_87w73787w73787w7.webp',
        url: 'https://sams.pydah.edu.in/login',
        layout: 'standard'
    }
];

const PortalsPage = ({
    user,
    onBack,
    onPortalClick,
    onLoginClick,
    onLogout,
    launchingPortalId,
    launchError
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [portalsList, setPortalsList] = useState(initialPortalDetails);

    // Interactive color change handler for live testing / preview
    const handleColorChange = (portalId, newColor) => {
        setPortalsList((prev) =>
            prev.map((portal) =>
                portal.portalId === portalId ? { ...portal, color: newColor } : portal
            )
        );
    };

    // Check authorization for a portal - strictly driven by user.portals if logged in
    const isPortalAuthorized = (portalId) => {
        if (!user) return true; // public catalog preview when not logged in
        return Array.isArray(user.portals) && user.portals.includes(portalId);
    };

    // Strictly resolve portals accessible to this user
    const accessiblePortals = useMemo(() => {
        if (!user) return portalsList;
        return portalsList.filter((portal) => isPortalAuthorized(portal.portalId));
    }, [user, portalsList]);

    // Apply search filter if query is typed
    const filteredPortals = useMemo(() => {
        if (!searchQuery.trim()) return accessiblePortals;
        const q = searchQuery.toLowerCase();
        return accessiblePortals.filter(
            (portal) =>
                portal.title.toLowerCase().includes(q) ||
                portal.category.toLowerCase().includes(q) ||
                (portal.description && portal.description.toLowerCase().includes(q))
        );
    }, [accessiblePortals, searchQuery]);

    const isSearching = searchQuery.trim().length > 0;

    return (
        <div
            className="min-h-screen lg:h-screen lg:max-h-screen bg-[#F8FAFC] relative overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col justify-between"
            style={{
                paddingTop: 'clamp(82px, 8vw, 98px)',
                paddingBottom: 'clamp(0.5rem, 1.2vw, 0.85rem)'
            }}
        >
            {/* Background Atmosphere Grid & Ambiance */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.3) 1.2px, transparent 1.2px)',
                    backgroundSize: '24px 24px'
                }}
            />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-[15%] left-[10%] w-[550px] h-[450px] rounded-full blur-[140px] opacity-[0.07]"
                    style={{ backgroundColor: '#4f46e5' }}
                />
                <div
                    className="absolute top-[25%] -right-[5%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06]"
                    style={{ backgroundColor: '#0284c7' }}
                />
                <div
                    className="absolute bottom-[5%] left-[5%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-[0.05]"
                    style={{ backgroundColor: '#7c3aed' }}
                />
            </div>

            <div className="w-full px-3.5 sm:px-6 lg:px-8 xl:px-10 relative z-10 flex-1 flex flex-col min-h-0 justify-between">
                {/* Authenticated Dashboard Header */}
                {user ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-3.5 sm:mb-4.5"
                    >
                        {/* Profile Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-200/80">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className="hidden sm:block shrink-0">
                                    {user.profilePhoto ? (
                                        <img
                                            src={user.profilePhoto}
                                            alt={user.name || user.username || 'User'}
                                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-indigo-200/80 shadow-sm"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextSibling) {
                                                    e.currentTarget.nextSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-md ${
                                            user.profilePhoto ? 'hidden' : ''
                                        }`}
                                    >
                                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-lg sm:text-sm font-black text-indigo-600 tracking-tight leading-tight mb-0.5">
                                        Welcome,
                                    </p>
                                    <h1 className="text-[14px] sm:text-xl md:text-2xl font-bold sm:font-black text-slate-800 sm:text-slate-900 tracking-tight leading-tight truncate">
                                        {user.name || user.username || 'Pydah Member'}
                                    </h1>
                                    <p className="flex text-slate-500 text-[11px] sm:text-sm mt-0.5 font-medium items-center gap-1.5 truncate">
                                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <span className="truncate">
                                            <span className="hidden sm:inline">Authenticated Session · </span>
                                            {user.email || user.username}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Session stats & Search */}
                            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                                <div className="relative w-full sm:w-64">
                                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search portals..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/90 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-medium outline-none transition-all bg-white shadow-xs"
                                    />
                                </div>
                                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs shrink-0">
                                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                                    <span>{accessiblePortals.length} Authorized</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Logged-Out Header */
                    <div className="mb-3.5 sm:mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-3.5 border-b border-slate-200/80">
                        <div>
                            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                Campus Applications & Portals
                            </h1>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                Select any portal below to launch single sign-on or access institutional services.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search portals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200/90 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-medium outline-none transition-all bg-white shadow-xs"
                            />
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {launchError && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm text-xs sm:text-sm font-semibold"
                    >
                        <AlertCircle size={17} className="text-red-600 shrink-0" />
                        <span>{launchError}</span>
                    </motion.div>
                )}

                {/* Empty State */}
                {filteredPortals.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                        <Lock size={36} className="mx-auto text-slate-300 mb-2.5" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">No applications found</h3>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                            {user
                                ? 'No assigned portals matched your search query.'
                                : 'No portals available at this time.'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-2.5 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    /* The Bento Grid: Exact layout matching the specification */
                    <div
                        className={
                            isSearching
                                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5 flex-1 min-h-0 overflow-y-auto'
                                : 'grid grid-cols-12 lg:grid-rows-4 gap-2 sm:gap-2.5 xl:gap-3 items-stretch flex-1 min-h-0 w-full'
                        }
                    >
                        {filteredPortals.map((portal) => {
                            const isLaunching = launchingPortalId === portal.portalId;

                            return (
                                <PortalBentoCard
                                    key={portal.portalId}
                                    portal={portal}
                                    user={user}
                                    isLaunching={isLaunching}
                                    onPortalClick={onPortalClick}
                                    onLoginClick={onLoginClick}
                                    onColorChange={handleColorChange}
                                    isBentoLayout={!isSearching}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sign Out Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/90 z-10 overflow-hidden"
                        >
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
                                    <LogOut size={22} className="translate-x-0.5" />
                                </div>
                                <div className="pr-6">
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                        Sign Out Confirmation
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                                        Are you sure you want to sign out of your Pydah CRM session?
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutModal(false)}
                                    style={{ backgroundColor: '#f1f5f9', color: '#334155' }}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLogoutModal(false);
                                        if (onLogout) onLogout();
                                    }}
                                    style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-red-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} style={{ color: '#ffffff' }} />
                                    <span style={{ color: '#ffffff' }}>Yes, Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PortalsPage;

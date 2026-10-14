import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Lock, LogOut, Sparkles, Loader2,
    AlertCircle, ArrowUpRight, Search, ShieldCheck, X
} from 'lucide-react';

const portalDetails = [
    {
        title: 'Academic Portal',
        category: 'Academics & Faculty',
        description: 'Course curriculum delivery, syllabus schedules, faculty workloads, and timetable.',
        color: '#0d9488',
        image: '/academic-card.jpg',
        url: 'https://acad.pydah.edu.in/login',
        portalId: 'academic-portal'
    },
    {
        title: 'Admission Portal',
        category: 'Enrollment Management',
        description: 'Student inquiry pipeline, counselor workflows, and institutional admissions.',
        color: '#0284c7',
        image: '/4e04c9e0dd9b0a5360fe5c9a5784b862.jpg',
        url: 'https://admissions.pydah.edu.in/auth/login',
        portalId: 'admissions-crm'
    },
    {
        title: 'Examination Management System',
        category: 'Exams & Assessment',
        description: 'Examination scheduling, hall tickets, marks evaluation, and result processing.',
        color: '#ea580c',
        image: '/ems-card.jpg',
        url: 'https://ems.pydah.edu.in/login',
        portalId: 'examination-portal'
    },
    {
        title: 'Fee Management',
        category: 'Financial Operations',
        description: 'Tuition collection, pending balances, invoice records, and reconciliation.',
        color: '#059669',
        image: '/931962fb2d5f2bf75f94b526891c3f43.jpg',
        url: 'https://fees.pydah.edu.in/login',
        portalId: 'fee-management'
    },
    {
        title: 'Hostel Automation',
        category: 'Facility Management',
        description: 'Campus room allotments, warden logs, hostel passes, and mess management.',
        color: '#db2777',
        image: '/be5b597fc3fce8fb5502c228cafa87f1.jpg',
        url: 'https://hms.pydahsoft.in/login',
        portalId: 'hostel-automation'
    },
    {
        title: 'HRMS & Payroll',
        category: 'Staff Operations',
        description: 'Staff directory, biometric attendance, salary payroll, and leave management.',
        color: '#7c3aed',
        image: '/7a41f43d70ae2960e8bead5fa240591f.jpg',
        url: 'https://hrms.pydah.edu.in/login',
        portalId: 'hrms'
    },
    {
        title: 'Student Portal',
        category: 'Learning & Academics',
        description: 'Central student profile, academic records, digital schedules, and updates.',
        color: '#2563eb',
        image: '/5a2e2b1a96243304c98937fb2b0444d5.jpg',
        url: 'https://sdms.pydah.edu.in/student/login',
        portalId: 'student-portal'
    },
    {
        title: 'Transport Management',
        category: 'Logistics Hub',
        description: 'Fleet vehicle tracking, bus transit routes, stops, and driver schedules.',
        color: '#d97706',
        image: '/Gemini_Generated_Image_xuaavlxuaavlxuaa.webp',
        url: 'https://transport.pydah.edu.in/login',
        portalId: 'transport-management'
    }
];

const PortalsPage = ({ user, onBack, onPortalClick, onLoginClick, onLogout, launchingPortalId, launchError }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Check authorization for a portal - strictly driven by discovered user.portals
    const isPortalAuthorized = (portalId) => {
        if (!user) return true; // when viewing public catalog without logging in
        return Array.isArray(user.portals) && user.portals.includes(portalId);
    };

    // Strictly resolve portals accessible to this user
    const accessiblePortals = useMemo(() => {
        if (!user) return portalDetails;
        return portalDetails.filter((portal) => isPortalAuthorized(portal.portalId));
    }, [user]);

    // Apply search filter if query is typed
    const filteredPortals = useMemo(() => {
        if (!searchQuery.trim()) return accessiblePortals;
        return accessiblePortals.filter((portal) =>
            portal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            portal.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [accessiblePortals, searchQuery]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden" style={{
            paddingTop: 'clamp(75px, 10vw, 95px)',
            paddingBottom: 'clamp(3rem, 6vw, 5rem)'
        }}>
            {/* Professional Corporate Background Grid & Ambiance */}
            <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                    backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.3) 1.2px, transparent 1.2px)',
                    backgroundSize: '24px 24px'
                }}
            />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-[15%] left-[10%] w-[550px] h-[450px] rounded-full blur-[140px] opacity-[0.08]"
                    style={{ backgroundColor: '#4f46e5' }}
                />
                <div
                    className="absolute top-[25%] -right-[5%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.07]"
                    style={{ backgroundColor: '#0284c7' }}
                />
                <div
                    className="absolute bottom-[5%] left-[5%] w-[450px] h-[450px] rounded-full blur-[130px] opacity-[0.06]"
                    style={{ backgroundColor: '#7c3aed' }}
                />
            </div>

            <div className="section-container px-4 sm:px-8 lg:px-12 relative z-10 max-w-7xl mx-auto">
                {/* Authenticated Dashboard Header - Neatly aligned, non-card layout */}
                {user ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8 sm:mb-10"
                    >
                        {/* Profile Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-200/80">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                {/* Profile Photo: replaced to navbar menu button on mobile, shown on sm: and up */}
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
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-md ${user.profilePhoto ? 'hidden' : ''}`}>
                                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-lg sm:text-sm font-black text-indigo-600 tracking-tight leading-tight mb-0.5">
                                        Welcome,
                                    </p>
                                    <h1 className="text-[13px] sm:text-xl md:text-2xl font-bold sm:font-black text-slate-800 sm:text-slate-900 tracking-tight leading-tight truncate">
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

                            {/* Session stats */}
                            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-start sm:justify-end flex-wrap">
                                <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs">
                                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                                    <span>{accessiblePortals.length} Your Authorized Applications</span>
                                </div>
                            </div>
                        </div>

                        {/* Category Subtitle */}
                        <div className="pt-4 sm:pt-5 flex items-center justify-between">
                            <div className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                               
                           
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Logged-Out Header - Clean heading and search */
                    <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center sm:text-left">
                            Campus Applications & Portals
                        </h1>

                        {/* Search Bar - Full width on mobile */}
                        <div className="relative w-full sm:w-72">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search portals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/90 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium outline-none transition-all bg-white shadow-xs"
                            />
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {launchError && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm text-sm font-semibold"
                    >
                        <AlertCircle size={18} className="text-red-600 shrink-0" />
                        <span>{launchError}</span>
                    </motion.div>
                )}

                {/* Applications Grid: Strictly the user's accessible portals */}
                {filteredPortals.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                        <Lock size={40} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No applications found</h3>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                            {user
                                ? 'No assigned portals matched your search query.'
                                : 'No portals available at this time.'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-3 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4.5 items-stretch">
                        {filteredPortals.map((portal, index) => {
                            const isLaunching = launchingPortalId === portal.portalId;

                            return (
                                <PortalAppCard
                                    key={portal.portalId}
                                    portal={portal}
                                    index={index}
                                    totalCount={filteredPortals.length}
                                    user={user}
                                    isLaunching={isLaunching}
                                    onPortalClick={onPortalClick}
                                    onLoginClick={onLoginClick}
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
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Modal Dialog */}
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

const PortalAppCard = ({
    portal,
    index = 0,
    totalCount = 6,
    user,
    isLaunching,
    onPortalClick,
    onLoginClick
}) => {
    const handleCardClick = (e) => {
        e.preventDefault();
        if (!user) {
            if (onLoginClick) onLoginClick();
            return;
        }
        if (onPortalClick) {
            onPortalClick(portal);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            onClick={handleCardClick}
            style={{
                borderColor: `${portal.color}55`,
                boxShadow: `0 4px 16px -4px ${portal.color}18, 0 2px 4px -1px rgba(0,0,0,0.03)`
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = portal.color;
                e.currentTarget.style.boxShadow = `0 12px 26px -6px ${portal.color}30, 0 3px 8px -2px rgba(0,0,0,0.05)`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${portal.color}55`;
                e.currentTarget.style.boxShadow = `0 4px 16px -4px ${portal.color}18, 0 2px 4px -1px rgba(0,0,0,0.03)`;
            }}
            className="group bg-white rounded-xl sm:rounded-2xl border-2 cursor-pointer flex flex-col h-full w-full overflow-hidden transition-all duration-300"
        >
            {/* Optimized Compact Thumbnail */}
            <div className="relative h-24 sm:h-32 md:h-36 w-full overflow-hidden bg-slate-100 shrink-0">
                <img
                    src={portal.image}
                    alt={portal.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            </div>

            {/* Structured Content & Launch Button */}
            <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
                <div>
                    {/* Desktop Category: Hidden on mobile */}
                    <span
                        style={{ color: portal.color }}
                        className="hidden sm:block text-[10px] font-extrabold uppercase tracking-wider mb-1"
                    >
                        {portal.category}
                    </span>

                    {/* Mobile-Only Row: Colored Portal Name & Launch button stacked cleanly for 2-column grid */}
                    <div className="flex sm:hidden flex-col gap-2">
                        <span
                            style={{ color: portal.color }}
                            className="font-bold text-xs sm:text-sm tracking-tight line-clamp-1"
                        >
                            {portal.title}
                        </span>

                        <div className="w-full">
                            {isLaunching ? (
                                <div
                                    style={{
                                        backgroundColor: `${portal.color}15`,
                                        borderColor: `${portal.color}40`,
                                        color: portal.color
                                    }}
                                    className="w-full py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 border shadow-inner"
                                >
                                    <Loader2 size={11} className="animate-spin" />
                                    <span>Launching...</span>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        backgroundColor: portal.color,
                                        borderColor: portal.color,
                                        boxShadow: `0 2px 10px -1px ${portal.color}50`,
                                        color: '#ffffff'
                                    }}
                                    className="relative overflow-hidden w-full py-1.5 px-2 rounded-lg font-extrabold text-[11px] flex items-center justify-center border shadow-xs transition-all active:scale-95"
                                >
                                    {/* Strictly one-after-one sequential shine sweep */}
                                    <motion.span
                                        initial={{ x: '-150%' }}
                                        animate={{ x: '250%' }}
                                        transition={{
                                            duration: 2.2,
                                            repeat: Infinity,
                                            repeatDelay: Math.max(0, (totalCount - 1) * 2.2),
                                            delay: index * 2.2,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute inset-0 w-3/4 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-25deg] pointer-events-none"
                                    />

                                    <span style={{ color: '#ffffff' }} className="tracking-wide relative z-10 whitespace-nowrap">
                                        {user ? 'Launch' : 'Sign In'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop-Only Title: Hidden on mobile */}
                    <h3 className="hidden sm:flex text-[15px] font-bold text-slate-900 tracking-tight group-hover:text-slate-950 transition-colors leading-snug min-h-[2.2rem] items-start">
                        {portal.title}
                    </h3>

                    {/* Desktop-Only Description: Hidden on mobile */}
                    <p className="hidden sm:block text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed mt-0.5 line-clamp-2 min-h-0 sm:min-h-[1.75rem]">
                        {portal.description}
                    </p>
                </div>

                {/* Desktop 1-Click Launch Button - filled with distinct portal color by default */}
                <div className="hidden sm:block mt-auto pt-2 border-t border-slate-100">
                    {isLaunching ? (
                        <div
                            style={{
                                backgroundColor: `${portal.color}15`,
                                borderColor: `${portal.color}40`,
                                color: portal.color
                            }}
                            className="w-full py-1.5 sm:py-2 px-3 rounded-lg sm:rounded-xl font-bold text-xs flex items-center justify-center gap-2 border shadow-inner"
                        >
                            <Loader2 size={13} className="animate-spin" />
                            <span>Launching SSO...</span>
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: portal.color,
                                borderColor: portal.color,
                                boxShadow: `0 3px 10px -2px ${portal.color}40`,
                                color: '#ffffff'
                            }}
                            className="w-full py-1.5 sm:py-2 px-3 rounded-lg sm:rounded-xl font-bold text-xs flex items-center justify-between border shadow-xs transition-all duration-200 group-hover:brightness-110 group-hover:shadow-md cursor-pointer"
                        >
                            <span style={{ color: '#ffffff' }} className="tracking-wide">
                                {user ? 'Launch Application' : 'Sign In to Launch'}
                            </span>
                            {user ? (
                                <ArrowUpRight
                                    size={14}
                                    style={{ color: '#ffffff' }}
                                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0"
                                />
                            ) : (
                                <ArrowRight
                                    size={14}
                                    style={{ color: '#ffffff' }}
                                    className="group-hover:translate-x-0.5 transition-transform shrink-0"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PortalsPage;

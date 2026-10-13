import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, Lock, LogOut, Sparkles, Loader2,
    AlertCircle, ArrowUpRight, Search, ShieldCheck
} from 'lucide-react';

const portalDetails = [
    {
        title: 'Admission Portal',
        category: 'Enrollment Management',
        color: '#0ea5e9',
        image: '/4e04c9e0dd9b0a5360fe5c9a5784b862.jpg',
        url: 'https://admissions.pydah.edu.in/auth/login',
        portalId: 'admissions-crm'
    },
    {
        title: 'Student Portal',
        category: 'Learning & Academics',
        color: '#f59e0b',
        image: '/5a2e2b1a96243304c98937fb2b0444d5.jpg',
        url: 'https://sdms.pydah.edu.in/student/login',
        portalId: 'student-portal'
    },
    {
        title: 'Fee Management',
        category: 'Financial Operations',
        color: '#00a6ffff',
        image: '/931962fb2d5f2bf75f94b526891c3f43.jpg',
        url: 'https://fees.pydah.edu.in/login',
        portalId: 'fee-management'
    },
    {
        title: 'Transport Management',
        category: 'Logistics Hub',
        color: '#0f73ffff',
        image: '/Gemini_Generated_Image_xuaavlxuaavlxuaa.png',
        url: 'https://transport.pydah.edu.in/login',
        portalId: 'transport-management'
    },
    {
        title: 'Hostel Automation',
        category: 'Facility Management',
        color: '#f59e0b',
        image: '/be5b597fc3fce8fb5502c228cafa87f1.jpg',
        url: 'https://hms.pydahsoft.in/login',
        portalId: 'hostel-automation'
    },
    {
        title: 'HRMS & Payroll',
        category: 'Staff Operations',
        color: '#6366f1',
        image: '/7a41f43d70ae2960e8bead5fa240591f.jpg',
        url: 'https://hrms.pydah.edu.in/login',
        portalId: 'hrms'
    },
    {
        title: 'Pharmacy Inventory',
        category: 'Lab & Stock Management',
        color: '#10b981',
        image: '/30e0526855959f629396058ac463bc26.jpg',
        url: 'https://pydah-pharmacy-labs.vercel.app',
        portalId: 'pharmacy'
    }
];

const PortalsPage = ({ user, onBack, onPortalClick, onLoginClick, onLogout, launchingPortalId, launchError }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Check authorization for a portal
    const isPortalAuthorized = (portalId) => {
        if (!user) return true; // when viewing public catalog without logging in
        if (user.role === 'super_admin' || user.role === 'superadmin') return true;
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
        <div className="min-h-screen bg-slate-50 relative overflow-hidden" style={{
            paddingTop: 'clamp(75px, 10vw, 95px)',
            paddingBottom: 'clamp(3rem, 6vw, 5rem)'
        }}>
            {/* Background subtle ambiance */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-[0.05]"
                    style={{ backgroundColor: '#4f46e5' }}
                />
                <div
                    className="absolute top-[30%] -right-[5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-[0.04]"
                    style={{ backgroundColor: '#0ea5e9' }}
                />
            </div>

            <div className="section-container px-4 sm:px-8 lg:px-12 relative z-10 max-w-7xl mx-auto">
                {/* Authenticated Dashboard Header */}
                {user ? (
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_15px_35px_rgba(0,0,0,0.03)] mb-8 sm:mb-10"
                    >
                        {/* Profile Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20 shrink-0">
                                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                        {user.name || user.username || 'Pydah Member'}
                                    </h1>
                                    <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Authenticated Session · {user.email || user.username}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Session stats & Sign out */}
                            <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
                                <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                    <span>{accessiblePortals.length} Authorized Applications</span>
                                </div>
                                {onLogout && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onLogout}
                                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <LogOut size={15} />
                                        <span>Sign Out</span>
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Search and Header Subtitle */}
                        <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                <span>Your Portals ({filteredPortals.length})</span>
                            </div>

                            {/* Search Bar */}
                            <div className="relative min-w-[240px] sm:w-72">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search your portals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium outline-none transition-all bg-white"
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Logged-Out Header */
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-8 sm:mb-10 text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-3">
                            <Sparkles size={14} className="text-amber-500" />
                            Pydah Single Sign-On Gateway
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            Campus Applications & Portals
                        </h1>
                        <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-lg mx-auto font-medium">
                            Sign in once with your central credentials to launch your assigned applications.
                        </p>
                        <div className="mt-5">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onLoginClick}
                                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md inline-flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <span>Sign In to Access Portals</span>
                                <ArrowRight size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {filteredPortals.map((portal) => {
                            const isLaunching = launchingPortalId === portal.portalId;

                            return (
                                <PortalAppCard
                                    key={portal.portalId}
                                    portal={portal}
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
        </div>
    );
};

const PortalAppCard = ({
    portal,
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
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={handleCardClick}
            className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.12)] cursor-pointer flex flex-col overflow-hidden transition-all duration-300"
        >
            {/* Optimized Compact Thumbnail */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <img
                    src={portal.image}
                    alt={portal.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                    {user ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-emerald-700 backdrop-blur-sm shadow-sm border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-700 backdrop-blur-sm shadow-sm">
                            SSO
                        </span>
                    )}
                </div>

                {/* Accent color dot */}
                <div
                    className="absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: portal.color }}
                />
            </div>

            {/* Compact Details & Launch Button */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        {portal.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">
                        {portal.title}
                    </h3>
                </div>

                {/* 1-Click Launch Button */}
                <div className="pt-2 border-t border-slate-100">
                    {isLaunching ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span>Launching SSO...</span>
                        </div>
                    ) : user ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors">
                            <span>Launch Application</span>
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-slate-900 text-slate-700 group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors">
                            <span>Sign In to Launch</span>
                            <ArrowRight size={14} />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PortalsPage;

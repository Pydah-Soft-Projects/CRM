import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Lock, LogOut, Sparkles, Loader2,
    AlertCircle, ArrowUpRight, ShieldCheck, X
} from 'lucide-react';

import { PORTALS_DATA as portalDetails } from '../data/portalsData';

const PortalsPage = ({
    user,
    _onBack,
    onPortalClick,
    onLoginClick,
    onLogout,
    launchingPortalId,
    launchError
}) => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Resolve accessible portals based on authentication
    const accessiblePortals = useMemo(() => {
        if (!user) return portalDetails;
        if (user.role === 'super_admin' || user.role === 'admin') return portalDetails;
        if (Array.isArray(user.portals)) {
            return portalDetails.filter((p) => user.portals.includes(p.portalId));
        }
        return portalDetails;
    }, [user]);

    const handleSignOutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmSignOut = () => {
        setShowLogoutModal(false);
        if (onLogout) onLogout();
    };

    return (
        <div
            className="w-full min-h-screen bg-slate-50/70 flex flex-col justify-start relative"
            style={{
                paddingTop: '98px', // Clear fixed navbar completely with comfortable breathing room
                paddingBottom: '3rem',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            {/* 1. SEAMLESS CLEAN CENTERED HEADER */}
            <header
                className="w-full bg-white border-b border-slate-200/80 shadow-2xs relative z-10"
                style={{ width: '100%' }}
            >
                <div
                    className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6"
                    style={{
                        maxWidth: '1360px',
                        margin: '0 auto',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {user ? (
                        /* Authenticated Profile Header */
                        <div
                            className="w-full flex flex-col sm:flex-row items-center justify-between gap-4"
                            style={{ width: '100%', maxWidth: '1240px', margin: '0 auto' }}
                        >
                            <div className="flex items-center gap-3.5">
                                {user.profilePhoto ? (
                                    <img
                                        src={user.profilePhoto}
                                        alt={user.name || user.username || 'User'}
                                        className="w-12 h-12 rounded-2xl object-cover shrink-0 border-2 border-indigo-200/80 shadow-xs"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.nextSibling) {
                                                e.currentTarget.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0 ${
                                        user.profilePhoto ? 'hidden' : ''
                                    }`}
                                >
                                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                                            {user.name || user.username || 'Pydah Member'}
                                        </h1>
                                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 uppercase">
                                            {user.role || 'Member'}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Authenticated SSO · {user.email || user.username}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                                    <ShieldCheck size={15} className="text-emerald-600" />
                                    <span>{accessiblePortals.length} Authorized Applications</span>
                                </span>
                                {onLogout && (
                                    <button
                                        onClick={handleSignOutClick}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <LogOut size={14} />
                                        <span>Sign Out</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Logged-Out Centered Header */
                        <div
                            className="flex flex-col items-center justify-center text-center"
                            style={{
                                width: '100%',
                                maxWidth: '680px',
                                margin: '0 auto',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/90 text-indigo-700 text-xs font-bold mb-2 shadow-2xs">
                                <Sparkles size={13} className="text-amber-500" />
                                <span>Pydah Educational Group · Central SSO Gateway</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight text-center">
                                Campus Applications & Portals
                            </h1>

                            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed text-center">
                                Single sign-on entry for student academics, digital fee receipts, hostel living, and institutional operations.
                            </p>

                            <div className="mt-3.5 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={onLoginClick}
                                    className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm inline-flex items-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-98 text-white"
                                    style={{
                                        backgroundColor: '#4f46e5',
                                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                                    }}
                                >
                                    <span>Sign In to Access Portals</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Error Banner */}
            {launchError && (
                <div
                    className="w-full px-4 sm:px-6 lg:px-8 mt-3"
                    style={{ maxWidth: '1280px', margin: '12px auto 0 auto' }}
                >
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs font-semibold">
                        <AlertCircle size={15} className="text-red-600 shrink-0" />
                        <span>{launchError}</span>
                    </div>
                </div>
            )}

            {/* 2. CENTERED SECTION (Larger, High-Impact Cards, Perfectly Centered in the Middle) */}
            <main
                className="w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex-1"
                style={{
                    width: '100%',
                    maxWidth: '1360px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {accessiblePortals.length === 0 ? (
                    <div
                        className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm w-full max-w-md"
                        style={{ margin: 'auto' }}
                    >
                        <Lock size={28} className="mx-auto text-slate-300 mb-2" />
                        <h3 className="text-base font-bold text-slate-800">No applications accessible</h3>
                        <p className="text-slate-500 text-xs mt-1.5">
                            Your account currently has no assigned portal permissions.
                        </p>
                    </div>
                ) : (
                    /* Symmetrical, strictly centered layout: Row 1 = 4 cards, Row 2 = remaining cards centered in the middle */
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'stretch',
                            gap: '20px',
                            width: '100%',
                            maxWidth: '1280px',
                            margin: '0 auto'
                        }}
                    >
                        {accessiblePortals.map((portal) => {
                            const isLaunching = launchingPortalId === portal.portalId;
                            return (
                                <div
                                    key={portal.portalId}
                                    style={{
                                        display: 'flex',
                                        width: 'min(295px, 100%)',
                                        flex: '0 1 295px',
                                        maxWidth: '295px'
                                    }}
                                >
                                    <ModernPortalCard
                                        portal={portal}
                                        user={user}
                                        isLaunching={isLaunching}
                                        onPortalClick={onPortalClick}
                                        onLoginClick={onLoginClick}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

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
                            className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/90 z-10 overflow-hidden text-left"
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
                                    onClick={confirmSignOut}
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

// Larger, Premium Portal Card with Beautiful Visuals and Perfectly Centered Content
const ModernPortalCard = ({
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
            onClick={handleCardClick}
            whileHover={{ y: -6, transition: { duration: 0.22, ease: 'easeOut' } }}
            className="w-full group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] cursor-pointer flex flex-col justify-between overflow-hidden transition-all duration-300 text-center relative"
            style={{
                width: '100%',
                boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.04)'
            }}
        >
            {/* Top Stage: Larger Floating 3D Emoji Avatar & Ambient Glow */}
            <div
                className={`relative w-full py-5 px-4 bg-gradient-to-br ${portal.gradient || 'from-slate-100 to-slate-50'} overflow-hidden flex flex-col items-center justify-center border-b border-slate-100`}
            >
                {/* Ambient Soft Glow Sphere */}
                <div
                    className="absolute w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
                    style={{ backgroundColor: portal.color }}
                />

                {/* Top Status Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-white/95 text-slate-700 shadow-2xs border border-white/80">
                        <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: portal.color }}
                        />
                        <span>{user ? 'Active' : 'SSO'}</span>
                    </span>
                </div>

                {/* Top-Right Indicator */}
                <div className="absolute top-2.5 right-2.5 z-10 text-slate-400 group-hover:text-slate-800 transition-colors">
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>

                {/* Central Floating 3D Emoji Avatar */}
                <div className="relative my-1 flex items-center justify-center">
                    {/* Pulsing orbital halo */}
                    <div
                        className="absolute w-16 h-16 rounded-full border border-white/80 shadow-xs pointer-events-none"
                        style={{
                            borderColor: `${portal.color}35`,
                            boxShadow: `0 0 16px ${portal.color}20`
                        }}
                    />

                    {/* Floating Main Emoji */}
                    <motion.div
                        className="text-5xl select-none filter drop-shadow-md z-10"
                        animate={{
                            y: [-3, 3.5, -3],
                            rotate: [-1.5, 1.5, -1.5]
                        }}
                        transition={{
                            duration: 3.2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        whileHover={{
                            scale: 1.18,
                            rotate: [0, -6, 6, 0],
                            transition: { duration: 0.3 }
                        }}
                    >
                        {portal.emoji || '🚀'}
                    </motion.div>

                    {/* Floating Mini-Emoji Accent */}
                    <motion.div
                        className="absolute -top-1 -right-2 text-lg filter drop-shadow-xs z-10 pointer-events-none"
                        animate={{
                            y: [2, -2.5, 2],
                            scale: [1, 1.15, 1]
                        }}
                        transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.2
                        }}
                    >
                        {portal.subEmoji || '✨'}
                    </motion.div>
                </div>
            </div>

            {/* Centered Details & Content Area */}
            <div className="p-4 sm:p-4.5 flex flex-col flex-1 justify-between items-center text-center gap-3">
                <div className="flex flex-col items-center w-full">
                    {/* Centered Category Pill Badge */}
                    <span
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1"
                        style={{
                            color: portal.color,
                            backgroundColor: `${portal.color}15`,
                            border: `1px solid ${portal.color}25`
                        }}
                    >
                        {portal.badgeText || portal.category}
                    </span>

                    {/* Centered Title */}
                    <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">
                        {portal.title}
                    </h3>

                    {/* Centered Description */}
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 max-w-[250px]">
                        {portal.desc}
                    </p>

                    {/* Feature Micro-Badges */}
                    {portal.metrics && portal.metrics.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5 w-full">
                            {portal.metrics.slice(0, 2).map((metric, i) => (
                                <span
                                    key={i}
                                    className="text-[9.5px] font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md"
                                >
                                    {metric}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Centered 1-Click Launch Button */}
                <div className="w-full pt-2 border-t border-slate-100 flex justify-center">
                    {isLaunching ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span>Launching...</span>
                        </div>
                    ) : user ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 group-hover:bg-slate-900 text-slate-800 group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors">
                            <span>Launch Application</span>
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    ) : (
                        <div
                            className="w-full py-2 px-3 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors"
                        >
                            <span>Sign In to Launch</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PortalsPage;

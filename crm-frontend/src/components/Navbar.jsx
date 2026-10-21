import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Users, Home, ClipboardCheck, UserCircle, CreditCard, Box, Layout, Bus, ReceiptText, LogOut, User, BookOpen } from 'lucide-react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const solutions = [

  {
    title: 'Admission Portal',
    desc: 'Next-generation enrollment and lead management.',
    url: 'https://admissions.pydah.edu.in',
    icon: Users,
    color: '#0ea5e9',
    portalId: 'admissions-crm'
  },
  {
    title: 'Student Portal',
    desc: 'Unified dashboard for student academics and life.',
    url: 'https://sdms.pydah.edu.in',
    icon: UserCircle,
    color: '#f59e0b',
    portalId: 'student-portal'
  },
  {
    title: 'Fee Management',
    desc: 'Streamline institutional finance and fee collection.',
    url: 'https://fees.pydah.edu.in/login',
    icon: ReceiptText,
    color: '#00a6ffff',
    portalId: 'fee-management'
  },
  {
    title: 'Transport Management',
    desc: 'Optimize campus logistics and fleet tracking.',
    url: 'https://pydah-transport.vercel.app/login',
    icon: Bus,
    color: '#0f73ffff',
    portalId: 'transport-management'
  },
  {
    title: 'Hostel Automation',
    desc: 'Smart and secure student residency management.',
    url: 'https://hostel.pydah.edu.in',
    icon: Home,
    color: '#6366f1',
    portalId: 'hostel-automation'
  },
  {
    title: 'HRMS & Payroll',
    desc: 'Comprehensive HR management for institutions.',
    url: 'https://hrms.pydah.edu.in',
    icon: CreditCard,
    color: '#5372ffff',
    portalId: 'hrms'
  },
  {
    title: 'Academic Portal',
    desc: 'Comprehensive curriculum, faculty scheduling, and grading.',
    url: 'https://acad.pydah.edu.in',
    icon: BookOpen,
    color: '#8b5cf6',
    portalId: 'academic-portal'
  },
  {
    title: 'Examination Management System',
    desc: 'Automated exam scheduling, hall tickets, marks, and evaluations.',
    url: 'https://ems.pydah.edu.in',
    icon: ClipboardCheck,
    color: '#ea580c',
    portalId: 'examination-portal'
  }
];

const Navbar = ({ user, onNavigate, onPortalClick, onLogout, onOpenInstall }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const closeTimeoutRef = useRef(null);

  const handleMmEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsMegaMenuOpen(true);
  };

  const handleMmLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 200);
  };

  return (
    <nav className="glass fixed top-0 w-full z-[1000] border-b" style={{ borderColor: 'var(--color-border-soft)', paddingTop: 'clamp(1rem, 2.5vw, 1.25rem)', paddingBottom: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
      <div className="section-container flex justify-between items-center">
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
          onClick={() => onNavigate(user ? 'portals' : 'home')}
        >
          <img
            src="/pydah-logo.webp"
            alt="Pydah Logo"
            className="h-[clamp(30px,3.5vw,40px)] w-auto"
          />
          <span
            className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight whitespace-nowrap bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(110deg, #0f172a 0%, #1e293b 30%, #38bdf8 45%, #ffffff 50%, #38bdf8 55%, #1e293b 70%, #0f172a 100%)',
              backgroundSize: '250% 100%',
              display: 'inline-block',
              animation: 'text-shine 3.5s linear infinite reverse',
            }}
          >
            Pydah CRM
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="desktop-menu flex items-center" style={{ gap: 'clamp(1.75rem, 4.5vw, 2.5rem)' }}>
          <a
            href="#home"
            className="font-medium transition-colors"
            style={{
              color: 'var(--color-text-muted)',
              paddingTop: 'clamp(0.5rem, 1.2vw, 0.625rem)',
              paddingBottom: 'clamp(0.5rem, 1.2vw, 0.625rem)',
              paddingLeft: 'clamp(0.5rem, 1.2vw, 0.625rem)',
              paddingRight: 'clamp(0.5rem, 1.2vw, 0.625rem)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
          >
            Home
          </a>

          {/* Solutions Dropdown / Mega Menu Trigger */}
          <div
            className="relative"
            onMouseEnter={handleMmEnter}
            onMouseLeave={handleMmLeave}
          >
            <button
              className="font-medium flex items-center transition-colors duration-200"
              style={{
                color: isMegaMenuOpen ? 'var(--color-primary)' : 'var(--color-text-muted)',
                gap: 'clamp(0.375rem, 0.8vw, 0.5rem)',
                paddingTop: 'clamp(0.5rem, 1.2vw, 0.625rem)',
                paddingBottom: 'clamp(0.5rem, 1.2vw, 0.625rem)',
                paddingLeft: 'clamp(0.5rem, 1.2vw, 0.625rem)',
                paddingRight: 'clamp(0.5rem, 1.2vw, 0.625rem)'
              }}
              onClick={() => onNavigate('portals')}
            >
              Our Portals <ChevronDown size={16} />
            </button>

            <AnimatePresence>
              {isMegaMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="fixed left-1/2 -translate-x-1/2 w-[min(920px,92vw)] max-w-[920px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-100 z-[2000] max-h-[calc(100vh-120px)] overflow-y-auto"
                  style={{
                    top: 'clamp(75px, 15vw, 85px)',
                    padding: 'clamp(1.5rem, 3.5vw, 2.5rem)'
                  }}
                >
                  {/* Mega Menu Grid */}
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]" style={{ gap: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
                    {solutions.map((item, idx) => (
                      <motion.a
                        key={idx}
                        href={item.url}
                        onClick={(e) => {
                          e.preventDefault();
                          setIsMegaMenuOpen(false);
                          if (onPortalClick) onPortalClick(item);
                        }}
                        whileHover={{
                          backgroundColor: `${item.color}08`,
                          x: 5,
                          transition: { duration: 0.2 }
                        }}
                        className="flex rounded-2xl transition-all duration-200 cursor-pointer group"
                        style={{
                          gap: 'clamp(0.875rem, 2vw, 1rem)',
                          padding: 'clamp(0.875rem, 2vw, 1.25rem)'
                        }}
                      >
                        <div
                          className="rounded-xl flex justify-center items-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                          style={{
                            width: 'clamp(2.5rem, 3vw, 2.75rem)',
                            height: 'clamp(2.5rem, 3vw, 2.75rem)',
                            backgroundColor: `${item.color}15`,
                            color: item.color,
                            boxShadow: `0 0 20px ${item.color}10`
                          }}
                        >
                          <item.icon size={22} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-bold transition-colors duration-300" style={{
                            color: 'var(--color-text-main)',
                            fontSize: 'clamp(0.875rem, 1.8vw, 0.95rem)',
                            marginBottom: 'clamp(0.25rem, 0.6vw, 0.375rem)',
                            lineHeight: '1.3'
                          }}
                            onMouseEnter={(e) => e.target.style.color = item.color}
                            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-main)'}
                          >
                            {item.title}
                          </div>
                          <div className="leading-snug" style={{
                            color: 'var(--color-text-muted)',
                            fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)',
                            lineHeight: '1.4'
                          }}>
                            {item.desc}
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href="#about"
            className="font-medium transition-colors"
            style={{
              color: 'var(--color-text-muted)',
              paddingTop: 'clamp(0.5rem, 1.2vw, 0.625rem)',
              paddingBottom: 'clamp(0.5rem, 1.2vw, 0.625rem)',
              paddingLeft: 'clamp(0.5rem, 1.2vw, 0.625rem)',
              paddingRight: 'clamp(0.5rem, 1.2vw, 0.625rem)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
          >
            About Us
          </a>
          <button
            onClick={onOpenInstall}
            style={{
              border: '2px solid #2563eb',
              backgroundColor: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1d4ed8';
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-blue-600 transition-all font-bold text-xs cursor-pointer shadow-xs"
            title="Download & Install Pydah CRM App"
          >
            <img src="/CRM-APP-logo.png" alt="App Logo" className="w-4 h-4 rounded-xs object-contain" />
            <span className="font-bold tracking-tight text-blue-600">Download App</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('portals')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name || user.username || 'User'}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-indigo-300 shadow-xs"
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
                  className={`w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 ${user.profilePhoto ? 'hidden' : ''}`}
                >
                  {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[150px] truncate">{user.name || user.username}</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('portals')}
                className="text-white rounded-md font-semibold text-xs sm:text-sm cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: 'var(--shadow-soft)',
                  paddingLeft: '1.25rem',
                  paddingRight: '1.25rem',
                  paddingTop: '0.625rem',
                  paddingBottom: '0.625rem'
                }}
              >
                My Portals
              </motion.button>
              {onLogout && (
                <button
                  onClick={() => setShowLogoutModal(true)}
                  title="Sign Out"
                  className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('login')}
              className="text-white rounded-md font-bold text-xs sm:text-sm cursor-pointer"
              style={{
                backgroundColor: 'var(--color-primary)',
                boxShadow: 'var(--shadow-soft)',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem'
              }}
            >
              Sign In
            </motion.button>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-toggle bg-transparent border-none cursor-pointer flex items-center justify-center rounded-full outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none w-9 h-9 p-0"
          style={{
            color: 'var(--color-text-main)',
            width: '36px',
            height: '36px',
            padding: '0',
            outline: 'none',
            border: 'none',
            boxShadow: 'none'
          }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 shadow-xs">
              <X size={18} />
            </div>
          ) : user ? (
            <div className="relative w-9 h-9">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name || user.username || 'User'}
                  className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400 shadow-sm"
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
                className={`w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black text-xs flex items-center justify-center shadow-sm ${user.profilePhoto ? 'hidden' : ''}`}
              >
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors">
              <Menu size={22} />
            </div>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {
        isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bg-white border rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-[999]"
            style={{
              borderColor: 'var(--color-border-soft)',
              top: 'clamp(70px, 12vw, 80px)',
              right: 'clamp(0.75rem, 2.5vw, 1rem)',
              width: 'clamp(285px, 85vw, 325px)',
              maxHeight: 'calc(100vh - clamp(85px, 14vw, 95px))',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              paddingTop: 'clamp(0.875rem, 2vw, 1.125rem)',
              paddingBottom: 'clamp(0.875rem, 2vw, 1.125rem)',
              paddingLeft: 'clamp(0.875rem, 2.5vw, 1rem)',
              paddingRight: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}
          >
            <div className="flex flex-col w-full" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.625rem)', minHeight: 'min-content', width: '100%' }}>
              {/* Top Row: Left Side (Profile Image & Go to My Portals) + Right Side (Home, Our Portals, About Us) */}
              <div className="flex justify-between items-start gap-2.5 w-full">
                {/* Left Side: Profile Image & Go to My Portals */}
                {user ? (
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-50/80 rounded-lg">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.name || user.username || 'User'}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-indigo-300 shadow-xs"
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
                        className={`w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 ${user.profilePhoto ? 'hidden' : ''}`}
                      >
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 truncate">{user.name || user.username}</span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="text-white rounded-lg font-bold py-1.5 px-2 text-center text-[10px] w-full"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        boxShadow: 'var(--shadow-soft)',
                      }}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('portals');
                      }}
                    >
                      Go to My Portals
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-1">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="text-white rounded-lg font-bold py-1.5 px-2 text-center text-[11px] w-full"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        boxShadow: 'var(--shadow-soft)',
                      }}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('login');
                      }}
                    >
                      Sign In
                    </motion.button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenInstall?.();
                      }}
                      style={{
                        border: '1.5px solid #2563eb',
                        backgroundColor: 'rgba(239, 246, 255, 0.7)'
                      }}
                      className="w-full py-1.5 px-1.5 rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 text-blue-600 font-bold text-[10px] cursor-pointer shadow-xs"
                    >
                      <img src="/CRM-APP-logo.png" alt="App Logo" className="w-3.5 h-3.5 rounded-xs object-contain" />
                      <span className="truncate">Download & Install App</span>
                    </button>
                  </div>
                )}

                {/* Right Side: Home, Our Portals, About Us */}
                <div className="flex flex-col items-start shrink-0 pl-1" style={{ gap: '0.2rem' }}>
                  <a
                    href="#home"
                    className="font-medium text-sm text-left"
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)',
                      paddingTop: '0.15rem',
                      paddingBottom: '0.15rem'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMobileMenuOpen(false);
                      onNavigate('home');
                    }}
                  >
                    Home
                  </a>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('portals');
                    }}
                    className="font-medium text-sm flex items-center justify-start bg-transparent border-none cursor-pointer text-left"
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)',
                      paddingTop: '0.15rem',
                      paddingBottom: '0.15rem'
                    }}
                  >
                    Our Portals
                  </button>

                  <a
                    href="#about"
                    className="font-medium text-sm text-left"
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)',
                      paddingTop: '0.15rem',
                      paddingBottom: '0.15rem'
                    }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('home');
                    }}
                  >
                    About Us
                  </a>
                </div>
              </div>

              {/* Download App & Sign Out Section - Only rendered when logged in */}
              {user && (
                <div className="flex flex-col gap-1.5 w-full pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenInstall?.();
                    }}
                    style={{
                      border: '1.5px solid #2563eb',
                      backgroundColor: 'rgba(239, 246, 255, 0.7)'
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 text-blue-600 font-bold text-[11px] cursor-pointer shadow-xs"
                  >
                    <img src="/CRM-APP-logo.png" alt="App Logo" className="w-4 h-4 rounded-xs object-contain" />
                    <span>Download & Install App</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full py-1.5 rounded-lg border border-red-200 text-red-600 font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut size={12} />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )
      }

      {/* Sign Out Confirmation Modal - Rendered at document.body level for perfect centering across all views */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogoutModal(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
              />

              {/* Modal Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200/90 z-10 overflow-hidden my-auto"
              >
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center sm:items-start gap-3.5 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <LogOut size={20} className="translate-x-0.5" />
                  </div>
                  <div className="pr-5 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      Sign Out Confirmation
                    </h3>
                    <p className="hidden sm:block text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
                      Are you sure you want to sign out of your Pydah CRM session?
                    </p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 flex items-center gap-2.5 sm:gap-3 pt-3.5 sm:pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                    style={{ backgroundColor: '#f1f5f9', color: '#334155' }}
                    className="hidden sm:inline-flex sm:flex-1 items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer border border-slate-200 hover:bg-slate-200"
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
                    className="w-full sm:flex-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-red-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:bg-red-700"
                  >
                    <LogOut size={15} style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff' }}>Yes, Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </nav >
  );
};

export default Navbar;

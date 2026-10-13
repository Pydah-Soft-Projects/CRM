import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Users, Home, ClipboardCheck, UserCircle, CreditCard, Box, Layout, Bus, ReceiptText, LogOut, User, BookOpen } from 'lucide-react';
import { useState, useRef } from 'react';

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
    url: 'https://hms.pydahsoft.in',
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
  }
];

const Navbar = ({ user, onNavigate, onPortalClick, onLogout }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          onClick={() => onNavigate('home')}
        >
          <img
            src="/pydah-logo.png"
            alt="Pydah Logo"
            className="h-[clamp(30px,3.5vw,40px)] w-auto"
          />
          <span
            className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight whitespace-nowrap bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(110deg, #6366f1 0%, #0ea5e9 35%, #7dd3fc 50%, #0ea5e9 65%, #6366f1 100%)',
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

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('portals')}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
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
                  onClick={onLogout}
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
          className="mobile-toggle bg-transparent border-none cursor-pointer"
          style={{
            color: 'var(--color-text-main)',
            padding: 'clamp(0.5rem, 1.2vw, 0.625rem)'
          }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="fixed left-0 right-0 bg-white border-t shadow-[0_10px_30px_rgba(0,0,0,0.1)] z-[999]"
            style={{
              borderColor: 'var(--color-border-soft)',
              top: 'clamp(70px, 12vw, 80px)',
              maxHeight: 'calc(100vh - clamp(70px, 12vw, 80px))',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              paddingTop: 'clamp(1.25rem, 3vw, 1.5rem)',
              paddingBottom: 'clamp(1.25rem, 3vw, 1.5rem)',
              paddingLeft: 'clamp(1rem, 2.5vw, 1.25rem)',
              paddingRight: 'clamp(1rem, 2.5vw, 1.25rem)'
            }}
          >
            <div className="flex flex-col" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)', minHeight: 'min-content' }}>
              <a
                href="#home"
                className="font-medium"
                style={{
                  color: 'var(--color-text-muted)',
                  paddingTop: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                  paddingBottom: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  onNavigate('home');
                }}
              >
                Home
              </a>

              <div>
                <button
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  className="font-medium flex items-center justify-between w-full bg-transparent border-none cursor-pointer"
                  style={{
                    color: isMegaMenuOpen ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    paddingTop: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                    paddingBottom: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                  }}
                >
                  Our Portals <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                  />
                </button>

                <AnimatePresence>
                  {isMegaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ marginTop: 'clamp(0.5rem, 1.2vw, 0.75rem)' }}
                    >
                      <div className="flex flex-col" style={{
                        gap: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                        paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
                        maxHeight: 'none'
                      }}>
                        {solutions.map((item, idx) => (
                          <motion.a
                            key={idx}
                            href={item.url}
                            onClick={(e) => {
                              e.preventDefault();
                              setIsMobileMenuOpen(false);
                              if (onPortalClick) onPortalClick(item);
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="flex rounded-xl transition-all duration-200 group"
                            style={{
                              gap: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                              padding: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                              backgroundColor: `${item.color}05`,
                              border: `1px solid ${item.color}10`
                            }}
                          >
                            <div
                              className="rounded-[10px] flex justify-center items-center flex-shrink-0 transition-colors duration-300"
                              style={{
                                width: 'clamp(2.25rem, 3.5vw, 2.5rem)',
                                height: 'clamp(2.25rem, 3.5vw, 2.5rem)',
                                backgroundColor: `${item.color}15`,
                                color: item.color
                              }}
                            >
                              <item.icon size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="font-bold" style={{
                                color: item.color,
                                fontSize: 'clamp(0.8125rem, 1.6vw, 0.875rem)',
                                marginBottom: 'clamp(0.25rem, 0.6vw, 0.375rem)',
                                lineHeight: '1.3'
                              }}>
                                {item.title}
                              </div>
                              <div className="leading-snug" style={{
                                color: 'var(--color-text-muted)',
                                fontSize: 'clamp(0.6875rem, 1.3vw, 0.75rem)',
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
                className="font-medium"
                style={{
                  color: 'var(--color-text-muted)',
                  paddingTop: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                  paddingBottom: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('home');
                }}
              >
                About Us
              </a>

              {user ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{user.name || user.username}</span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-white rounded-xl font-bold py-3 text-center"
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
                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-white rounded-xl font-bold py-3 text-center"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                >
                  Sign In with SSO
                </motion.button>
              )}
            </div>
          </motion.div>
        )
      }
    </nav >
  );
};

export default Navbar;

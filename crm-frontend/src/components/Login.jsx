import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';
import BackgroundAnimations from './BackgroundAnimations';
import { getRandomPortal } from '../data/portalsData';

const Login = ({ portalInfo, onLoginSuccess, onBack, _onPortalChange }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Active portal theme state: randomly chosen if none explicitly passed, or randomized on refresh/mount
  const [activePortal, setActivePortal] = useState(() => {
    if (portalInfo && portalInfo.portalId) {
      return portalInfo;
    }
    const lastId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('last_random_portal_id') : null;
    const random = getRandomPortal(lastId);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('last_random_portal_id', random.portalId);
    }
    return random;
  });

  // When portalInfo prop changes from outside (e.g., user selected specific portal)
  useEffect(() => {
    if (portalInfo && portalInfo.portalId) {
      setActivePortal(portalInfo);
    }
  }, [portalInfo]);

  const currentColor = activePortal?.color || '#4f46e5';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Please enter your username';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      // Centralized Login: Unified authentication across all databases
      const response = await authAPI.login(formData.username, formData.password);

      if (response.success) {
        // Store session tokens & user profile
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Direct user straight to their authorized portals launchpad
        if (onLoginSuccess) {
          onLoginSuccess(response.data.user);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Invalid username or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/80 relative overflow-hidden flex flex-col justify-between" style={{
      paddingTop: 'clamp(70px, 10vw, 100px)',
      paddingBottom: 'clamp(2.5rem, 6vw, 5rem)'
    }}>
      {/* Dynamic Background Animations: changes seamlessly per random portal theme */}
      <BackgroundAnimations
        key={activePortal?.portalId}
        portalId={activePortal?.portalId}
        color={currentColor}
      />

      {/* Content wrapper for responsive centering */}
      <div className="w-full flex-1 relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Header - Human-friendly, professional, no theme name announcements */}
        <div
          className="w-full max-w-xl shrink-0 mb-6 sm:mb-8 text-center"
          style={{ paddingTop: 'clamp(0.5rem, 2vw, 1.5rem)', paddingBottom: 'clamp(0.25rem, 1vw, 0.75rem)' }}
        >
          {/* Institutional Single Sign-On Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold mb-3.5 shadow-sm backdrop-blur-md bg-white/80"
            style={{
              borderColor: `${currentColor}30`,
              color: '#334155'
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <span>Pydah Unified Identity Gateway</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
          >
            Central <span style={{ color: currentColor }}>Sign-In.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-3 text-sm sm:text-base md:text-lg font-normal text-slate-600 max-w-md mx-auto leading-relaxed"
          >
            Sign in once with your institutional credentials to access all authorized campus portals.
          </motion.p>
        </div>

        {/* Form section - Highly responsive card */}
        <div className="w-full max-w-[440px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            {/* Login Card */}
            <div
              className="bg-white/95 rounded-3xl sm:rounded-[2rem] backdrop-blur-xl border relative overflow-hidden transition-all duration-300 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)]"
              style={{
                borderColor: `${currentColor}25`,
                padding: 'clamp(1.5rem, 5vw, 2.5rem)'
              }}
            >
              {/* Subtle dynamic top accent line matching theme */}
              <div
                className="h-1 w-full absolute top-0 left-0 right-0 transition-colors duration-500"
                style={{
                  background: `linear-gradient(90deg, ${currentColor}, ${currentColor}88, transparent)`
                }}
              />

              {/* Back button */}
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mb-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
                >
                  <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={15} />
                  <span>Back to Home</span>
                </button>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                {/* Username Field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5"
                  >
                    Username or Roll Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <User
                        size={17}
                        style={{
                          color: focusedField === 'username' ? currentColor : '#94a3b8',
                          transition: 'color 0.2s ease'
                        }}
                      />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium transition-all duration-200 outline-none"
                      style={{
                        height: '46px',
                        paddingLeft: '40px',
                        paddingRight: '14px',
                        borderColor: errors.username
                          ? '#f87171'
                          : focusedField === 'username'
                          ? currentColor
                          : '#e2e8f0',
                        boxShadow:
                          focusedField === 'username' && !errors.username
                            ? `0 0 0 3px ${currentColor}20`
                            : undefined
                      }}
                      placeholder="e.g. 23PY1A0501 or staff.id"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors.username}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Lock
                        size={17}
                        style={{
                          color: focusedField === 'password' ? currentColor : '#94a3b8',
                          transition: 'color 0.2s ease'
                        }}
                      />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium transition-all duration-200 outline-none"
                      style={{
                        height: '46px',
                        paddingLeft: '40px',
                        paddingRight: '40px',
                        borderColor: errors.password
                          ? '#f87171'
                          : focusedField === 'password'
                          ? currentColor
                          : '#e2e8f0',
                        boxShadow:
                          focusedField === 'password' && !errors.password
                            ? `0 0 0 3px ${currentColor}20`
                            : undefined
                      }}
                      placeholder="••••••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-red-800 font-medium leading-snug">{loginError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md mt-1"
                  style={{
                    backgroundColor: currentColor,
                    height: '48px',
                    boxShadow: `0 10px 24px -5px ${currentColor}45`
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.filter = 'brightness(1.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'none';
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Card Footer */}
              <div className="border-t border-slate-100 text-center mt-6 pt-4">
                <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Secure 256-bit encrypted authentication</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;

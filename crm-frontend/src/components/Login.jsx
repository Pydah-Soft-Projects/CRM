import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import BackgroundAnimations from './BackgroundAnimations';

const Login = ({ portalInfo, onLoginSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if this is the student portal (for unified login)
  const isStudentPortal = portalInfo?.portalId === 'student-portal';

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
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      setLoginError(error.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 relative overflow-hidden flex flex-col" style={{
      paddingTop: 'clamp(80px, 12vw, 100px)',
      paddingBottom: 'clamp(4rem, 10vw, 8rem)'
    }}>
      {/* Dynamic Background Animations */}
      <BackgroundAnimations
        portalId={portalInfo?.portalId}
        color={portalInfo?.color || '#6366f1'}
      />

      {/* Content wrapper for centering */}
      <div className="w-full flex-1 relative z-10 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-12">
        {/* Header */}
        <div
          className="w-full max-w-2xl shrink-0 mb-8 lg:mb-12 text-center"
          style={{ paddingTop: 'clamp(1rem, 2vw, 2rem)', paddingBottom: 'clamp(0.5rem, 1vw, 1rem)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Pydah Unified Identity Gateway
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold text-slate-900 tracking-tighter leading-[1.1] lg:leading-[0.9] [text-shadow:0_10px_30px_rgba(0,0,0,0.05)]"
          >
            Central <span className="text-indigo-600">Sign-In.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-4 text-base sm:text-lg lg:text-xl font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Sign in once to access all your authorized campus portals and administrative tools.
          </motion.p>
        </div>

        {/* Form section */}
        <div className="w-full max-w-[480px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Login Card */}
            <div className="bg-white rounded-[2.5rem] backdrop-blur-xl border transition-all duration-500" style={{
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
              padding: 'clamp(2rem, 4vw, 3rem)'
            }}>
              {/* Back button */}
              {onBack && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={onBack}
                  className="mb-6 flex items-center gap-2 transition-all duration-200 font-medium group"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    paddingTop: 'clamp(0.5rem, 1.2vw, 0.625rem)',
                    paddingBottom: 'clamp(0.5rem, 1.2vw, 0.625rem)'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                >
                  <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform duration-200" size={18} />
                  <span>Back to Home</span>
                </motion.button>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="flex flex-col">
                {/* Username Field */}
                <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                  <label
                    htmlFor="username"
                    className="block font-semibold mb-2.5"
                    style={{
                      color: 'var(--color-text-main)',
                      fontSize: 'clamp(0.875rem, 2vw, 0.95rem)'
                    }}
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      <User size={18} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 placeholder:text-slate-400 bg-white ${errors.username
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200/50 hover:bg-slate-50'
                        }`}
                      style={{
                        height: 'clamp(2.75rem, 4vw, 3rem)',
                        paddingLeft: 'clamp(2.75rem, 5vw, 3rem)',
                        paddingRight: 'clamp(0.875rem, 2vw, 1rem)',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        lineHeight: 1.25,
                        color: 'var(--color-text-main)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                      }}
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center gap-1.5 mt-2"
                      style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}
                    >
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{errors.username}</span>
                    </motion.p>
                  )}
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                  <label
                    htmlFor="password"
                    className="block font-semibold mb-2.5"
                    style={{
                      color: 'var(--color-text-main)',
                      fontSize: 'clamp(0.875rem, 2vw, 0.95rem)'
                    }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={{ paddingLeft: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      <Lock size={18} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 placeholder:text-slate-400 bg-white ${errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200/50 hover:bg-slate-50'
                        }`}
                      style={{
                        height: 'clamp(2.75rem, 4vw, 3rem)',
                        paddingLeft: 'clamp(2.75rem, 5vw, 3rem)',
                        paddingRight: 'clamp(2.75rem, 5vw, 3rem)',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        lineHeight: 1.25,
                        color: 'var(--color-text-main)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                      }}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center transition-colors"
                      style={{ paddingRight: 'clamp(0.875rem, 2vw, 1rem)', color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-main)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center gap-1.5 mt-2"
                      style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}
                    >
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{errors.password}</span>
                    </motion.p>
                  )}
                </div>

                {/* Error Message */}
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3"
                    style={{
                      marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)',
                      padding: 'clamp(1rem, 2.5vw, 1.25rem)'
                    }}
                  >
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium leading-relaxed" style={{ fontSize: 'clamp(0.875rem, 2vw, 0.95rem)' }}>{loginError}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{
                    backgroundColor: portalInfo?.color || 'var(--color-primary)',
                    boxShadow: 'var(--shadow-soft)',
                    paddingLeft: 'clamp(1.5rem, 3.5vw, 2rem)',
                    paddingRight: 'clamp(1.5rem, 3.5vw, 2rem)',
                    paddingTop: 'clamp(0.875rem, 2vw, 1.125rem)',
                    paddingBottom: 'clamp(0.875rem, 2vw, 1.125rem)',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    lineHeight: '1.5',
                    marginTop: 'clamp(0.5rem, 1.5vw, 1rem)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.boxShadow = '0 15px 30px -5px rgba(99, 102, 241, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-soft)';
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={22} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer */}
              <div className="border-t text-center" style={{
                borderColor: 'var(--color-border-soft)',
                marginTop: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                paddingTop: 'clamp(1.25rem, 2.5vw, 1.75rem)'
              }}>
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)'
                }}>
                  Secure authentication powered by{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-text-main)' }}>CRM Gateway</span>
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

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Monitor, CheckCircle, Sparkles, Loader2 } from 'lucide-react';

const InstallAppModal = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredInstallPrompt || null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then((apps) => {
        if (apps && apps.length > 0) {
          setIsInstalled(true);
        }
      }).catch(() => {});
    }

    // Check existing global prompt captured in index.html
    if (window.deferredInstallPrompt) {
      setDeferredPrompt(window.deferredInstallPrompt);
    }

    // Listen for custom event or native beforeinstallprompt
    const handlePromptReady = (e) => {
      const prompt = e.detail || window.deferredInstallPrompt;
      setDeferredPrompt(prompt);
    };

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstalling(false);
      setFeedbackMsg('App successfully installed!');
      setDeferredPrompt(null);
      window.deferredInstallPrompt = null;
      setTimeout(() => {
        onClose();
        setFeedbackMsg(null);
      }, 2000);
    };

    window.addEventListener('pwa-prompt-available', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isOpen]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredInstallPrompt;

    if (promptEvent) {
      try {
        setInstalling(true);
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setFeedbackMsg('Installation accepted! Adding to device...');
          setDeferredPrompt(null);
          window.deferredInstallPrompt = null;
          setTimeout(() => {
            onClose();
            setFeedbackMsg(null);
          }, 2000);
        } else {
          setInstalling(false);
          setFeedbackMsg('Installation prompt dismissed.');
          setTimeout(() => setFeedbackMsg(null), 3000);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        setInstalling(false);
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isIOS) {
        setFeedbackMsg('On iOS Safari: Tap Share (⎋), then choose "Add to Home Screen".');
      } else if (isAndroid) {
        setFeedbackMsg('On Android Chrome: Tap menu (⋮), then tap "Install app" or "Add to Home screen".');
      } else {
        setFeedbackMsg('Please refresh (Ctrl + F5) or click the Install icon in your browser address bar.');
      }
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Soft Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window - Responsive Light Theme with Adaptive Mobile Layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.22)] border border-slate-200/90 text-slate-800 overflow-hidden z-10"
          style={{
            padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1rem, 3.5vw, 1.75rem)',
            boxSizing: 'border-box'
          }}
        >
          {/* Subtle Top Accent Gradient Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)' }}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Close modal"
          >
            <X size={17} />
          </button>

          {/* App Header & Logo */}
          <div className="flex flex-col items-center text-center">
            {/* App Logo */}
            <div className="relative" style={{ marginBottom: '1rem' }}>
              <div
                className="rounded-3xl bg-slate-50 shadow-sm border border-slate-200/90 flex items-center justify-center"
                style={{ width: '82px', height: '82px', padding: '9px' }}
              >
                <img
                  src="/CRM-APP-logo.png"
                  alt="Pydah CRM App Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div
                className="absolute -bottom-1 -right-1 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)' }}
              >
                APP
              </div>
            </div>

            {/* Title */}
            <h3
              className="font-extrabold text-slate-900 tracking-tight text-center"
              style={{
                fontSize: 'clamp(1.2rem, 3.2vw, 1.45rem)',
                lineHeight: '1.25',
                marginBottom: '0.875rem'
              }}
            >
              Install Pydah CRM
            </h3>

            {/* Feature Pills - Auto-adapting, cleanly wraps if needed on narrow mobile screens */}
            <div
              className="flex flex-wrap items-center justify-center w-full"
              style={{ gap: '0.375rem', marginBottom: '1.5rem', maxWidth: '100%' }}
            >
              <span
                className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center font-semibold shrink-0"
                style={{ padding: '0.3rem 0.55rem', fontSize: '11px', gap: '0.25rem' }}
              >
                <Sparkles size={12} className="text-indigo-600 shrink-0" />
                <span>Offline Ready</span>
              </span>
              <span
                className="rounded-full bg-sky-50 border border-sky-200 text-sky-700 flex items-center font-semibold shrink-0"
                style={{ padding: '0.3rem 0.55rem', fontSize: '11px', gap: '0.25rem' }}
              >
                <Monitor size={12} className="text-sky-600 shrink-0" />
                <span>Desktop & Mobile</span>
              </span>
              <span
                className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center font-semibold shrink-0"
                style={{ padding: '0.3rem 0.55rem', fontSize: '11px', gap: '0.25rem' }}
              >
                <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                <span>Instant SSO</span>
              </span>
            </div>
          </div>

          {/* Action Area */}
          <div>
            {isInstalled ? (
              <div
                className="rounded-2xl bg-emerald-50 border border-emerald-200 text-center"
                style={{ padding: '1rem 1.25rem' }}
              >
                <CheckCircle size={24} className="text-emerald-600 mx-auto" style={{ marginBottom: '0.4rem' }} />
                <p className="font-bold text-emerald-800 text-sm">Pydah CRM Is Already Installed!</p>
                <p className="text-emerald-600 text-xs" style={{ marginTop: '0.25rem' }}>
                  Launch it anytime directly from your desktop or home screen.
                </p>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full rounded-2xl font-bold flex items-center justify-center transition-all transform active:scale-[0.98] cursor-pointer shadow-lg hover:brightness-105"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                  color: '#ffffff',
                  padding: '0.875rem 1.25rem',
                  fontSize: 'clamp(0.875rem, 2.5vw, 0.95rem)',
                  gap: '0.5rem',
                  boxShadow: '0 12px 28px -6px rgba(79, 70, 229, 0.45)'
                }}
              >
                {installing ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span className="text-white">Installing Pydah CRM...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} className="text-white" />
                    <span className="text-white">Install Pydah CRM App</span>
                  </>
                )}
              </button>
            )}

            {/* User Feedback Message (if any) */}
            {feedbackMsg && (
              <div
                className="rounded-xl bg-slate-50 border border-slate-200 text-center font-medium text-slate-700"
                style={{ marginTop: '0.75rem', padding: '0.625rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {feedbackMsg}
              </div>
            )}
          </div>

          {/* Footer Branding Note */}
          <div
            className="text-center text-slate-400 font-medium"
            style={{ marginTop: '1.25rem', fontSize: '0.6875rem', letterSpacing: '0.02em' }}
          >
            Pydah Educational Academy &bull; Secure Progressive Web App
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InstallAppModal;

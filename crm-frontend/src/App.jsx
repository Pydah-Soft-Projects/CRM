import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutUsSection from './components/AboutUsSection';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import PortalsPage from './components/PortalsPage';
import Login from './components/Login';
import InstallAppModal from './components/InstallAppModal';
import { authAPI, isTokenExpired, clearAuthSession } from './services/api';

function App() {
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Helper to validate and return active user session (purges expired tokens)
  const getActiveUser = () => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser || isTokenExpired(token)) {
      if (token || storedUser) {
        clearAuthSession();
      }
      return null;
    }
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      clearAuthSession();
      return null;
    }
  };

  // Initialize user only if session is valid and unexpired
  const [user, setUser] = useState(() => getActiveUser());

  // If a user has a valid active session, show 'portals' directly; otherwise show 'home'
  const [currentPage, setCurrentPage] = useState(() => {
    const activeUser = getActiveUser();
    if (activeUser) {
      return 'portals';
    }
    return 'home';
  });

  const [selectedPortal, setSelectedPortal] = useState(null);
  const [launchingPortalId, setLaunchingPortalId] = useState(null);
  const [launchError, setLaunchError] = useState(null);

  // Continuous monitoring: auto-redirect to home when token expires
  useEffect(() => {
    const checkSession = () => {
      const activeUser = getActiveUser();
      if (!activeUser && user) {
        console.log('[Auth] Token expired or invalid. Navigating to home.');
        handleLogout();
      }
    };

    // 1. Initial check
    checkSession();

    // 2. Listen for auth:expired event from API requests
    const handleAuthExpired = () => {
      console.log('[Auth] auth:expired event received. Logging out.');
      handleLogout();
    };

    // 3. Periodic check every 15 seconds
    const intervalId = setInterval(checkSession, 15000);

    // 4. Check on tab visibility or window focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('focus', checkSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('focus', checkSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setLaunchError(null);
    window.scrollTo(0, 0);
  };

  const handlePortalClick = async (portalInfo) => {
    const activeUser = getActiveUser();
    // 1. If not authenticated or token expired, take user to central login
    if (!activeUser) {
      handleLogout();
      setSelectedPortal(portalInfo);
      setCurrentPage('login');
      window.scrollTo(0, 0);
      return;
    }

    // 2. Check if user is authorized for this portal
    const isAuthorized = user.role === 'super_admin' || user.role === 'admin' ||
      (Array.isArray(user.portals) && user.portals.includes(portalInfo.portalId));

    if (!isAuthorized) {
      setLaunchError(`Your account does not have access permissions for ${portalInfo.title}.`);
      return;
    }

    // 3. User is authorized: generate SSO token and redirect
    setLaunchingPortalId(portalInfo.portalId);
    setLaunchError(null);

    try {
      const tokenResponse = await authAPI.generatePortalToken(portalInfo.portalId, true);

      if (tokenResponse.success && tokenResponse.data?.encryptedToken) {
        let redirectUrl = portalInfo.url;

        // Special logic for Student Portal (staff vs student entrypoint)
        if (portalInfo.portalId === 'student-portal') {
          const baseUrl = new URL(portalInfo.url).origin;
          if (user.databaseSource === 'rbac_users') {
            redirectUrl = `${baseUrl}/login`;
          } else {
            redirectUrl = `${baseUrl}/student/login`;
          }
        }

        // Redirect to portal with encrypted token and authorized portals package
        const portalUrl = new URL(redirectUrl);
        portalUrl.searchParams.set('token', tokenResponse.data.encryptedToken);
        if (Array.isArray(user?.portals) && user.portals.length > 0) {
          try {
            portalUrl.searchParams.set('pydah_portals', btoa(JSON.stringify(user.portals)));
          } catch (_) {}
        }
        window.location.href = portalUrl.toString();
        return;
      } else {
        setLaunchError(tokenResponse.message || 'Failed to generate secure SSO token.');
      }
      
    } catch (error) {
      console.error('Portal SSO launch error:', error);
      setLaunchError(error.message || 'Failed to launch portal. Please try again.');
    } finally {
      setLaunchingPortalId(null);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setSelectedPortal(null);
    setLaunchError(null);
    // After login, show the list of all websites the user has!
    setCurrentPage('portals');
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setSelectedPortal(null);
    setLaunchError(null);
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <div className="cloud-bg" />
      <Navbar
        user={user}
        onNavigate={handleNavigate}
        onPortalClick={handlePortalClick}
        onLogout={handleLogout}
        onOpenInstall={() => setShowInstallModal(true)}
      />

      <main>
        {currentPage === 'home' ? (
          <>
            <Hero onNavigate={handleNavigate} user={user} />
            <AboutUsSection />
            <FeaturesSection />
            <CTASection onNavigate={handleNavigate} user={user} />
          </>
        ) : currentPage === 'login' ? (
          <Login
            portalInfo={selectedPortal}
            onLoginSuccess={handleLoginSuccess}
            onBack={() => handleNavigate(user ? 'portals' : 'home')}
          />
        ) : currentPage === 'portals' ? (
          <PortalsPage
            user={user}
            onBack={() => handleNavigate('home')}
            onPortalClick={handlePortalClick}
            onLoginClick={() => handleNavigate('login')}
            onLogout={handleLogout}
            launchingPortalId={launchingPortalId}
            launchError={launchError}
          />
        ) : null}
      </main>

      <Footer onOpenInstall={() => setShowInstallModal(true)} />

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}

export default App;

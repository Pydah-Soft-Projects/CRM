import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutUsSection from './components/AboutUsSection';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import PortalsPage from './components/PortalsPage';
import Login from './components/Login';
import { authAPI } from './services/api';
import { getRandomPortal } from './data/portalsData';

function App() {
  // Resolve starting page from URL hash, path, or session storage
  const getInitialPage = () => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'login' || hash === 'signin') return 'login';
    if (hash === 'portals') return 'portals';

    const path = window.location.pathname.toLowerCase();
    if (path === '/login' || path === '/signin') return 'login';
    if (path === '/portals') return 'portals';

    const saved = sessionStorage.getItem('crm_current_page');
    if (saved === 'login' || saved === 'portals') return saved;
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [selectedPortal, setSelectedPortal] = useState(() => {
    if (getInitialPage() === 'login') {
      const lastId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('last_random_portal_id') : null;
      const random = getRandomPortal(lastId);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('last_random_portal_id', random.portalId);
      }
      return random;
    }
    return null;
  });

  const [launchingPortalId, setLaunchingPortalId] = useState(null);
  const [launchError, setLaunchError] = useState(null);

  // Initialize user from existing session
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse cached user:', e);
        return null;
      }
    }
    return null;
  });

  // Sync with browser back/forward and hash changes like a real website
  useEffect(() => {
    const handleHashOrPop = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'login' || hash === 'signin') {
        setCurrentPage('login');
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('crm_current_page', 'login');
        }
        setSelectedPortal((prev) => {
          const lastId = prev?.portalId || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('last_random_portal_id') : null);
          const random = getRandomPortal(lastId);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('last_random_portal_id', random.portalId);
          }
          return random;
        });
      } else if (hash === 'portals') {
        setCurrentPage('portals');
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('crm_current_page', 'portals');
        }
      } else {
        setCurrentPage('home');
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('crm_current_page', 'home');
        }
      }
    };

    window.addEventListener('hashchange', handleHashOrPop);
    window.addEventListener('popstate', handleHashOrPop);
    return () => {
      window.removeEventListener('hashchange', handleHashOrPop);
      window.removeEventListener('popstate', handleHashOrPop);
    };
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setLaunchError(null);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_current_page', page);

      if (page === 'login') {
        window.location.hash = 'login';
        // On explicit navigation to login, randomly select a portal UI different from previous
        const lastId = sessionStorage.getItem('last_random_portal_id');
        const random = getRandomPortal(lastId);
        sessionStorage.setItem('last_random_portal_id', random.portalId);
        setSelectedPortal(random);
      } else if (page === 'portals') {
        window.location.hash = 'portals';
      } else {
        // Home
        if (window.location.hash) {
          window.history.pushState(null, '', window.location.pathname);
        }
      }
      window.scrollTo(0, 0);
    }
  };

  const handlePortalClick = async (portalInfo) => {
    // 1. If not authenticated, take user to central login with this portal selected
    if (!user) {
      setSelectedPortal(portalInfo);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('last_random_portal_id', portalInfo.portalId);
        sessionStorage.setItem('crm_current_page', 'login');
      }
      setCurrentPage('login');
      window.location.hash = 'login';
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

        // Redirect to portal with encrypted token
        const portalUrl = new URL(redirectUrl);
        portalUrl.searchParams.set('token', tokenResponse.data.encryptedToken);
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
    handleNavigate('portals');
  };

  const handleLogout = () => {
    try {
      if (typeof authAPI.clearAllPortalTokens === 'function') {
        authAPI.clearAllPortalTokens();
      }
    } catch (e) {
      console.warn('Error clearing cached portal tokens:', e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    setUser(null);
    setSelectedPortal(null);
    setLaunchError(null);
    handleNavigate('home');
  };

  return (
    <div className="app">
      <div className="cloud-bg" />
      <Navbar
        user={user}
        onNavigate={handleNavigate}
        onPortalClick={handlePortalClick}
        onLogout={handleLogout}
      />

      <main>
        {currentPage === 'home' ? (
          <>
            <Hero onNavigate={handleNavigate} />
            <AboutUsSection />
            <FeaturesSection />
            <CTASection onNavigate={handleNavigate} />
          </>
        ) : currentPage === 'login' ? (
          <Login
            portalInfo={selectedPortal}
            onLoginSuccess={handleLoginSuccess}
            onBack={() => handleNavigate(user ? 'portals' : 'home')}
            onPortalChange={(newPortal) => setSelectedPortal(newPortal)}
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

      <Footer />
    </div>
  );
}

export default App;

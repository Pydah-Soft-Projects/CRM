import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ModuleShowcase from './components/ModuleShowcase';
import AboutUsSection from './components/AboutUsSection';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import PortalsPage from './components/PortalsPage';
import Login from './components/Login';
import { authAPI } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPortal, setSelectedPortal] = useState(null);
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

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setLaunchError(null);
    window.scrollTo(0, 0);
  };

  const handlePortalClick = async (portalInfo) => {
    // 1. If not authenticated, take user to central login
    if (!user) {
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
    setCurrentPage('portals');
    window.scrollTo(0, 0);
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
    } catch (e) {
      // ignore
    }
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
      />

      <main>
        {currentPage === 'home' ? (
          <>
            <Hero onNavigate={handleNavigate} />
            <ModuleShowcase />
            <AboutUsSection />
            <FeaturesSection />
            <CTASection onNavigate={handleNavigate} />
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

      <Footer />
    </div>
  );
}

export default App;

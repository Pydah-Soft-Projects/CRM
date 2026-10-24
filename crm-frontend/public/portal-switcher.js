/**
 * Pydah Portal Switcher - Universal Cross-Portal Navigation Widget (CDN)
 * Version: 1.0.0
 * 
 * Features:
 * - Pure Vanilla JS with Web Component & Shadow DOM (Zero CSS/JS conflicts)
 * - Draggable floating button with persistent position memory
 * - Host-portal token & session auto-detection
 * - Instant SSO token generation and seamless cross-portal redirection
 * - Responsive, accessible, and theme-adaptive
 */
(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__PYDAH_PORTAL_SWITCHER_INITIALIZED__) return;
  window.__PYDAH_PORTAL_SWITCHER_INITIALIZED__ = true;

  // 1. Master Portal Registry with official URLs & branding (Waffle Pictorial Layout)
  const PORTAL_REGISTRY = [
    {
      id: 'academic-portal',
      title: 'Academic',
      fullTitle: 'Academic Portal',
      category: 'Academics & Faculty',
      shortCat: 'Academics & Faculty',
      description: 'Course curriculum, syllabus schedules, faculty workloads, and timetable.',
      color: '#0d9488',
      tileBg: '#f0fdfa',
      tileBorder: '#ccfbf1',
      iconBg: '#ccfbf1',
      url: 'https://acad.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
    },
    {
      id: 'admissions-crm',
      title: 'Admission',
      fullTitle: 'Admission Portal',
      category: 'Enrollment',
      shortCat: 'Enrollment',
      description: 'Student inquiry pipeline, counselor workflows, and institutional admissions.',
      color: '#0284c7',
      tileBg: '#f0f9ff',
      tileBorder: '#e0f2fe',
      iconBg: '#e0f2fe',
      url: 'https://admissions.pydah.edu.in/auth/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><circle cx="18" cy="8" r="2.5" fill="currentColor"/></svg>`
    },
    {
      id: 'fee-management',
      title: 'Fee',
      fullTitle: 'Fee Management',
      category: 'Finance',
      shortCat: 'Finance',
      description: 'Tuition collection, pending balances, invoice records, and reconciliation.',
      color: '#059669',
      tileBg: '#f0fdf4',
      tileBorder: '#dcfce7',
      iconBg: '#dcfce7',
      url: 'https://fees.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><text x="50%" y="62%" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="800" font-family="-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">₹</text></svg>`
    },
    {
      id: 'hostel-automation',
      title: 'Hostel',
      fullTitle: 'Hostel Automation',
      category: 'Facility',
      shortCat: 'Facility',
      description: 'Campus room allotments, warden logs, hostel passes, and mess management.',
      color: '#db2777',
      tileBg: '#fdf2f8',
      tileBorder: '#fce7f3',
      iconBg: '#fce7f3',
      url: 'https://hostel.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
      id: 'transport-management',
      title: 'Transport',
      fullTitle: 'Transport Management',
      category: 'Logistics',
      shortCat: 'Logistics',
      description: 'Fleet vehicle tracking, bus transit routes, stops, and driver schedules.',
      color: '#0f766e',
      tileBg: '#f0fdfa',
      tileBorder: '#ccfbf1',
      iconBg: '#ccfbf1',
      url: 'https://transport.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>`
    },
    {
      id: 'hrms',
      title: 'HRMS',
      fullTitle: 'HRMS & Payroll',
      category: 'Staff',
      shortCat: 'Staff',
      description: 'Staff directory, biometric attendance, salary payroll, and leave management.',
      color: '#7c3aed',
      tileBg: '#f5f3ff',
      tileBorder: '#ede9fe',
      iconBg: '#ede9fe',
      url: 'https://hrms.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`
    },
    {
      id: 'student-portal',
      title: 'Student',
      fullTitle: 'Student Portal',
      category: 'Learning',
      shortCat: 'Learning',
      description: 'Central student profile, academic records, digital schedules, and updates.',
      color: '#2563eb',
      tileBg: '#eff6ff',
      tileBorder: '#dbeafe',
      iconBg: '#dbeafe',
      url: 'https://sdms.pydah.edu.in/student/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`
    },
    {
      id: 'sams',
      title: 'SAMS',
      fullTitle: 'Labour Management (SAMS)',
      category: 'Workforce',
      shortCat: 'Workforce',
      description: 'Labour attendance tracking, gate access control, shift scanning, and workforce management.',
      color: '#d97706',
      tileBg: '#fffbeb',
      tileBorder: '#fef3c7',
      iconBg: '#fef3c7',
      url: 'https://sams.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/><rect x="15" y="4" width="6" height="5" rx="1.5" fill="#f59e0b"/></svg>`
    },
    {
      id: 'examination-portal',
      title: 'EMS',
      fullTitle: 'Examination System',
      category: 'Exams',
      shortCat: 'Exams',
      description: 'Exam scheduling, hall tickets, marks evaluation, and result processing.',
      color: '#0284c7',
      tileBg: '#f0f9ff',
      tileBorder: '#e0f2fe',
      iconBg: '#e0f2fe',
      url: 'https://ems.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>`
    },
    {
      id: 'stationary-management',
      title: 'Stationary',
      fullTitle: 'Stationary Management',
      category: 'Inventory',
      shortCat: 'Inventory',
      description: 'Stationary stock distribution, inventory logs, sub-admin privileges, and campus allocations.',
      color: '#4f46e5',
      tileBg: '#eef2ff',
      tileBorder: '#e0e7ff',
      iconBg: '#e0e7ff',
      url: 'https://stationary.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="#ffffff" opacity="0.3"/></svg>`
    },
    {
      id: 'staff-recruitment',
      title: 'Recruit',
      fullTitle: 'Staff Recruitment',
      category: 'Hiring',
      shortCat: 'Hiring',
      description: 'Staff recruitment pipeline, candidate screening, panel interviews, and hiring approvals.',
      color: '#0891b2',
      tileBg: '#ecfeff',
      tileBorder: '#cffafe',
      iconBg: '#cffafe',
      url: 'https://srs.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/><circle cx="9.5" cy="8.5" r="2"/><path d="M6.5 12.5c0-1 .8-1.5 3-1.5s3 .5 3 1.5v.5h-6v-.5z"/></svg>`
    }
  ];

  // 2. Default Configuration
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const scriptConfig = {
    currentPortal: currentScript?.getAttribute('data-current-portal') || null,
    apiBaseUrl: currentScript?.getAttribute('data-api-base-url') || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://crm.pydah.edu.in'),
    position: currentScript?.getAttribute('data-position') || 'bottom-right',
    theme: currentScript?.getAttribute('data-theme') || 'light',
    landingUrl: currentScript?.getAttribute('data-landing-url') || 'https://crm.pydah.edu.in'
  };

  // Helper to parse JWT payload safely without external dependencies
  function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) base64 += '=';
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

  // Auto-detect host portal token and user session
  function detectHostSession() {
    let token = null;
    let user = null;
    let portals = null;

    // 1. Check URL query params for incoming SSO switch
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isSwitch = urlParams.get('sso_switch') === '1';
      const switchToken = urlParams.get('token');

      // When arriving via an explicit cross-portal SSO switch, clear stale cached credentials
      // to ensure the incoming user session is established rather than an old logged-in session.
      if (isSwitch && switchToken) {
        const staleTokenKeys = ['accessToken', 'token', 'jwt', 'authToken', 'crmAccessToken', 'auth_token', 'hrms_token', 'hrmsToken'];
        const staleUserKeys = ['user', 'currentUser', 'studentUser', 'auth_user', 'profile', 'employee', 'userData', 'userInfo', 'hrms_user', 'hrmsUser'];
        staleTokenKeys.forEach(function (k) {
          try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {}
        });
        staleUserKeys.forEach(function (k) {
          try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {}
        });
        try { localStorage.removeItem('pydah_authorized_portals'); } catch (_) {}
      }
    } catch (_) {}

    // Helper to read cookie value
    function getCookie(name) {
      try {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : null;
      } catch (_) {
        return null;
      }
    }

    // 2. Check common token storage keys
    const tokenKeys = ['accessToken', 'token', 'jwt', 'authToken', 'crmAccessToken', 'auth_token', 'hrms_token', 'hrmsToken', 'transport_token', 'transportToken', 'fee_token', 'feeToken', 'srs_token', 'srsToken', 'sams_token', 'samsToken', 'stationary_token', 'stationaryToken'];
    for (const key of tokenKeys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key) || getCookie(key);
      if (val && typeof val === 'string' && val.length > 20) {
        token = val;
        break;
      }
    }

    // 3. Check common user storage keys (including HRMS and portal-specific variants)
    const userKeys = ['user', 'currentUser', 'studentUser', 'auth_user', 'profile', 'employee', 'userData', 'userInfo', 'hrms_user', 'hrmsUser', 'transport_user', 'transportUser', 'fee_user', 'feeUser', 'srs_user', 'srsUser', 'sams_user', 'samsUser', 'subadmin', 'subAdmin', 'stationary_user', 'stationaryUser'];
    for (const key of userKeys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key) || getCookie(key);
      if (val) {
        try {
          user = typeof val === 'object' ? val : JSON.parse(val);
          if (user && typeof user === 'object') {
            if (!user.employeeId && user.emp_no) user.employeeId = user.emp_no;
            if (!user.employeeId && user.hrmsEmployeeId) user.employeeId = user.hrmsEmployeeId;
            if (!user.employeeId && user.empNo) user.employeeId = user.empNo;
            if (!user.username && user.emp_no) user.username = user.emp_no;
            if (!user.username && user.hrmsEmployeeId) user.username = user.hrmsEmployeeId;
            if (!user.username && user.empNo) user.username = user.empNo;
            if (!user.name && user.employee_name) user.name = user.employee_name;
            if (!user.name && user.displayName) user.name = user.displayName;
            if (!user.phone && user.mobile) user.phone = user.mobile;
            break;
          }
        } catch (_) {}
      }
    }

    // 4. Check for persisted authorized portals list
    try {
      const savedPortals = localStorage.getItem('pydah_authorized_portals');
      if (savedPortals) {
        const parsed = JSON.parse(savedPortals);
        if (Array.isArray(parsed) && parsed.length > 0) {
          portals = parsed;
        }
      }
    } catch (_) {}

    // 5. If token exists, supplement user info from decoded JWT payload
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        user = {
          id: decoded.userId || decoded.id || decoded._id || user?.id,
          username: decoded.username || decoded.name || user?.username,
          name: decoded.name || user?.name || decoded.username,
          email: decoded.email || user?.email,
          phone: decoded.phone || decoded.mobile || user?.phone || user?.mobile,
          role: decoded.role || user?.role || 'user',
          portals: decoded.portals || user?.portals || portals || [],
          employeeId: decoded.employeeId || decoded.hrmsEmployeeId || decoded.empNo || user?.employeeId,
          databaseSource: decoded.databaseSource || user?.databaseSource,
          ...user
        };
      }
    }

    if (portals && user) {
      user.portals = portals;
    }

    return { token, user, portals };
  }

  // 3. Web Component definition with Shadow DOM
  class PydahPortalSwitcherComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.isDragging = false;
      this.dragMoved = false;
      this.startX = 0;
      this.startY = 0;
      this.initialX = 0;
      this.initialY = 0;
      this.switchingPortalId = null;
      this.errorMessage = null;
      this.authorizedPortals = null;
      this.isLoadingPortals = false;

      // Session State
      const detected = detectHostSession();
      this.token = detected.token;
      this.user = detected.user;
      this.authorizedPortals = detected.portals || (Array.isArray(detected.user?.portals) && detected.user.portals.length > 0 ? detected.user.portals : null);
      this.currentPortal = scriptConfig.currentPortal;
      this.apiBaseUrl = scriptConfig.apiBaseUrl;
      this.landingUrl = scriptConfig.landingUrl;
      this.position = scriptConfig.position;
      this.transitionState = null;
      this.transitionFading = false;

      // Bound methods
      this.handleToggle = this.handleToggle.bind(this);
      this.handleClose = this.handleClose.bind(this);
      this.handlePortalClick = this.handlePortalClick.bind(this);
      this.handleDocumentClick = this.handleDocumentClick.bind(this);
      this.showTransition = this.showTransition.bind(this);
      this.hideTransition = this.hideTransition.bind(this);
    }

    static get observedAttributes() {
      return ['current-portal', 'api-base-url', 'position'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'current-portal') this.currentPortal = newValue;
      if (name === 'api-base-url') this.apiBaseUrl = newValue;
      if (name === 'position') this.position = newValue;
      this.fetchUserPortals();
      this.render();
    }

    connectedCallback() {
      // Check for incoming SSO transition
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasSsoSwitch = urlParams.get('sso_switch') === '1' || Boolean(urlParams.get('token'));
        if (hasSsoSwitch) {
          const curPortalId = this.currentPortal || scriptConfig.currentPortal;
          const portalMeta = PORTAL_REGISTRY.find(p => p.id === curPortalId) || {
            title: curPortalId ? curPortalId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Workspace',
            color: '#2563eb',
            category: 'Pydah Workspace'
          };
          this.transitionState = {
            title: portalMeta.title,
            color: portalMeta.color,
            icon: portalMeta.icon,
            category: portalMeta.category,
            heading: 'Switching workspace...',
            detail: 'Authenticating session & verifying permissions...',
            isArrival: true
          };
          this.startArrivalDismissWatcher();
        }
      } catch (_) {}

      this.render();
      this.setupDragging();
      this.fetchUserPortals();

      document.addEventListener('click', this.handleDocumentClick);
      this.onSessionChange = () => {
        const s = detectHostSession();
        if ((s.token && s.token !== this.token) || (s.user && JSON.stringify(s.user) !== JSON.stringify(this.user))) {
          this.token = s.token;
          this.user = s.user;
          this.fetchUserPortals();
        }
      };

      window.addEventListener('storage', this.onSessionChange);
      window.addEventListener('popstate', this.onSessionChange);
      window.addEventListener('pydah_session_updated', this.onSessionChange);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.handleDocumentClick);
      if (this.onSessionChange) {
        window.removeEventListener('storage', this.onSessionChange);
        window.removeEventListener('popstate', this.onSessionChange);
        window.removeEventListener('pydah_session_updated', this.onSessionChange);
      }
    }

    setSession({ token, user, currentPortal }) {
      if (token !== undefined) this.token = token;
      if (user !== undefined) this.user = user;
      if (currentPortal !== undefined) this.currentPortal = currentPortal;
      this.authorizedPortals = null;
      this.fetchUserPortals();
      this.render();
    }

    handleDocumentClick(e) {
      if (!this.isOpen) return;
      if (!this.contains(e.target)) {
        this.close();
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.errorMessage = null;

      const s = detectHostSession();
      if (
        !this.authorizedPortals ||
        this.authorizedPortals.length <= 1 ||
        (s.token && s.token !== this.token) ||
        (s.user && JSON.stringify(s.user) !== JSON.stringify(this.user))
      ) {
        if (s.token) this.token = s.token;
        if (s.user) this.user = s.user;
        this.fetchUserPortals();
      }
      this.render();
    }

    close() {
      this.isOpen = false;
      this.errorMessage = null;
      this.render();
    }

    handleToggle(e) {
      if (this.dragMoved) {
        this.dragMoved = false;
        return;
      }
      e.stopPropagation();
      this.toggle();
    }

    handleClose(e) {
      e.stopPropagation();
      this.close();
    }

    showTransition(config) {
      this.transitionState = {
        title: config.title || 'Workspace',
        color: config.color || '#2563eb',
        icon: config.icon || '',
        category: config.category || 'Pydah Suite',
        heading: config.heading || 'Switching workspace...',
        detail: config.detail || 'Authenticating your session securely...',
        isArrival: Boolean(config.isArrival)
      };
      this.transitionFading = false;
      this.render();
    }

    hideTransition() {
      if (!this.transitionState) return;
      const overlay = this.shadowRoot.querySelector('.pydah-transition-overlay');
      if (overlay) {
        overlay.classList.add('is-fading');
      }
      this.transitionFading = true;
      setTimeout(() => {
        this.transitionState = null;
        this.transitionFading = false;
        this.render();
      }, 420);
    }

    startArrivalDismissWatcher() {
      let dismissed = false;
      const initialPath = window.location.pathname;

      const doDismiss = () => {
        if (dismissed) return;
        dismissed = true;
        this.hideTransition();
        cleanup();
      };

      const checkNavigation = () => {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const isStillOnLogin = currentPath.toLowerCase().includes('login') || currentPath.toLowerCase().includes('auth');
        const hasTokenInUrl = currentSearch.includes('token=') || currentSearch.includes('sso_switch=');

        if (!isStillOnLogin || (!hasTokenInUrl && currentPath !== initialPath)) {
          setTimeout(doDismiss, 350);
          return true;
        }

        const dashboardElements = document.querySelector('nav, header, aside, [class*="dashboard"], [class*="sidebar"], [class*="layout"], table, main');
        if (dashboardElements && !isStillOnLogin) {
          setTimeout(doDismiss, 300);
          return true;
        }
        return false;
      };

      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        setTimeout(checkNavigation, 100);
      };
      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        setTimeout(checkNavigation, 100);
      };

      const pollTimer = setInterval(() => {
        try {
          checkNavigation();
        } catch (_) {}
      }, 150);

      const onStorage = (e) => {
        if (e && e.key && ['sessionToken', 'token', 'accessToken', 'jwt', 'user', 'currentUser'].includes(e.key)) {
          setTimeout(checkNavigation, 300);
        }
      };

      window.addEventListener('storage', onStorage);
      window.addEventListener('popstate', checkNavigation);

      const safetyCapTimer = setTimeout(() => {
        doDismiss();
      }, 5500);

      const cleanup = () => {
        try {
          history.pushState = originalPushState;
          history.replaceState = originalReplaceState;
        } catch (_) {}
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('popstate', checkNavigation);
        clearInterval(pollTimer);
        clearTimeout(safetyCapTimer);
      };
    }

    async handlePortalClick(portal) {
      if (portal.id === this.currentPortal) return;
      if (this.switchingPortalId) return;

      this.switchingPortalId = portal.id;
      this.errorMessage = null;

      this.isOpen = false;
      this.showTransition({
        title: portal.title,
        color: portal.color,
        icon: portal.icon,
        category: portal.category,
        heading: 'Switching workspace...',
        detail: `Connecting to ${portal.title} securely...`,
        isArrival: false
      });

      try {
        const latestSession = detectHostSession();
        const activeToken = this.token || latestSession.token;
        const activeUser = this.user || latestSession.user;

        const response = await fetch(`${this.apiBaseUrl}/auth/switch-portal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
          },
          body: JSON.stringify({
            targetPortalId: portal.id,
            currentPortalId: this.currentPortal,
            token: activeToken,
            user: activeUser
          })
        });

        const data = await response.json();

        if (response.ok && data.success && data.data?.redirectUrl) {
          const redirectObj = new URL(data.data.redirectUrl);
          redirectObj.searchParams.set('sso_switch', '1');
          window.location.href = redirectObj.toString();
          return;
        }

        throw new Error(data.message || 'Unable to generate single sign-on token for portal.');
      } catch (err) {
        console.error('[PydahSwitcher] Portal switch error:', err);
        this.hideTransition();
        this.errorMessage = err.message || 'Failed to switch portal. Please try again.';
        this.open();
      } finally {
        this.switchingPortalId = null;
        this.render();
      }
    }

    setupDragging() {
      const btn = this.shadowRoot.querySelector('#pydah-fab-btn');
      if (!btn) return;
      const container = this.shadowRoot.querySelector('.pydah-switcher-container');
      if (!container) return;

      const getLimits = () => {
        const btnW = btn.offsetWidth || 50;
        const btnH = btn.offsetHeight || 50;
        const maxX = Math.max(0, window.innerWidth - btnW);
        const maxY = Math.max(0, window.innerHeight - btnH);
        return { maxX, maxY };
      };

      // Restore position if previously dragged or saved (on both mobile and desktop)
      if (this.currentX !== undefined && this.currentY !== undefined) {
        const { maxX, maxY } = getLimits();
        const safeX = Math.max(0, Math.min(maxX, this.currentX));
        const safeY = Math.max(0, Math.min(maxY, this.currentY));
        this.currentX = safeX;
        this.currentY = safeY;
        container.style.right = 'auto';
        container.style.bottom = 'auto';
        container.style.left = `${safeX}px`;
        container.style.top = `${safeY}px`;
      } else {
        const savedPos = localStorage.getItem('pydah_switcher_pos');
        if (savedPos) {
          try {
            const { x, y } = JSON.parse(savedPos);
            const { maxX, maxY } = getLimits();
            const safeX = Math.max(0, Math.min(maxX, x));
            const safeY = Math.max(0, Math.min(maxY, y));
            this.currentX = safeX;
            this.currentY = safeY;
            container.style.right = 'auto';
            container.style.bottom = 'auto';
            container.style.left = `${safeX}px`;
            container.style.top = `${safeY}px`;
          } catch (_) {}
        }
      }

      const startDrag = (clientX, clientY) => {
        this.isDragging = true;
        this.dragMoved = false;
        this.startX = clientX;
        this.startY = clientY;
        const rect = container.getBoundingClientRect();
        this.initialX = rect.left;
        this.initialY = rect.top;
      };

      const moveDrag = (clientX, clientY, ev) => {
        if (!this.isDragging) return;
        const dx = clientX - this.startX;
        const dy = clientY - this.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          this.dragMoved = true;
          if (ev && ev.cancelable) {
            ev.preventDefault();
          }
          const { maxX, maxY } = getLimits();
          const newX = Math.max(0, Math.min(maxX, this.initialX + dx));
          const newY = Math.max(0, Math.min(maxY, this.initialY + dy));
          this.currentX = newX;
          this.currentY = newY;
          container.style.right = 'auto';
          container.style.bottom = 'auto';
          container.style.left = `${newX}px`;
          container.style.top = `${newY}px`;
        }
      };

      const endDrag = (ev) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (this.dragMoved) {
          if (ev && ev.cancelable) {
            ev.preventDefault();
          }
          const rect = container.getBoundingClientRect();
          localStorage.setItem('pydah_switcher_pos', JSON.stringify({
            x: Math.round(rect.left),
            y: Math.round(rect.top)
          }));
        }
      };

      // 1. Pointer Events (Modern standard for both desktop mouse and mobile touch/stylus)
      btn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startDrag(e.clientX, e.clientY);
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {}
      });

      btn.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;
        moveDrag(e.clientX, e.clientY, e);
      });

      const onPointerEnd = (e) => {
        if (!this.isDragging) return;
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch (_) {}
        endDrag(e);
      };

      btn.addEventListener('pointerup', onPointerEnd);
      btn.addEventListener('pointercancel', onPointerEnd);

      // 2. Touch Events (Fallback for mobile touch screens)
      btn.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      btn.addEventListener('touchmove', (e) => {
        if (!this.isDragging || !e.touches || e.touches.length !== 1) return;
        moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        endDrag(e);
      });

      btn.addEventListener('touchcancel', (e) => {
        endDrag(e);
      });

      // 3. Mouse Events (Desktop fallback)
      btn.addEventListener('mousedown', (e) => {
        if (window.PointerEvent || e.button !== 0) return;
        startDrag(e.clientX, e.clientY);

        const onMouseMove = (ev) => {
          moveDrag(ev.clientX, ev.clientY, ev);
        };

        const onMouseUp = (ev) => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          endDrag(ev);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }

    async fetchUserPortals() {
      if (this.isLoadingPortals) return;
      try {
        this.isLoadingPortals = true;
        const latestSession = detectHostSession();
        const activeToken = this.token || latestSession.token;
        const activeUser = this.user || latestSession.user;

        if (latestSession.portals && latestSession.portals.length > 0) {
          this.authorizedPortals = latestSession.portals;
          this.renderPortalList();
          if (!activeToken && !activeUser) {
            this.isLoadingPortals = false;
            return;
          }
        } else if (activeUser && Array.isArray(activeUser.portals) && activeUser.portals.length > 0) {
          this.authorizedPortals = activeUser.portals;
          this.renderPortalList();
          if (!activeToken) {
            this.isLoadingPortals = false;
            return;
          }
        }

        if (!activeToken && !activeUser) {
          this.authorizedPortals = this.currentPortal ? [this.currentPortal] : [];
          this.isLoadingPortals = false;
          this.renderPortalList();
          return;
        }

        let res = null;
        const payload = {
          token: activeToken,
          user: activeUser,
          currentPortalId: this.currentPortal
        };

        const tryFetch = async (baseUrl) => {
          const resp = await fetch(`${baseUrl}/auth/user-portals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
            },
            body: JSON.stringify(payload)
          });
          return resp.json();
        };

        try {
          res = await tryFetch(this.apiBaseUrl);
        } catch (err1) {
          if (window.location.hostname === 'localhost') {
            try {
              const altPort = this.apiBaseUrl.includes('8000') ? 'http://localhost:3000' : 'http://localhost:8000';
              res = await tryFetch(altPort);
            } catch (_) {}
          }
        }

        if (res && res.success && Array.isArray(res.data?.portals)) {
          this.authorizedPortals = res.data.portals.map(p => p.id || p.portalId);
          if (res.data.user) {
            this.user = { ...this.user, ...res.data.user, portals: this.authorizedPortals };
          }
          if (this.authorizedPortals.length > 0) {
            localStorage.setItem('pydah_authorized_portals', JSON.stringify(this.authorizedPortals));
          }
          console.log('[PydahSwitcher] Discovered authorized portals from backend:', this.authorizedPortals);
        } else {
          this.authorizedPortals = this.currentPortal ? [this.currentPortal] : [];
        }
      } catch (e) {
        console.warn('[PydahSwitcher] Failed to fetch authorized portals:', e.message);
        this.authorizedPortals = this.currentPortal ? [this.currentPortal] : [];
      } finally {
        this.isLoadingPortals = false;
        this.renderPortalList();
      }
    }

    getFilteredPortals() {
      let list = PORTAL_REGISTRY;
      const allowed = this.authorizedPortals || (Array.isArray(this.user?.portals) ? this.user.portals : null);
      if (allowed && allowed.length > 0) {
        list = list.filter(p => allowed.includes(p.id) || p.id === this.currentPortal);
      } else if (this.currentPortal) {
        list = list.filter(p => p.id === this.currentPortal);
      }
      return list;
    }

    renderPortalList() {
      const grid = this.shadowRoot.querySelector('#pydah-portals-grid');
      if (!grid) return;

      if (this.isLoadingPortals && !this.authorizedPortals) {
        grid.innerHTML = `
          <div class="empty-state" style="padding: 36px 12px; grid-column: span 3;">
            <div class="spinner-sm" style="width: 22px; height: 22px; margin-bottom: 8px;"></div>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Checking accessible portals...</p>
          </div>
        `;
        return;
      }

      const filtered = this.getFilteredPortals();

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: span 3; padding: 36px 12px;">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style="font-size: 12px; color: #64748b; margin-top: 6px;">No accessible portals available for this account</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(portal => {
        const isCurrent = portal.id === this.currentPortal;
        const isSwitching = portal.id === this.switchingPortalId;
        return `
          <div 
            class="waffle-card ${isCurrent ? 'is-current' : ''} ${isSwitching ? 'is-loading' : ''}" 
            data-portal-id="${portal.id}"
            style="--card-tint: ${portal.tileBg || '#f8fafc'}; --card-border: ${portal.tileBorder || '#e2e8f0'}; --card-accent: ${portal.color}; --icon-bg: ${portal.iconBg || portal.color + '18'};"
            title="${portal.fullTitle || portal.title} • ${portal.shortCat || portal.category}"
          >
            ${isCurrent ? `<span class="active-badge-dot" title="Current Portal"></span>` : ''}
            <div class="waffle-icon-wrap">
              ${isSwitching ? `<div class="spinner-sm" style="border-top-color: ${portal.color}; width: 20px; height: 20px;"></div>` : portal.icon}
            </div>
            <span class="waffle-title">${portal.title}</span>
            <span class="waffle-subtitle">${portal.shortCat || portal.category}</span>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.waffle-card:not(.is-current)').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-portal-id');
          const portal = PORTAL_REGISTRY.find(p => p.id === id);
          if (portal) this.handlePortalClick(portal);
        });
      });
    }

    render() {
      const userName = this.user?.name || this.user?.username || this.user?.email || 'User';
      const userRole = this.user?.role || (this.user ? 'Authenticated' : 'Guest');
      const crmLogoUrl = (this.apiBaseUrl || scriptConfig.landingUrl || 'https://crm.pydah.edu.in').replace(/\/$/, '') + '/CRM-APP-logo.png';

      this.shadowRoot.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&display=swap');
          :host {
            all: initial;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
            z-index: 2147483647;
          }
          *, *::before, *::after {
            box-sizing: inherit;
          }
          /* Floating Container */
          .pydah-switcher-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            user-select: none;
            touch-action: none;
          }
          /* Floating Action Button (Waffle 9-Dots) */
          .pydah-fab {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.5), 0 8px 10px -6px rgba(79, 70, 229, 0.3);
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
            position: relative;
            outline: none;
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
          .pydah-fab:hover {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 16px 30px -4px rgba(79, 70, 229, 0.6), 0 10px 12px -5px rgba(79, 70, 229, 0.4);
          }
          .pydah-fab:active {
            transform: scale(0.96);
            cursor: grabbing;
          }
          .pydah-fab-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
            pointer-events: none;
          }
          .pydah-fab-icon svg,
          .pydah-fab-icon rect,
          .pydah-fab-icon path {
            pointer-events: none;
          }
          .pydah-fab.is-open .pydah-fab-icon {
            transform: rotate(90deg);
          }
          .fab-pulse {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid rgba(99, 102, 241, 0.4);
            animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            pointer-events: none;
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 0; }
            100% { transform: scale(1.15); opacity: 0; }
          }
          /* Mobile Backdrop */
          .pydah-backdrop {
            display: none;
          }
          /* Popover Flyout Panel - Waffle Style */
          .pydah-popover {
            position: absolute;
            bottom: 64px;
            right: 0;
            width: 345px;
            max-width: calc(100vw - 32px);
            max-height: min(650px, calc(100vh - 90px));
            background: #ffffff;
            border-radius: 22px;
            box-shadow: 0 24px 50px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: popover-slide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transform-origin: bottom right;
          }
          .mobile-handle {
            display: none;
            width: 38px;
            height: 4px;
            border-radius: 2px;
            background: #cbd5e1;
            margin: 8px auto 0 auto;
            flex-shrink: 0;
          }
          @keyframes popover-slide {
            from {
              opacity: 0;
              transform: scale(0.94) translateY(12px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          /* Pictorial Header Banner */
          .popover-banner {
            padding: 16px 18px 14px 18px;
            background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 45%, #ecfeff 100%);
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
          }
          .banner-left {
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 2;
          }
          .banner-titles {
            display: flex;
            flex-direction: column;
          }
          .banner-title-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
            cursor: pointer;
            width: fit-content;
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
          }
          .banner-title-link:hover {
            transform: translateX(2px);
            opacity: 0.92;
          }
          .banner-title-link:hover .banner-title-ext {
            transform: translate(2px, -2px);
            stroke: #4338ca;
          }
          .banner-title {
            margin: 0;
            font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.025em;
            line-height: 1.2;
            background: linear-gradient(135deg, #0f172a 0%, #312e81 45%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .banner-title-ext {
            stroke: #6366f1;
            transition: transform 0.2s ease, stroke 0.2s ease;
            flex-shrink: 0;
          }
          .banner-subtitle {
            font-size: 11px;
            font-weight: 500;
            color: #64748b;
            line-height: 1.3;
            margin-top: 2px;
          }
          .banner-user-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-top: 5px;
            padding: 2px 7px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(226, 232, 240, 0.9);
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            align-self: flex-start;
          }
          .banner-user-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #10b981;
          }
          .banner-right {
            display: flex;
            align-items: center;
            z-index: 1;
            margin-right: 20px;
          }
          .banner-isometric-img {
            width: 96px;
            height: 66px;
            pointer-events: none;
          }
          .btn-close {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 5;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(226, 232, 240, 0.8);
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
            backdrop-filter: blur(4px);
          }
          .btn-close:hover {
            background: #ffffff;
            color: #0f172a;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }
          /* Error Banner */
          .error-banner {
            margin: 8px 14px 0 14px;
            padding: 8px 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            border-radius: 10px;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          /* Waffle 3-Column Grid */
          .waffle-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 12px 14px 14px 14px;
            max-height: 440px;
            overflow-y: auto;
            overscroll-behavior: contain;
          }
          .waffle-grid::-webkit-scrollbar {
            width: 5px;
          }
          .waffle-grid::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .waffle-card {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 10px 4px 8px 4px;
            border-radius: 14px;
            background: var(--card-tint);
            border: 1px solid var(--card-border);
            cursor: pointer;
            transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease, filter 0.22s ease;
            user-select: none;
          }
          .waffle-card:hover:not(.is-current) {
            transform: translateY(-2px);
            border-color: var(--card-accent);
            box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.12);
            filter: brightness(1.02);
          }
          .waffle-card:active:not(.is-current) {
            transform: translateY(0) scale(0.98);
          }
          .waffle-card.is-current {
            border-color: var(--card-accent);
            box-shadow: 0 0 0 2px var(--card-accent);
            cursor: default;
          }
          .waffle-card.is-loading {
            opacity: 0.65;
            pointer-events: none;
          }
          .waffle-icon-wrap {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: var(--icon-bg);
            color: var(--card-accent);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 5px;
            transition: transform 0.2s ease;
            flex-shrink: 0;
          }
          .waffle-card:hover:not(.is-current) .waffle-icon-wrap {
            transform: scale(1.06);
          }
          .waffle-icon-wrap svg {
            width: 20px;
            height: 20px;
          }
          .waffle-title {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 95%;
          }
          .waffle-subtitle {
            font-size: 9.5px;
            font-weight: 500;
            color: #64748b;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 95%;
          }
          .active-badge-dot {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--card-accent);
            box-shadow: 0 0 0 2px #ffffff;
          }
          /* Loading Spinner */
          .spinner-sm {
            width: 16px;
            height: 16px;
            border: 2px solid #e2e8f0;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .empty-state {
            padding: 30px 10px;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          /* Responsive sizing across screen sizes */
          @media (max-width: 640px) {
            .pydah-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.45);
              backdrop-filter: blur(3px);
              -webkit-backdrop-filter: blur(3px);
              z-index: 9999998;
              animation: pydah-fade-in 0.2s ease-out;
            }
            .pydah-switcher-container {
              bottom: max(16px, env(safe-area-inset-bottom, 16px));
              right: max(16px, env(safe-area-inset-right, 16px));
            }
            .pydah-fab {
              width: 50px;
              height: 50px;
            }
            .mobile-handle {
              display: block;
            }
            .pydah-popover {
              position: fixed !important;
              left: 10px !important;
              right: 10px !important;
              bottom: max(10px, env(safe-area-inset-bottom, 10px)) !important;
              top: auto !important;
              width: auto !important;
              max-width: calc(100vw - 20px) !important;
              max-height: min(86vh, 620px) !important;
              border-radius: 24px;
              box-shadow: 0 -8px 40px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.1);
              animation: pydah-sheet-slide 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              transform-origin: bottom center;
              z-index: 9999999;
            }
            .popover-banner {
              padding: 14px 16px;
            }
            .banner-isometric-img {
              width: 80px;
              height: 56px;
            }
            .waffle-grid {
              padding: 10px 10px 14px 10px;
              gap: 7px;
              max-height: 54vh;
              -webkit-overflow-scrolling: touch;
            }
            .waffle-card {
              padding: 9px 3px 7px 3px;
              border-radius: 12px;
            }
            .waffle-icon-wrap {
              width: 34px;
              height: 34px;
              border-radius: 10px;
              margin-bottom: 4px;
            }
            .waffle-icon-wrap svg {
              width: 18px;
              height: 18px;
            }
            .waffle-title {
              font-size: 11px;
            }
            .waffle-subtitle {
              font-size: 9px;
            }
          }
          @media (max-width: 360px) {
            .pydah-popover {
              left: 6px !important;
              right: 6px !important;
              max-width: calc(100vw - 12px) !important;
            }
            .waffle-grid {
              gap: 5px;
              padding: 6px;
            }
            .waffle-card {
              padding: 7px 2px 6px 2px;
            }
            .waffle-icon-wrap {
              width: 30px;
              height: 30px;
            }
            .waffle-icon-wrap svg {
              width: 16px;
              height: 16px;
            }
            .waffle-title {
              font-size: 10.5px;
            }
            .waffle-subtitle {
              font-size: 8.5px;
            }
          }
          @keyframes pydah-sheet-slide {
            from {
              opacity: 0;
              transform: translateY(28px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes pydah-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          /* Unified Workspace Transition Overlay - Light Professional Enterprise Theme */
          .pydah-transition-overlay {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
            visibility: visible;
            pointer-events: all;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .pydah-transition-overlay.is-fading {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
          .transition-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(248, 250, 252, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          .transition-modal {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 390px;
            width: 90%;
            padding: 34px 28px 26px;
            border-radius: 20px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04);
            text-align: center;
            animation: pydah-pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .transition-logo-badge-row {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
          }
          .transition-logo-frame {
            width: 68px;
            height: 68px;
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 14px -3px rgba(15, 23, 42, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 9px;
          }
          .transition-logo-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 10px;
          }
          .transition-target-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .target-chip-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #2563eb;
          }
          .transition-text-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
          .transition-heading {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.03em;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .transition-target-title {
            margin: 0 0 6px 0;
            font-size: 21px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            line-height: 1.25;
          }
          .transition-detail {
            margin: 0;
            font-size: 13.5px;
            color: #64748b;
            font-weight: 400;
            line-height: 1.5;
            max-width: 310px;
          }
          .transition-loader-bar {
            width: 100%;
            max-width: 230px;
            margin-bottom: 20px;
          }
          .transition-loader-track {
            width: 100%;
            height: 4px;
            border-radius: 9999px;
            background: #f1f5f9;
            overflow: hidden;
            position: relative;
          }
          .transition-loader-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 40%;
            border-radius: 9999px;
            background: #2563eb;
            animation: pydah-progress-indeterminate 1.4s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .transition-footer-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
          }
          .transition-footer-pill svg {
            stroke: #94a3b8;
          }
          @keyframes pydah-pop-in {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes pydah-progress-indeterminate {
            0% {
              left: -35%;
              width: 30%;
            }
            50% {
              left: 30%;
              width: 50%;
            }
            100% {
              left: 100%;
              width: 30%;
            }
          }
        </style>
        ${this.transitionState ? `
          <div class="pydah-transition-overlay ${this.transitionFading ? 'is-fading' : ''}" style="--portal-accent: #2563eb;">
            <div class="transition-backdrop"></div>
            <div class="transition-modal">
              <div class="transition-logo-badge-row">
                <div class="transition-logo-frame">
                  <img 
                    src="${crmLogoUrl}" 
                    alt="Pydah CRM" 
                    onerror="this.onerror=null; this.src='https://crm.pydah.edu.in/CRM-APP-logo.png';" 
                  />
                </div>
              </div>
              <div class="transition-target-chip">
                <span class="target-chip-dot"></span>
                <span>${this.transitionState.category || 'Pydah Workspace'}</span>
              </div>
              <div class="transition-text-content">
                <span class="transition-heading">${this.transitionState.heading || 'Switching workspace...'}</span>
                <h2 class="transition-target-title">${this.transitionState.title}</h2>
                <p class="transition-detail">${this.transitionState.detail || 'Authenticating session & verifying permissions...'}</p>
              </div>
              <div class="transition-loader-bar">
                <div class="transition-loader-track">
                  <div class="transition-loader-fill"></div>
                </div>
              </div>
              <div class="transition-footer-pill">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Single Sign-On (SSO) • Pydah Suite</span>
              </div>
            </div>
          </div>
        ` : ''}
        ${this.isOpen ? `
          <div class="pydah-backdrop" id="pydah-backdrop"></div>
        ` : ''}
        <div class="pydah-switcher-container">
          ${this.isOpen ? `
            <div class="pydah-popover" role="dialog" aria-label="Pydah Portal Switcher">
              <div class="mobile-handle"></div>
              
              <!-- Pictorial Banner Header -->
              <div class="popover-banner">
                <div class="banner-left">
                  <div class="banner-titles">
                    <a href="${this.landingUrl}" target="_blank" rel="noopener noreferrer" class="banner-title-link" title="Open Pydah Central CRM">
                      <span class="banner-title">Pydah Suite</span>
                      <svg class="banner-title-ext" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </a>
                    <span class="banner-subtitle">Your Campus, Unified</span>
                    ${this.user ? `
                      <div class="banner-user-chip">
                        <span class="banner-user-dot"></span>
                        <span class="banner-user-name">${userName}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                <div class="banner-right">
                  <!-- Isometric 3D Laptop & Books Illustration -->
                  <svg class="banner-isometric-img" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="65" cy="55" rx="42" ry="22" fill="#38bdf8" fill-opacity="0.22"/>
                    <ellipse cx="85" cy="38" rx="26" ry="16" fill="#818cf8" fill-opacity="0.25"/>
                    
                    <!-- Isometric Book Platform Base -->
                    <path d="M28 66 L68 82 L106 64 L66 48 Z" fill="#93c5fd" fill-opacity="0.45"/>
                    <path d="M28 66 L68 82 L68 87 L28 71 Z" fill="#3b82f6" fill-opacity="0.75"/>
                    <path d="M68 82 L106 64 L106 69 L68 87 Z" fill="#1d4ed8" fill-opacity="0.85"/>
                    
                    <!-- Isometric Laptop Base Layer -->
                    <path d="M34 58 L70 73 L102 58 L66 43 Z" fill="#ffffff"/>
                    <path d="M34 58 L70 73 L70 76 L34 61 Z" fill="#bfdbfe"/>
                    <path d="M70 73 L102 58 L102 61 L70 76 Z" fill="#60a5fa"/>

                    <!-- Isometric Laptop Screen Frame -->
                    <path d="M46 20 L86 35 L86 56 L46 41 Z" fill="#0f172a"/>
                    <!-- Screen display with gradient -->
                    <path d="M48 23 L84 36 L84 53 L48 40 Z" fill="url(#pydahWaffleScreen)"/>
                    
                    <!-- Floating mini dashboard cards on screen -->
                    <path d="M52 28 L64 32 L64 37 L52 33 Z" fill="#38bdf8" fill-opacity="0.9"/>
                    <path d="M67 33 L80 38 L80 44 L67 39 Z" fill="#a78bfa" fill-opacity="0.9"/>
                    <circle cx="56" cy="38.5" r="2" fill="#f43f5e"/>
                    <circle cx="62" cy="40.5" r="2" fill="#10b981"/>
                    <circle cx="68" cy="42.5" r="2" fill="#fbbf24"/>
                    
                    <defs>
                      <linearGradient id="pydahWaffleScreen" x1="48" y1="23" x2="84" y2="53" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#2563eb"/>
                        <stop offset="1" stop-color="#7c3aed"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <button class="btn-close" id="pydah-btn-close" title="Close" aria-label="Close portal switcher">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              ${this.errorMessage ? `
                <div class="error-banner">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>${this.errorMessage}</span>
                </div>
              ` : ''}

              <!-- Waffle Grid Body -->
              <div class="waffle-grid" id="pydah-portals-grid">
                <!-- Portals injected via renderPortalList -->
              </div>
            </div>
          ` : ''}
          <button class="pydah-fab ${this.isOpen ? 'is-open' : ''}" id="pydah-fab-btn" title="Pydah Portal Switcher (Drag to reposition)">
            <span class="fab-pulse"></span>
            <div class="pydah-fab-icon">
              ${this.isOpen ? `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ` : `
                <!-- 9-dot Google-style Waffle Launcher Icon -->
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="4.5" height="4.5" rx="1.2" />
                  <rect x="9.75" y="3" width="4.5" height="4.5" rx="1.2" />
                  <rect x="16.5" y="3" width="4.5" height="4.5" rx="1.2" />
                  <rect x="3" y="9.75" width="4.5" height="4.5" rx="1.2" />
                  <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1.2" />
                  <rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1.2" />
                  <rect x="3" y="16.5" width="4.5" height="4.5" rx="1.2" />
                  <rect x="9.75" y="16.5" width="4.5" height="4.5" rx="1.2" />
                  <rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1.2" />
                </svg>
              `}
            </div>
          </button>
        </div>
      `;

      // Event listeners
      const fab = this.shadowRoot.querySelector('#pydah-fab-btn');
      if (fab) fab.addEventListener('click', this.handleToggle);

      const closeBtn = this.shadowRoot.querySelector('#pydah-btn-close');
      if (closeBtn) closeBtn.addEventListener('click', this.handleClose);

      const backdrop = this.shadowRoot.querySelector('#pydah-backdrop');
      if (backdrop) backdrop.addEventListener('click', this.handleClose);

      this.setupDragging();
      if (this.isOpen) {
        this.renderPortalList();
      }
    }
  }

  // Register Custom Element
  if (!customElements.get('pydah-portal-switcher')) {
    customElements.define('pydah-portal-switcher', PydahPortalSwitcherComponent);
  }

  // 4. Standalone In-Place SSO Loader Web Component
  class PydahSsoLoaderComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
    }

    static get observedAttributes() {
      return ['portal', 'title', 'heading', 'detail'];
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      let portalAttr = this.getAttribute('portal') || scriptConfig.currentPortal || document.querySelector('pydah-portal-switcher')?.getAttribute('current-portal');
      if (!portalAttr) {
        const host = window.location.hostname.toLowerCase();
        if (host.includes('fee')) portalAttr = 'fee-management';
        else if (host.includes('sdms') || host.includes('student')) portalAttr = 'student-portal';
        else if (host.includes('admissions') || host.includes('adm')) portalAttr = 'admissions-crm';
        else if (host.includes('hrms')) portalAttr = 'hrms';
        else if (host.includes('ems') || host.includes('exam')) portalAttr = 'examination-portal';
        else if (host.includes('acad')) portalAttr = 'academic-portal';
        else if (host.includes('transport')) portalAttr = 'transport-management';
        else if (host.includes('hms') || host.includes('hostel')) portalAttr = 'hostel-automation';
        else if (host.includes('station')) portalAttr = 'stationary-management';
        else if (host.includes('srs') || host.includes('recruit')) portalAttr = 'staff-recruitment';
        else if (host.includes('sams') || host.includes('labour')) portalAttr = 'sams';
      }

      const portalMeta = PORTAL_REGISTRY.find(p => p.id === portalAttr) || {
        title: portalAttr ? portalAttr.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Workspace',
        color: '#059669',
        category: 'Pydah Workspace'
      };

      const title = this.getAttribute('title') || portalMeta.title;
      const category = portalMeta.category || 'Pydah Workspace';
      const color = portalMeta.color || '#059669';
      const heading = this.getAttribute('heading') || 'Switching workspace...';
      const detail = this.getAttribute('detail') || 'Authenticating session & verifying permissions...';
      const crmLogoUrl = (this.getAttribute('api-base-url') || scriptConfig.landingUrl || 'https://crm.pydah.edu.in').replace(/\/$/, '') + '/CRM-APP-logo.png';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            pointer-events: all;
            --portal-accent: #2563eb;
          }
          .transition-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(248, 250, 252, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          .transition-modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 390px;
            width: 90%;
            padding: 34px 28px 26px;
            border-radius: 20px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04);
            text-align: center;
            animation: pydah-pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .transition-logo-badge-row {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
          }
          .transition-logo-frame {
            width: 68px;
            height: 68px;
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 14px -3px rgba(15, 23, 42, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 9px;
          }
          .transition-logo-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 10px;
          }
          .transition-target-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .target-chip-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #2563eb;
          }
          .transition-text-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
          .transition-heading {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.03em;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .transition-target-title {
            margin: 0 0 6px 0;
            font-size: 21px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            line-height: 1.25;
          }
          .transition-detail {
            margin: 0;
            font-size: 13.5px;
            color: #64748b;
            font-weight: 400;
            line-height: 1.5;
            max-width: 310px;
          }
          .transition-loader-bar {
            width: 100%;
            max-width: 230px;
            margin-bottom: 20px;
          }
          .transition-loader-track {
            width: 100%;
            height: 4px;
            border-radius: 9999px;
            background: #f1f5f9;
            overflow: hidden;
            position: relative;
          }
          .transition-loader-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 40%;
            border-radius: 9999px;
            background: #2563eb;
            animation: pydah-progress-indeterminate 1.4s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .transition-footer-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
          }
          .transition-footer-pill svg {
            stroke: #94a3b8;
          }
          @keyframes pydah-pop-in {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes pydah-progress-indeterminate {
            0% {
              left: -35%;
              width: 30%;
            }
            50% {
              left: 30%;
              width: 50%;
            }
            100% {
              left: 100%;
              width: 30%;
            }
          }
        </style>
        <div class="transition-backdrop"></div>
        <div class="transition-modal">
          <div class="transition-logo-badge-row">
            <div class="transition-logo-frame">
              <img 
                src="${crmLogoUrl}" 
                alt="Pydah CRM" 
                onerror="this.onerror=null; this.src='https://crm.pydah.edu.in/CRM-APP-logo.png';" 
              />
            </div>
          </div>
          <div class="transition-target-chip">
            <span class="target-chip-dot"></span>
            <span>${category}</span>
          </div>
          <div class="transition-text-content">
            <span class="transition-heading">${heading}</span>
            <h2 class="transition-target-title">${title}</h2>
            <p class="transition-detail">${detail}</p>
          </div>
          <div class="transition-loader-bar">
            <div class="transition-loader-track">
              <div class="transition-loader-fill"></div>
            </div>
          </div>
          <div class="transition-footer-pill">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Single Sign-On (SSO) • Pydah Suite</span>
          </div>
        </div>
      `;
    }
  }

  if (!customElements.get('pydah-sso-loader')) {
    customElements.define('pydah-sso-loader', PydahSsoLoaderComponent);
  }

  // Auto-mount element into document
  function mountSwitcher() {
    if (document.querySelector('pydah-portal-switcher')) return;
    const el = document.createElement('pydah-portal-switcher');
    if (scriptConfig.currentPortal) {
      el.setAttribute('current-portal', scriptConfig.currentPortal);
    }
    if (scriptConfig.apiBaseUrl) {
      el.setAttribute('api-base-url', scriptConfig.apiBaseUrl);
    }
    if (scriptConfig.position) {
      el.setAttribute('position', scriptConfig.position);
    }
    document.body.appendChild(el);
    return el;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSwitcher);
  } else {
    mountSwitcher();
  }

  // Global Developer API
  window.PydahPortalSwitcher = {
    init: function (config = {}) {
      let el = document.querySelector('pydah-portal-switcher');
      if (!el) el = mountSwitcher();
      if (el) {
        el.setSession({
          token: config.token,
          user: config.user,
          currentPortal: config.currentPortal || config.portalId
        });
        if (config.apiBaseUrl) el.setAttribute('api-base-url', config.apiBaseUrl);
      }
      return el;
    },
    open: function () {
      const el = document.querySelector('pydah-portal-switcher');
      if (el) el.open();
    },
    close: function () {
      const el = document.querySelector('pydah-portal-switcher');
      if (el) el.close();
    },
    toggle: function () {
      const el = document.querySelector('pydah-portal-switcher');
      if (el) el.toggle();
    },
    setSession: function (session) {
      const el = document.querySelector('pydah-portal-switcher');
      if (el) el.setSession(session);
    },
    showTransition: function (config) {
      const el = document.querySelector('pydah-portal-switcher');
      if (el && el.showTransition) el.showTransition(config);
    },
    hideTransition: function () {
      const el = document.querySelector('pydah-portal-switcher');
      if (el && el.hideTransition) el.hideTransition();
    },
    dismissTransition: function () {
      const el = document.querySelector('pydah-portal-switcher');
      if (el && el.hideTransition) el.hideTransition();
    }
  };

  window.PydahSwitcher = window.PydahPortalSwitcher;
})();
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

  // 1. Master Portal Registry with official URLs & branding
  const PORTAL_REGISTRY = [
    {
      id: 'academic-portal',
      title: 'Academic Portal',
      category: 'Academics & Faculty',
      description: 'Course curriculum, syllabus schedules, faculty workloads, and timetable.',
      color: '#0d9488',
      url: 'https://acad.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
    },
    {
      id: 'admissions-crm',
      title: 'Admission Portal',
      category: 'Enrollment Management',
      description: 'Student inquiry pipeline, counselor workflows, and institutional admissions.',
      color: '#0284c7',
      url: 'https://admissions.pydah.edu.in/auth/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
    },
    {
      id: 'examination-portal',
      title: 'Examination System',
      category: 'Exams & Assessment',
      description: 'Exam scheduling, hall tickets, marks evaluation, and result processing.',
      color: '#ea580c',
      url: 'https://ems.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
    },
    {
      id: 'fee-management',
      title: 'Fee Management',
      category: 'Financial Operations',
      description: 'Tuition collection, pending balances, invoice records, and reconciliation.',
      color: '#059669',
      url: 'https://fees.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`
    },
    {
      id: 'hostel-automation',
      title: 'Hostel Automation',
      category: 'Facility Management',
      description: 'Campus room allotments, warden logs, hostel passes, and mess management.',
      color: '#db2777',
      url: 'https://hms.pydahsoft.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
      id: 'hrms',
      title: 'HRMS & Payroll',
      category: 'Staff Operations',
      description: 'Staff directory, biometric attendance, salary payroll, and leave management.',
      color: '#7c3aed',
      url: 'https://hrms.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    },
    {
      id: 'student-portal',
      title: 'Student Portal',
      category: 'Learning & Academics',
      description: 'Central student profile, academic records, digital schedules, and updates.',
      color: '#2563eb',
      url: 'https://sdms.pydah.edu.in/student/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
    },
    {
      id: 'transport-management',
      title: 'Transport Management',
      category: 'Logistics Hub',
      description: 'Fleet vehicle tracking, bus transit routes, stops, and driver schedules.',
      color: '#d97706',
      url: 'https://transport.pydah.edu.in/login',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/></svg>`
    }
  ];

  // 2. Default Configuration
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const scriptConfig = {
    currentPortal: currentScript?.getAttribute('data-current-portal') || null,
    apiBaseUrl: currentScript?.getAttribute('data-api-base-url') || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://pydah-crm-backend.pydah.edu.in'),
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

    // 1. Check URL query params for pydah_portals (from CRM launcher or cross-portal redirect)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const portalsParam = urlParams.get('pydah_portals');
      if (portalsParam) {
        const list = JSON.parse(atob(portalsParam));
        if (Array.isArray(list) && list.length > 0) {
          portals = list;
          localStorage.setItem('pydah_authorized_portals', JSON.stringify(list));
        }
      }
    } catch (_) {}

    // 2. Check localStorage for cached pydah_authorized_portals
    if (!portals) {
      try {
        const cached = localStorage.getItem('pydah_authorized_portals');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            portals = list;
          }
        }
      } catch (_) {}
    }

    // 3. Check common token storage keys
    const tokenKeys = ['accessToken', 'token', 'jwt', 'authToken', 'crmAccessToken', 'auth_token'];
    for (const key of tokenKeys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val && typeof val === 'string' && val.length > 20) {
        token = val;
        break;
      }
    }

    // 4. Check common user storage keys
    const userKeys = ['user', 'currentUser', 'studentUser', 'auth_user', 'profile'];
    for (const key of userKeys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val) {
        try {
          user = JSON.parse(val);
          break;
        } catch (_) {}
      }
    }

    // 5. If token exists, supplement user info from decoded JWT payload
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        user = {
          id: decoded.userId || decoded.id || decoded._id || user?.id,
          username: decoded.username || decoded.name || user?.username,
          name: decoded.name || user?.name || decoded.username,
          email: decoded.email || user?.email,
          role: decoded.role || user?.role || 'user',
          portals: decoded.portals || user?.portals || portals || [],
          employeeId: decoded.employeeId || user?.employeeId,
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
      this.searchQuery = '';
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

      // Bound methods
      this.handleToggle = this.handleToggle.bind(this);
      this.handleClose = this.handleClose.bind(this);
      this.handleSearch = this.handleSearch.bind(this);
      this.handlePortalClick = this.handlePortalClick.bind(this);
      this.handleDocumentClick = this.handleDocumentClick.bind(this);
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
      this.render();
      this.setupDragging();
      this.fetchUserPortals();
      document.addEventListener('click', this.handleDocumentClick);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.handleDocumentClick);
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
      // Close if clicked outside the shadow root
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
      this.searchQuery = '';
      this.render();
      // Auto-focus search input
      setTimeout(() => {
        const input = this.shadowRoot.querySelector('#pydah-search-input');
        if (input) input.focus();
      }, 100);
    }

    close() {
      this.isOpen = false;
      this.errorMessage = null;
      this.searchQuery = '';
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

    handleSearch(e) {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderPortalList();
    }

    async handlePortalClick(portal) {
      if (portal.id === this.currentPortal) return;
      if (this.switchingPortalId) return;

      this.switchingPortalId = portal.id;
      this.errorMessage = null;
      this.render();

      try {
        // Refresh session detection right before switching
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
          // Seamless redirect to target portal with generated SSO token and portals package
          const redirectObj = new URL(data.data.redirectUrl);
          const currentPortals = this.authorizedPortals || (Array.isArray(this.user?.portals) ? this.user.portals : null);
          if (Array.isArray(currentPortals) && currentPortals.length > 0) {
            try {
              redirectObj.searchParams.set('pydah_portals', btoa(JSON.stringify(currentPortals)));
            } catch (_) {}
          }
          redirectObj.searchParams.set('sso_switch', '1');
          window.location.href = redirectObj.toString();
          return;
        }

        // Direct fallback: if backend request fails but target portal URL is known
        throw new Error(data.message || 'Unable to generate single sign-on token for portal.');
      } catch (err) {
        console.error('[PydahSwitcher] Portal switch error:', err);
        this.errorMessage = err.message || 'Failed to switch portal. Please try again.';
      } finally {
        this.switchingPortalId = null;
        this.render();
      }
    }

    setupDragging() {
      const btn = this.shadowRoot.querySelector('#pydah-fab-btn');
      if (!btn) return;

      const container = this.shadowRoot.querySelector('.pydah-switcher-container');

      // Load saved position
      const savedPos = localStorage.getItem('pydah_switcher_pos');
      if (savedPos) {
        try {
          const { x, y } = JSON.parse(savedPos);
          container.style.right = 'auto';
          container.style.bottom = 'auto';
          container.style.left = `${x}px`;
          container.style.top = `${y}px`;
        } catch (_) {}
      }

      const onMouseDown = (e) => {
        if (e.button !== 0) return; // Primary click only
        this.isDragging = true;
        this.dragMoved = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        const rect = container.getBoundingClientRect();
        this.initialX = rect.left;
        this.initialY = rect.top;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          this.dragMoved = true;
          const newX = Math.max(10, Math.min(window.innerWidth - 60, this.initialX + dx));
          const newY = Math.max(10, Math.min(window.innerHeight - 60, this.initialY + dy));
          container.style.right = 'auto';
          container.style.bottom = 'auto';
          container.style.left = `${newX}px`;
          container.style.top = `${newY}px`;
        }
      };

      const onMouseUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (this.dragMoved) {
          const rect = container.getBoundingClientRect();
          localStorage.setItem('pydah_switcher_pos', JSON.stringify({
            x: Math.round(rect.left),
            y: Math.round(rect.top)
          }));
        }
      };

      btn.addEventListener('mousedown', onMouseDown);
    }

    async fetchUserPortals() {
      if (this.isLoadingPortals) return;
      try {
        this.isLoadingPortals = true;
        const latestSession = detectHostSession();
        const activeToken = this.token || latestSession.token;
        const activeUser = this.user || latestSession.user;

        // 1. If portals were passed via URL or already cached in storage
        if (latestSession.portals && latestSession.portals.length > 0) {
          this.authorizedPortals = latestSession.portals;
          console.log('[PydahSwitcher] Portals loaded from session/URL:', this.authorizedPortals);
          this.isLoadingPortals = false;
          this.renderPortalList();
          return;
        }

        // 2. If user already has portals in their session
        if (activeUser && Array.isArray(activeUser.portals) && activeUser.portals.length > 0) {
          this.authorizedPortals = activeUser.portals;
          console.log('[PydahSwitcher] Portals loaded from user object:', this.authorizedPortals);
          this.isLoadingPortals = false;
          this.renderPortalList();
          return;
        }

        if (!activeToken && !activeUser) {
          this.authorizedPortals = this.currentPortal ? [this.currentPortal] : [];
          this.isLoadingPortals = false;
          this.renderPortalList();
          return;
        }

        // 3. Query the CRM Auth Gateway
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
          // If on localhost and 8000 failed, try port 3000
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

      const isSuperAdmin = ['super_admin', 'superadmin'].includes((this.user?.role || '').toLowerCase());
      if (!isSuperAdmin) {
        const allowed = this.authorizedPortals || (Array.isArray(this.user?.portals) ? this.user.portals : null);
        if (allowed && allowed.length > 0) {
          list = list.filter(p => allowed.includes(p.id) || p.id === this.currentPortal);
        } else if (this.currentPortal) {
          list = list.filter(p => p.id === this.currentPortal);
        }
      }

      if (!this.searchQuery) return list;

      return list.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery)
      );
    }

    renderPortalList() {
      const grid = this.shadowRoot.querySelector('#pydah-portals-grid');
      if (!grid) return;

      if (this.isLoadingPortals && !this.authorizedPortals) {
        grid.innerHTML = `
          <div class="empty-state" style="padding: 30px 10px;">
            <div class="spinner-sm" style="width: 20px; height: 20px; margin-bottom: 8px;"></div>
            <p style="font-size: 11px; color: #64748b;">Checking accessible portals...</p>
          </div>
        `;
        return;
      }

      const filtered = this.getFilteredPortals();

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>No portals matching "${this.searchQuery}"</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(portal => {
        const isCurrent = portal.id === this.currentPortal;
        const isSwitching = portal.id === this.switchingPortalId;

        return `
          <div class="portal-card ${isCurrent ? 'is-current' : ''} ${isSwitching ? 'is-loading' : ''}" data-portal-id="${portal.id}">
            <div class="portal-icon-wrap" style="background-color: ${portal.color}15; color: ${portal.color}">
              ${portal.icon}
            </div>
            <div class="portal-info">
              <div class="portal-title-row">
                <span class="portal-title">${portal.title}</span>
                ${isCurrent ? `<span class="badge-current">Active</span>` : ''}
              </div>
              <span class="portal-cat">${portal.category}</span>
            </div>
            ${isCurrent ? `
              <div class="current-indicator">
                <span class="dot"></span>
              </div>
            ` : isSwitching ? `
              <div class="spinner-sm"></div>
            ` : `
              <div class="switch-arrow">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            `}
          </div>
        `;
      }).join('');

      // Add click listeners to cards
      grid.querySelectorAll('.portal-card:not(.is-current)').forEach(card => {
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
      const userPhoto = this.user?.profilePhoto;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            all: initial;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
            z-index: 9999999;
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
          }

          /* Floating Action Button */
          .pydah-fab {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.85);
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.5), 0 8px 10px -6px rgba(79, 70, 229, 0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
            position: relative;
            outline: none;
          }

          .pydah-fab:hover {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 16px 30px -4px rgba(79, 70, 229, 0.6), 0 10px 12px -5px rgba(79, 70, 229, 0.4);
          }

          .pydah-fab:active {
            transform: scale(0.96);
          }

          .pydah-fab-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
          }

          .pydah-fab-icon svg {
            width: 100%;
            height: 100%;
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

          /* Popover Flyout Panel */
          .pydah-popover {
            position: absolute;
            bottom: 64px;
            right: 0;
            width: 360px;
            max-width: calc(100vw - 32px);
            max-height: 580px;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: popover-slide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transform-origin: bottom right;
          }

          @keyframes popover-slide {
            from {
              opacity: 0;
              transform: scale(0.92) translateY(12px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          /* Popover Header */
          .popover-header {
            padding: 16px 18px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand-logo-circle {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: #4f46e5;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
          }

          .brand-text h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
          }

          .brand-text span {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          }

          .btn-close {
            background: transparent;
            border: none;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
          }

          .btn-close:hover {
            background: #e2e8f0;
            color: #0f172a;
          }

          /* User Bar */
          .user-bar {
            padding: 10px 18px;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .user-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .user-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #e0e7ff;
            color: #4338ca;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 12px;
            flex-shrink: 0;
            overflow: hidden;
          }

          .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .user-details {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .user-details .name {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .role-tag {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #6366f1;
            background: #eef2ff;
            padding: 1px 6px;
            border-radius: 4px;
            display: inline-block;
            align-self: flex-start;
            margin-top: 2px;
          }

          /* Search Input */
          .search-wrap {
            padding: 10px 18px 8px 18px;
          }

          .search-box {
            position: relative;
            display: flex;
            align-items: center;
          }

          .search-box svg {
            position: absolute;
            left: 10px;
            color: #94a3b8;
            pointer-events: none;
          }

          .search-box input {
            width: 100%;
            padding: 8px 12px 8px 32px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            font-size: 12px;
            color: #1e293b;
            outline: none;
            transition: all 0.2s;
          }

          .search-box input:focus {
            border-color: #6366f1;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          }

          /* Portals Grid / List */
          .portals-list-wrap {
            flex: 1;
            overflow-y: auto;
            padding: 6px 14px 14px 14px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .portals-list-wrap::-webkit-scrollbar {
            width: 5px;
          }
          .portals-list-wrap::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          .portal-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 12px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #f1f5f9;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
          }

          .portal-card:hover:not(.is-current) {
            background: #f8fafc;
            border-color: #cbd5e1;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
          }

          .portal-card.is-current {
            background: #f0fdf4;
            border-color: #bbf7d0;
            cursor: default;
          }

          .portal-card.is-loading {
            opacity: 0.7;
            pointer-events: none;
          }

          .portal-icon-wrap {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .portal-icon-wrap svg {
            width: 20px;
            height: 20px;
          }

          .portal-info {
            flex: 1;
            min-width: 0;
          }

          .portal-title-row {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .portal-title {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .badge-current {
            font-size: 9px;
            font-weight: 700;
            color: #166534;
            background: #dcfce7;
            padding: 2px 5px;
            border-radius: 4px;
            text-transform: uppercase;
          }

          .portal-cat {
            display: block;
            font-size: 11px;
            color: #64748b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .switch-arrow {
            color: #94a3b8;
            transition: transform 0.2s, color 0.2s;
          }

          .portal-card:hover .switch-arrow {
            color: #4f46e5;
            transform: translate(2px, -2px);
          }

          .current-indicator .dot {
            display: block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          }

          /* Error banner */
          .error-banner {
            margin: 6px 14px;
            padding: 8px 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            border-radius: 8px;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          /* Footer */
          .popover-footer {
            padding: 10px 18px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .hub-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #4f46e5;
            text-decoration: none;
            cursor: pointer;
            transition: color 0.2s;
          }

          .hub-link:hover {
            color: #3730a3;
            text-decoration: underline;
          }

          .version-tag {
            font-size: 10px;
            color: #94a3b8;
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
        </style>

        <div class="pydah-switcher-container">
          ${this.isOpen ? `
            <div class="pydah-popover" role="dialog" aria-label="Pydah Portal Switcher">
              <div class="popover-header">
                <div class="header-brand">
                  <div class="brand-logo-circle">P</div>
                  <div class="brand-text">
                    <h3>Pydah Suite</h3>
                    <span>Quick Portal Switcher</span>
                  </div>
                </div>
                <button class="btn-close" id="pydah-btn-close" title="Close">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div class="user-bar">
                <div class="user-meta">
                  <div class="user-avatar">
                    ${userPhoto ? `<img src="${userPhoto}" alt="${userName}">` : userName.charAt(0).toUpperCase()}
                  </div>
                  <div class="user-details">
                    <span class="name" title="${userName}">${userName}</span>
                    <span class="role-tag">${userRole}</span>
                  </div>
                </div>
              </div>

              ${this.errorMessage ? `
                <div class="error-banner">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>${this.errorMessage}</span>
                </div>
              ` : ''}

              <div class="search-wrap">
                <div class="search-box">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" id="pydah-search-input" placeholder="Search portals..." value="${this.searchQuery}" />
                </div>
              </div>

              <div class="portals-list-wrap" id="pydah-portals-grid">
                <!-- Portals injected via renderPortalList -->
              </div>

              <div class="popover-footer">
                <a class="hub-link" href="${this.landingUrl}" target="_blank" rel="noopener noreferrer">
                  <span>Go to Central Hub</span>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
                <span class="version-tag">Pydah SSO v1.0</span>
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
                <!-- 9-dot launcher / App grid icon -->
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="5" r="2.2" />
                  <circle cx="12" cy="5" r="2.2" />
                  <circle cx="19" cy="5" r="2.2" />
                  <circle cx="5" cy="12" r="2.2" />
                  <circle cx="12" cy="12" r="2.2" />
                  <circle cx="19" cy="12" r="2.2" />
                  <circle cx="5" cy="19" r="2.2" />
                  <circle cx="12" cy="19" r="2.2" />
                  <circle cx="19" cy="19" r="2.2" />
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

      const searchInput = this.shadowRoot.querySelector('#pydah-search-input');
      if (searchInput) searchInput.addEventListener('input', this.handleSearch);

      if (this.isOpen) {
        this.renderPortalList();
      }
    }
  }

  // Register Custom Element
  if (!customElements.get('pydah-portal-switcher')) {
    customElements.define('pydah-portal-switcher', PydahPortalSwitcherComponent);
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
    }
  };

  window.PydahSwitcher = window.PydahPortalSwitcher;
})();

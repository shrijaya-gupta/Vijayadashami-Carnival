/**
 * Vijayadashami Carnival — Secure Admin Dashboard Controller
 * Phase 6 Organizer Management System
 */

const API_BASE_URL = window.API_BASE_URL || (
  window.location.protocol === 'file:'
    ? 'http://localhost:5000'
    : (
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
        (window.location.port === '3000' || window.location.port === '5500' || window.location.port === '8080')
          ? 'http://localhost:5000'
          : ''
      )
);

// State Management
let currentAdmin = null;
let csrfToken = null;
let currentView = 'overview';

function getCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)srmu_csrf=([^;]+)/);
    if (cookieMatch) {
      csrfToken = decodeURIComponent(cookieMatch[1]);
      return csrfToken;
    }
  } catch (e) {}
  const sessionStored = sessionStorage.getItem('srmu_csrf_token');
  if (sessionStored) {
    csrfToken = sessionStored;
    return csrfToken;
  }
  return '';
}

/**
 * Resilient Admin API fetch wrapper with automated CSRF management and retry
 */
async function adminApiFetch(url, options = {}) {
  const opts = { ...options };
  opts.credentials = 'include';
  opts.headers = { ...(opts.headers || {}) };

  let token = (typeof getCsrfToken === 'function' ? getCsrfToken() : '') || csrfToken || sessionStorage.getItem('srmu_csrf_token') || '';
  if (token && !opts.headers['X-CSRF-Token']) {
    opts.headers['X-CSRF-Token'] = token;
  }

  let res = await fetch(url, opts);

  // If 403 (CSRF desync or expired), auto-refresh once via /api/admin/me and retry
  if (res.status === 403) {
    try {
      const meRes = await fetch(`${API_BASE_URL}/api/admin/me`, { credentials: 'include' });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData && meData.csrfToken) {
          csrfToken = meData.csrfToken;
          sessionStorage.setItem('srmu_csrf_token', meData.csrfToken);
          opts.headers['X-CSRF-Token'] = meData.csrfToken;
          res = await fetch(url, opts);
        }
      }
    } catch (e) {
      console.warn('Auto CSRF refresh failed:', e);
    }
  }

  return res;
}

// Registrations Table State
let regPageState = {
  page: 1,
  limit: 10,
  totalPages: 1,
  total: 0,
  search: '',
  game: 'all',
  format: '',
  status: '',
  paymentStatus: ''
};

// Payment Audit Table State (Phase 5)
let payPageState = {
  page: 1,
  limit: 10,
  totalPages: 1,
  total: 0,
  search: '',
  paymentStatus: 'payment_verification_pending',
  game: 'all'
};

// Certificates Table State (Phase 7)
let certPageState = {
  page: 1,
  limit: 10,
  totalPages: 1,
  total: 0,
  search: '',
  participationStatus: '',
  game: 'all'
};

// Selected game in Gamewise tab
let activeGameId = 'lemon-race';
let activeRegistrationInModal = null;

// Request Sequence IDs to prevent race conditions and out-of-order renders
let regRequestSeq = 0;
let payRequestSeq = 0;
let certRequestSeq = 0;
let gamewiseRequestSeq = 0;
let gamewiseScoresSeq = 0;

// Expose switchView immediately so inline onclick and click handlers never fail
window.switchView = switchView;

// Run navigation listeners immediately so all tabs, sidebars, and buttons work right away
try {
  initNavigation();
} catch (e) {
  // Suppress early initialization errors if DOM is still parsing
}

async function bootDashboardApp() {
  initNavigation();
  const isAuthed = await checkSession();
  if (!isAuthed) return;

  initOverview();
  initRegistrationsTable();
  initPaymentsTable();
  initPaymentQrConfig();
  initCertificatesTable();
  initGamewiseRoster();
  initExportSection();
  initModalActions();
  initScanner();
  initGamesManagement();

  // Real-Time live auto-refresh every 10s for on-ground festival desk (silent background sync)
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      refreshCurrentView(true);
    }
  }, 10000);

  // Instant real-time listener: updates views immediately when a student registers in any tab
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const syncChannel = new BroadcastChannel('srmu_carnival_sync');
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'NEW_REGISTRATION') {
          console.log('[REAL-TIME SYNC] New registration received:', event.data.registrationId);
          refreshCurrentView(true);
          if (typeof showToast === 'function') {
            showToast(`⚡ New pass booked: ${event.data.registrationId} (${event.data.studentName || 'Student'})`);
          }
        }
      };
    }
  } catch (e) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootDashboardApp);
} else {
  bootDashboardApp();
}

// ============================================================================
// 1. SESSION MANAGEMENT & LOGOUT
// ============================================================================

async function checkSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      window.location.replace('login.html');
      return false;
    }

    const data = await res.json();
    if (!data.authenticated) {
      window.location.replace('login.html');
      return false;
    }

    currentAdmin = data.admin;
    csrfToken = data.csrfToken || sessionStorage.getItem('srmu_csrf_token');
    if (data.csrfToken) {
      sessionStorage.setItem('srmu_csrf_token', data.csrfToken);
    }

    // Update UI identity elements
    const nameEl = document.getElementById('sidebarAdminName');
    const roleEl = document.getElementById('sidebarAdminRole');
    const avatarEl = document.getElementById('sidebarAvatar');

    if (nameEl) nameEl.textContent = currentAdmin.fullName || currentAdmin.username;
    if (roleEl) roleEl.textContent = (currentAdmin.role || 'Organizer').toUpperCase();
    if (avatarEl) avatarEl.textContent = (currentAdmin.username || 'A').charAt(0).toUpperCase();

    return true;
  } catch (err) {
    console.error('Session check failed:', err);
    window.location.replace('login.html');
    return false;
  }
}

async function handleLogout() {
  try {
    await adminApiFetch(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.warn('Logout network error:', err);
  } finally {
    sessionStorage.removeItem('srmu_csrf_token');
    sessionStorage.removeItem('srmu_admin_user');
    csrfToken = null;
    window.location.replace('login.html');
  }
}

// ============================================================================
// 2. NAVIGATION & VIEW SWITCHING
// ============================================================================

function initNavigation() {
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileClose = document.getElementById('mobileSidebarClose');
  const logoutBtn = document.getElementById('btnLogoutSidebar');
  const refreshBtn = document.getElementById('btnRefreshData');

  const closeSidebarMobile = () => {
    sidebar?.classList.remove('mobile-open');
    backdrop?.classList.remove('active');
  };

  // 1. Sidebar Nav items
  document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const view = btn.dataset.view;
      if (view) {
        switchView(view);
        if (window.innerWidth <= 1024) closeSidebarMobile();
      }
    };
  });

  logoutBtn?.addEventListener('click', handleLogout);

  mobileToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = sidebar?.classList.toggle('mobile-open');
    if (isOpen) {
      backdrop?.classList.add('active');
    } else {
      backdrop?.classList.remove('active');
    }
  });

  mobileClose?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSidebarMobile();
  });
  backdrop?.addEventListener('click', closeSidebarMobile);

  // 2. Mobile Bottom Nav bar with delegated clicks
  const bottomNav = document.getElementById('mobileBottomNav');
  if (bottomNav) {
    bottomNav.onclick = (e) => {
      const btn = e.target.closest('.bottom-nav-item[data-view]');
      if (!btn) return;
      e.preventDefault();
      const view = btn.dataset.view;
      if (view) {
        switchView(view);
        closeSidebarMobile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
  }

  // Individual button listeners as extra failsafe
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const view = btn.dataset.view;
      if (view) {
        switchView(view);
        closeSidebarMobile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
  });

  // 3. Global delegated fallback for any navigation element with data-view
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-view]');
    if (navBtn && (navBtn.classList.contains('sidebar-nav-item') || navBtn.classList.contains('bottom-nav-item'))) {
      const view = navBtn.dataset.view;
      if (view) {
        switchView(view);
        if (navBtn.classList.contains('bottom-nav-item')) {
          closeSidebarMobile();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (window.innerWidth <= 1024) {
          closeSidebarMobile();
        }
      }
    }
  });

  // Topbar & Quick Action Hub shortcuts
  const quickScanBtn = document.getElementById('btnQuickScanPass');
  quickScanBtn?.addEventListener('click', () => switchView('scanner'));

  document.getElementById('btnQuickHubScan')?.addEventListener('click', () => switchView('scanner'));
  document.getElementById('btnQuickHubPayments')?.addEventListener('click', () => switchView('payments'));
  document.getElementById('btnQuickHubRegistrations')?.addEventListener('click', () => switchView('registrations'));
  document.getElementById('btnQuickHubGamewise')?.addEventListener('click', () => switchView('gamewise'));

  refreshBtn?.addEventListener('click', () => {
    refreshCurrentView(true);
    showToast('Dashboard data refreshed.');
  });
}

function switchView(viewName) {
  if (!viewName) return;
  if (viewName === 'certificates') {
    switchView('overview');
    return;
  }

  // If leaving scanner view, stop camera stream to save resources
  if (currentView === 'scanner' && viewName !== 'scanner') {
    if (typeof stopCameraScanner === 'function') {
      try { stopCameraScanner(); } catch (e) {}
    }
  }

  currentView = viewName;

  // Auto-close mobile sidebar drawer if open
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar?.classList.remove('mobile-open', 'sidebar-open', 'active');
  backdrop?.classList.remove('active');

  // Update sidebar nav buttons
  document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update mobile bottom nav buttons
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update view sections
  const viewMap = {
    overview: 'viewOverview',
    registrations: 'viewRegistrations',
    scanner: 'viewScanner',
    gamewise: 'viewGamewise',
    gamesmanage: 'viewGamesManage',
    payments: 'viewPayments',
    certificates: 'viewCertificates',
    export: 'viewExport'
  };

  const titleMap = {
    overview: 'Overview',
    registrations: 'All Registrations',
    scanner: 'QR Pass Scanner',
    gamewise: 'Game Rosters',
    gamesmanage: 'Games Catalogue',
    payments: 'Payment Desk',
    certificates: 'Certificates & Attendance',
    export: 'Data Export'
  };

  document.querySelectorAll('.dashboard-view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const activeSecId = viewMap[viewName];
  const activeSec = activeSecId ? document.getElementById(activeSecId) : null;
  if (activeSec) {
    activeSec.classList.add('active');
  }

  const topbarTitle = document.getElementById('topbarPageTitle');
  if (topbarTitle) {
    topbarTitle.textContent = titleMap[viewName] || 'Dashboard';
  }

  // Load view data safely wrapped in try/catch
  try {
    if (viewName === 'overview') {
      loadOverviewData();
    } else if (viewName === 'registrations') {
      loadRegistrationsData();
    } else if (viewName === 'payments') {
      loadPaymentsData();
    } else if (viewName === 'certificates') {
      loadCertificatesData();
    } else if (viewName === 'gamewise') {
      loadGamewiseData(activeGameId);
    } else if (viewName === 'gamesmanage') {
      loadAdminGamesData();
    } else if (viewName === 'scanner') {
      const manualInput = document.getElementById('manualPassIdInput');
      manualInput?.focus();
    }
  } catch (err) {
    console.error('Error loading view data for', viewName, err);
  }
}
window.switchView = switchView;

function refreshCurrentView(isSilent = false) {
  if (currentView === 'overview') loadOverviewData(isSilent);
  else if (currentView === 'registrations') loadRegistrationsData(isSilent);
  else if (currentView === 'payments') loadPaymentsData(isSilent);
  else if (currentView === 'gamesmanage') loadAdminGamesData(isSilent);
  else if (currentView === 'certificates') loadCertificatesData(isSilent);
  else if (currentView === 'gamewise') loadGamewiseData(activeGameId, isSilent);
}

// ============================================================================
// 3. OVERVIEW VIEW HANDLERS
// ============================================================================

function initOverview() {
  loadOverviewData();
}

async function loadOverviewData(isSilent = false) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      credentials: 'include'
    });

    function setOverviewErrorState() {
      if (isSilent) return;
      const revEl = document.getElementById('metricTotalRevenueDisplay');
      if (revEl) revEl.textContent = 'Error';
      const potEl = document.getElementById('metricPotentialRevenueDisplay');
      if (potEl) potEl.textContent = 'Error';
      const regEl = document.getElementById('metricTotalRegistrations');
      if (regEl) regEl.textContent = '—';
      const audEl = document.getElementById('metricPendingAuditsDisplay');
      if (audEl) audEl.textContent = '—';
    }

    if (!res.ok) {
      if (res.status === 401) {
        checkSession();
      } else {
        setOverviewErrorState();
        if (!isSilent) showToast('Error loading overview statistics from server.');
      }
      return;
    }

    const { data } = await res.json();
    if (!data || !data.summary) return;

    // Metrics summary
    const s = data.summary;
    const totalPasses = s.totalActivePasses != null ? s.totalActivePasses : (s.confirmedRegistrations || s.totalRegistrations || 0);
    const totalRegsEl = document.getElementById('metricTotalRegistrations');
    if (totalRegsEl) totalRegsEl.textContent = totalPasses;
    const totalGameEntriesEl = document.getElementById('metricTotalGameEntries');
    if (totalGameEntriesEl) totalGameEntriesEl.textContent = s.totalSelectedGameEntries || 0;
    const indivEl = document.getElementById('metricIndividualEntries');
    if (indivEl) indivEl.textContent = s.totalIndividualEntries || 0;
    const teamEl = document.getElementById('metricTeamEntries');
    if (teamEl) teamEl.textContent = s.totalTeamEntries || 0;
    const teamSubEl = document.getElementById('metricTeamMembersSub');
    if (teamSubEl) teamSubEl.textContent = `${s.totalTeamMembersListed || 0} team members listed`;

    const verifiedEl = document.getElementById('metricVerifiedAttendees');
    if (verifiedEl) verifiedEl.textContent = s.verifiedParticipantsCount || 0;

    const certIssuedEl = document.getElementById('metricCertificatesIssued');
    if (certIssuedEl) certIssuedEl.textContent = s.certificatesIssuedCount || 0;

    // Payment Summary Metrics
    const paidPaymentsEl = document.getElementById('metricPaidPayments');
    if (paidPaymentsEl) paidPaymentsEl.textContent = s.paidPaymentsCount || 0;

    const pendingVerPaymentsEl = document.getElementById('metricPendingVerPayments');
    if (pendingVerPaymentsEl) pendingVerPaymentsEl.textContent = s.pendingVerificationCount || 0;

    const pendingPaymentsEl = document.getElementById('metricPendingPayments');
    if (pendingPaymentsEl) pendingPaymentsEl.textContent = s.pendingPaymentCount || 0;

    // Verified Revenue Display (Authoritative from backend calculation)
    const verifiedRevenue = (s.verifiedRevenue != null && !isNaN(s.verifiedRevenue)) ? Number(s.verifiedRevenue) : (Number(s.paidPaymentsCount || 0) * 10);
    const revenueDisplayEl = document.getElementById('metricTotalRevenueDisplay');
    if (revenueDisplayEl) revenueDisplayEl.textContent = `₹${verifiedRevenue}`;

    // Potential Revenue Display (Clearly separated estimate)
    const potentialRevenue = (s.potentialRevenue != null && !isNaN(s.potentialRevenue)) ? Number(s.potentialRevenue) : (Number(totalPasses) * 10);
    const potentialDisplayEl = document.getElementById('metricPotentialRevenueDisplay');
    if (potentialDisplayEl) potentialDisplayEl.textContent = `₹${potentialRevenue}`;

    const pendingVer = Number(s.pendingVerificationCount || 0);
    const pendingPay = Number(s.pendingPaymentCount || 0);
    const pendingAuditsEl = document.getElementById('metricPendingAuditsDisplay');
    if (pendingAuditsEl) pendingAuditsEl.textContent = (pendingVer + pendingPay).toString();

    // 6 Games Breakdown
    renderOverviewGames(data.gameStats || []);

    // Recent Registrations
    renderOverviewRecent(data.recentRegistrations || []);

  } catch (err) {
    console.error('Failed to load overview data:', err);
    if (!isSilent) {
      const revEl = document.getElementById('metricTotalRevenueDisplay');
      if (revEl) revEl.textContent = 'Error';
      const potEl = document.getElementById('metricPotentialRevenueDisplay');
      if (potEl) potEl.textContent = 'Error';
      const regEl = document.getElementById('metricTotalRegistrations');
      if (regEl) regEl.textContent = '—';
      const audEl = document.getElementById('metricPendingAuditsDisplay');
      if (audEl) audEl.textContent = '—';
      showToast('Failed to load overview data: ' + err.message);
    }
  }
}

function renderOverviewGames(gameStats) {
  const container = document.getElementById('overviewGamesGrid');
  if (!container) return;

  const maxEntries = Math.max(1, ...gameStats.map(g => g.totalEntries || 0));

  container.innerHTML = gameStats.map(game => {
    const pct = Math.round(((game.totalEntries || 0) / maxEntries) * 100);
    return `
      <div class="game-stat-card">
        <div class="game-stat-top">
          <span class="game-stat-name">${escapeHtml(game.name)}</span>
          <span class="game-stat-tag">${escapeHtml(game.category)}</span>
        </div>
        <div class="game-stat-bar-wrap">
          <div class="game-stat-bar" style="width: ${pct}%;"></div>
        </div>
        <div class="game-stat-counts-row">
          <span>Pass Holders: <span class="stat-count-pill">${game.totalEntries || 0}</span></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderOverviewRecent(recent) {
  const tbody = document.getElementById('overviewRecentTbody');
  if (!tbody) return;

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px;">No registrations recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(r => {
    const statusClass = `status-${r.status || 'confirmed'}`;
    const dateStr = formatDate(r.createdAt);
    return `
      <tr>
        <td><span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(r.registrationId)}')">${escapeHtml(r.registrationId)}</span></td>
        <td><span class="participant-name-single" title="${escapeHtml(r.studentName)}">${escapeHtml(r.studentName)}</span></td>
        <td><span class="participant-academic-single">${escapeHtml(r.course || '—')}</span></td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(r.status || 'confirmed')}</span></td>
        <td style="font-size:0.8rem; color:#64748B;">${dateStr}</td>
        <td>
          <div class="action-btn-group-single">
            <button type="button" class="btn-table-details" onclick="openRegistrationModal('${escapeHtml(r.registrationId)}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span>Details</span>
            </button>
            <button type="button" class="btn-table-delete-single" onclick="window.deleteRegistrationQuick('${escapeHtml(r.registrationId)}', '${escapeHtml(r.studentName)}')" title="Delete participant">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 4. ALL REGISTRATIONS TABLE (FILTER, SEARCH, PAGINATION)
// ============================================================================

function initRegistrationsTable() {
  const searchInput = document.getElementById('filterSearch');
  const gameSelect = document.getElementById('filterGame');
  const formatSelect = document.getElementById('filterFormat');
  const statusSelect = document.getElementById('filterStatus');
  const paymentStatusSelect = document.getElementById('filterPaymentStatus');
  const resetBtn = document.getElementById('btnResetFilters');
  const prevBtn = document.getElementById('btnPrevPage');
  const nextBtn = document.getElementById('btnNextPage');

  // Debounced Search Input
  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      regPageState.search = searchInput.value.trim();
      regPageState.page = 1;
      loadRegistrationsData();
    }, 300);
  });

  gameSelect?.addEventListener('change', () => {
    regPageState.game = gameSelect.value;
    regPageState.page = 1;
    loadRegistrationsData();
  });

  formatSelect?.addEventListener('change', () => {
    regPageState.format = formatSelect.value;
    regPageState.page = 1;
    loadRegistrationsData();
  });

  statusSelect?.addEventListener('change', () => {
    regPageState.status = statusSelect.value;
    regPageState.page = 1;
    loadRegistrationsData();
  });

  paymentStatusSelect?.addEventListener('change', () => {
    regPageState.paymentStatus = paymentStatusSelect.value;
    regPageState.page = 1;
    loadRegistrationsData();
  });

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (gameSelect) gameSelect.value = 'all';
    if (formatSelect) formatSelect.value = '';
    if (statusSelect) statusSelect.value = '';
    if (paymentStatusSelect) paymentStatusSelect.value = '';

    regPageState.search = '';
    regPageState.game = 'all';
    regPageState.format = '';
    regPageState.status = '';
    regPageState.paymentStatus = '';
    regPageState.page = 1;

    loadRegistrationsData();
  });

  prevBtn?.addEventListener('click', () => {
    if (regPageState.page > 1) {
      regPageState.page--;
      loadRegistrationsData();
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (regPageState.page < regPageState.totalPages) {
      regPageState.page++;
      loadRegistrationsData();
    }
  });
}

async function loadRegistrationsData(isSilent = false) {
  const tbody = document.getElementById('registrationsTbody');
  if (!tbody) return;

  const currentSeq = ++regRequestSeq;
  const hasExistingRows = tbody.querySelectorAll('tr:not(.table-state-row)').length > 0;

  if (!hasExistingRows && !isSilent) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="11" style="text-align: center; color: var(--text-dim); padding: 40px;">Loading registrations from database...</td></tr>`;
  } else {
    tbody.style.opacity = '0.65';
    tbody.style.transition = 'opacity 0.2s ease';
  }

  try {
    const params = new URLSearchParams({
      page: regPageState.page,
      limit: regPageState.limit,
      search: regPageState.search,
      game: regPageState.game,
      format: regPageState.format,
      status: regPageState.status
    });

    if (regPageState.paymentStatus) {
      params.append('paymentStatus', regPageState.paymentStatus);
    }

    const res = await fetch(`${API_BASE_URL}/api/admin/registrations?${params.toString()}`, {
      credentials: 'include'
    });

    if (currentSeq !== regRequestSeq) return;

    if (!res.ok) {
      tbody.style.opacity = '1';
      if (res.status === 401) checkSession();
      if (!hasExistingRows) {
        tbody.innerHTML = `<tr class="table-state-row"><td colspan="11" style="text-align: center; color: var(--red-light); padding: 40px;">Failed to load records from server.</td></tr>`;
      }
      return;
    }

    const { registrations, pagination } = await res.json();
    if (currentSeq !== regRequestSeq) return;

    regPageState.totalPages = pagination.totalPages;
    regPageState.total = pagination.total;

    // Update Pagination UI
    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);

    document.getElementById('paginationInfo').textContent = `Showing ${start}-${end} of ${pagination.total} registrations`;
    document.getElementById('pageIndicator').textContent = `Page ${pagination.page} of ${pagination.totalPages || 1}`;

    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');
    if (prevBtn) prevBtn.disabled = pagination.page <= 1;
    if (nextBtn) nextBtn.disabled = pagination.page >= pagination.totalPages;

    // Render Table Rows
    if (!registrations || registrations.length === 0) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 40px;">No registrations match your search or filter criteria.</td></tr>`;
      tbody.style.opacity = '1';
      return;
    }

    tbody.innerHTML = registrations.map(reg => {
      const student = reg.student || {};
      const statusClass = `status-${reg.status || 'confirmed'}`;
      const dateStr = formatDate(reg.createdAt);

      const fee = reg.feeAmount != null ? reg.feeAmount : 10;
      const isPaid = reg.paymentStatus === 'paid';
      const isPendingVer = reg.paymentStatus === 'payment_verification_pending';
      const isFailed = reg.paymentStatus === 'payment_failed';
      const paymentLabel = isPaid ? 'Verified' : (isPendingVer ? 'Audit Needed' : (isFailed ? 'Failed' : 'Pending'));
      const paymentClass = isPaid ? 'status-paid' : (isPendingVer ? 'status-payment_verification_pending' : (isFailed ? 'status-payment_failed' : 'status-payment_pending'));

      const subInfo = [
        student.course || '',
        student.branch ? `(${student.branch})` : ''
      ].filter(Boolean).join(' ');

      return `
        <tr>
          <td>
            <span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">${escapeHtml(reg.registrationId)}</span>
          </td>
          <td>
            <span class="participant-name-single" title="${escapeHtml(student.fullName || 'Anonymous')}">${escapeHtml(student.fullName || 'Anonymous')}</span>
          </td>
          <td>
            <span class="participant-academic-single" title="${escapeHtml(subInfo || '—')}">${escapeHtml(subInfo || '—')}</span>
          </td>
          <td>
            <span class="fee-badge-single">₹${fee}</span>
          </td>
          <td>
            <span class="status-pill ${paymentClass}">${escapeHtml(paymentLabel)}</span>
          </td>
          <td>
            <span class="status-pill ${statusClass}">${escapeHtml(reg.status || 'confirmed')}</span>
          </td>
          <td>
            <div class="action-btn-group-single">
              <button type="button" class="btn-table-details" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')" title="View complete details">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>Details</span>
              </button>
              <button type="button" class="btn-table-delete-single" onclick="window.deleteRegistrationQuick('${escapeHtml(reg.registrationId)}', '${escapeHtml(student.fullName || '')}')" title="Delete participant">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.style.opacity = '1';
  } catch (err) {
    if (currentSeq !== regRequestSeq) return;
    console.error('Failed to load registrations:', err);
    tbody.style.opacity = '1';
    if (!hasExistingRows) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--red-light); padding: 40px;">Failed to load records from server.</td></tr>`;
    } else {
      showToast('Notice: Could not refresh registrations. Showing cached records.');
    }
  }
}

// ============================================================================
// 5. GAME-WISE PARTICIPANTS VIEW
// ============================================================================

const EVENT_GAMES = [
  { id: 'lemon-race', name: 'Lemon Race' },
  { id: 'target-shooting', name: 'Target Shooting' },
  { id: 'musical-chairs', name: 'Musical Chairs' },
  { id: 'human-knot', name: 'Human Knot' },
  { id: 'cup-balloon-pyramid', name: 'Cup and Balloon Pyramid' },
  { id: 'balloon-dual-race', name: 'Balloon Dual Race' },
  { id: 'treasure-hunt', name: 'Treasure Hunt (Legacy)' }
];

function initGamewiseRoster() {
  const container = document.getElementById('gamewiseTabsContainer');
  if (!container) return;

  container.innerHTML = EVENT_GAMES.map(g => `
    <button type="button" class="btn-game-tab ${g.id === activeGameId ? 'active' : ''}" data-game-id="${g.id}">
      ${escapeHtml(g.name)}
    </button>
  `).join('');

  container.querySelectorAll('.btn-game-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeGameId = tab.dataset.gameId;
      container.querySelectorAll('.btn-game-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadGamewiseData(activeGameId);
    });
  });
}

async function loadGamewiseData(gameId, isSilent = false) {
  const headerCard = document.getElementById('gamewiseGameHeader');
  const tbody = document.getElementById('gamewiseTbody');
  const currentSeq = ++gamewiseRequestSeq;

  const hasExistingRows = tbody ? tbody.querySelectorAll('tr:not(.table-state-row)').length > 0 : false;

  if (tbody) {
    if (!hasExistingRows && !isSilent) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 30px;">Loading game roster...</td></tr>`;
    } else {
      tbody.style.opacity = '0.65';
      tbody.style.transition = 'opacity 0.2s ease';
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/games/${gameId}/registrations`, {
      credentials: 'include'
    });

    if (currentSeq !== gamewiseRequestSeq) return;

    if (!res.ok) {
      if (tbody) tbody.style.opacity = '1';
      if (res.status === 401) checkSession();
      return;
    }

    const { data } = await res.json();
    if (currentSeq !== gamewiseRequestSeq || !data) return;

    // Header Card
    if (headerCard && data.game && data.metrics) {
      const g = data.game;
      const m = data.metrics;
      headerCard.innerHTML = `
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--sky); text-transform: uppercase;">Category: ${escapeHtml(g.category)} &bull; ${escapeHtml(g.rulesApprovalStatus)}</div>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin: 4px 0 8px 0;">${escapeHtml(g.name)}</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 600px;">${escapeHtml(g.description)}</p>
          </div>
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            <div style="background: var(--bg-surface-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 18px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; display: block;">Total Entries</span>
              <strong style="font-size: 1.4rem; color: var(--text-main);">${m.totalRegistrations}</strong>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 18px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; display: block;">Solo / Team</span>
              <strong style="font-size: 1.4rem; color: var(--sky);">${m.individualEntries} / ${m.teamEntries}</strong>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 18px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; display: block;">Est. Players</span>
              <strong style="font-size: 1.4rem; color: var(--emerald-light);">${m.totalEstimatedPlayers}</strong>
            </div>
          </div>
        </div>
      `;
    }

    // Participants Table
    if (tbody) {
      if (!data.participants || data.participants.length === 0) {
        tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 40px;">No students have registered for this game yet.</td></tr>`;
        tbody.style.opacity = '1';
        return;
      }

      tbody.innerHTML = data.participants.map(p => {
        const isTeam = p.participationType === 'team';
        let teamInfo = '&mdash;';
        if (isTeam && p.teamName) {
          const count = Array.isArray(p.teamMembers) ? p.teamMembers.length : 0;
          teamInfo = `<strong style="color: #FCD34D;">${escapeHtml(p.teamName)}</strong> (${count + 1} players)`;
        }

        return `
          <tr>
            <td data-label="ID"><span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(p.registrationId)}')">${escapeHtml(p.registrationId)}</span></td>
            <td data-label="Student"><strong style="color: var(--text-main); font-weight: 700;">${escapeHtml(p.studentName)}</strong></td>
            <td data-label="Course">${escapeHtml(p.course)} - ${escapeHtml(p.branch)}</td>
            <td data-label="Format"><span class="status-pill ${isTeam ? 'status-pending' : 'status-confirmed'}">${isTeam ? 'Team' : 'Solo'}</span></td>
            <td data-label="Squad Details">${teamInfo}</td>
            <td data-label="Date">${formatDate(p.createdAt)}</td>
            <td data-label="Action">
              <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(p.registrationId)}')">
                View
              </button>
            </td>
          </tr>
        `;
      }).join('');
      tbody.style.opacity = '1';
    }

    // Also load live heat scores for this game
    loadGamewiseScores(gameId, isSilent);

  } catch (err) {
    if (currentSeq !== gamewiseRequestSeq) return;
    console.error('Failed to load game participants:', err);
    if (tbody) tbody.style.opacity = '1';
  }
}

async function loadGamewiseScores(gameId, isSilent = false) {
  const tbody = document.getElementById('gamewiseScoresTbody');
  if (!tbody) return;
  const currentSeq = ++gamewiseScoresSeq;

  const hasExistingScores = tbody.querySelectorAll('tr:not(.table-state-row)').length > 0;

  if (!hasExistingScores && !isSilent) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 20px;">Loading live heat scores...</td></tr>`;
  } else {
    tbody.style.opacity = '0.65';
    tbody.style.transition = 'opacity 0.2s ease';
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/config/scoreboard?gameId=${encodeURIComponent(gameId)}`);
    if (currentSeq !== gamewiseScoresSeq) return;

    if (!res.ok) throw new Error('Failed to fetch game scores');
    const json = await res.json();
    if (currentSeq !== gamewiseScoresSeq) return;

    const scores = Array.isArray(json.data) ? json.data : [];

    if (scores.length === 0) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 24px;">No live heat scores recorded yet for this challenge. Click "Record Heat Score" above to add verified times or points.</td></tr>`;
      tbody.style.opacity = '1';
      return;
    }

    tbody.innerHTML = scores.map(s => {
      const rankNum = Number(s.rank) || 1;
      let medalBadge = `<span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.1); color: #fff; text-align: center; line-height: 24px; font-weight: 800; font-size: 0.75rem;">${rankNum}</span>`;
      if (rankNum === 1) {
        medalBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; font-weight: 800; font-size: 0.8rem; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);">🥇</span>`;
      } else if (rankNum === 2) {
        medalBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #94A3B8, #64748B); color: #fff; font-weight: 800; font-size: 0.8rem;">🥈</span>`;
      } else if (rankNum === 3) {
        medalBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #B45309, #78350F); color: #fff; font-weight: 800; font-size: 0.8rem;">🥉</span>`;
      }

      return `
        <tr>
          <td data-label="Rank">${medalBadge}</td>
          <td data-label="Participant">
            <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(s.participant_name)}</div>
          </td>
          <td data-label="Roll No">
            <span style="font-family: monospace; color: var(--text-muted);">${escapeHtml(s.roll_number || '—')}</span>
          </td>
          <td data-label="Score">
            <strong style="color: #92400E; font-size: 0.95rem;">${escapeHtml(s.score)}</strong>
          </td>
          <td data-label="Category">
            <span class="status-pill status-confirmed">${escapeHtml(s.category || 'Solo')}</span>
          </td>
          <td data-label="Recorded At">
            <span style="font-size: 0.8rem; color: var(--text-dim);">${formatDate(s.created_at)}</span>
          </td>
          <td data-label="Action">
            <button type="button" class="btn-table-delete" onclick="window.deleteHeatScore('${escapeHtml(s.id)}')" title="Remove score from leaderboard">
              <span>Delete</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    tbody.style.opacity = '1';
  } catch (err) {
    if (currentSeq !== gamewiseScoresSeq) return;
    console.error('Failed to load scoreboard:', err);
    tbody.style.opacity = '1';
    if (!hasExistingScores) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--red-light); padding: 20px;">Could not load leaderboard scores.</td></tr>`;
    }
  }
}

window.openRecordScoreModal = function(gameId) {
  const modal = document.getElementById('recordScoreModal');
  if (!modal) return;
  const select = document.getElementById('scoreGameSelect');
  if (select) select.value = gameId || activeGameId || 'lemon-race';
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
};

window.closeRecordScoreModal = function() {
  const modal = document.getElementById('recordScoreModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  const form = document.getElementById('recordScoreForm');
  if (form) form.reset();
};

window.handleRecordScoreSubmit = async function(e) {
  if (e) e.preventDefault();
  const gameSelect = document.getElementById('scoreGameSelect');
  const nameInput = document.getElementById('scoreParticipantName');
  const rollInput = document.getElementById('scoreRollNumber');
  const rankSelect = document.getElementById('scoreRank');
  const scoreInput = document.getElementById('scoreValue');
  const catSelect = document.getElementById('scoreCategory');
  const btn = document.getElementById('btnSubmitScore');

  const game_id = gameSelect?.value || activeGameId;
  const participant_name = nameInput?.value?.trim();
  const roll_number = rollInput?.value?.trim() || '';
  const rank = parseInt(rankSelect?.value || '1', 10);
  const score = scoreInput?.value?.trim();
  const category = catSelect?.value || 'Solo';

  if (!participant_name || !score) {
    showToast('Participant name and score value are required.');
    return;
  }

  const selectedGameObj = EVENT_GAMES.find(g => g.id === game_id);
  const game_name = selectedGameObj?.name || game_id;

  try {
    if (btn) btn.disabled = true;
    const res = await fetch(`${API_BASE_URL}/api/config/scoreboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || getCsrfToken()
      },
      credentials: 'include',
      body: JSON.stringify({
        game_id,
        game_name,
        participant_name,
        roll_number,
        rank,
        score,
        category
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to record heat score');
    }

    showToast(`✓ Heat score for ${participant_name} recorded on live leaderboard!`);
    window.closeRecordScoreModal();
    loadGamewiseScores(activeGameId);
  } catch (err) {
    showToast(`Error: ${err.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.deleteHeatScore = async function(scoreId) {
  if (!confirm('Are you sure you want to remove this score record from the public leaderboard?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/config/scoreboard/${encodeURIComponent(scoreId)}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken || getCsrfToken()
      },
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete score');
    }

    showToast('✓ Heat score removed from leaderboard.');
    loadGamewiseScores(activeGameId);
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

// ============================================================================
// 6. PAYMENT MANAGEMENT & DESK AUDIT (PHASE 5)
// ============================================================================

function initPaymentsTable() {
  const searchInput = document.getElementById('filterPaySearch');
  const statusSelect = document.getElementById('filterPayStatus');
  const gameSelect = document.getElementById('filterPayGame');
  const resetBtn = document.getElementById('btnResetPayFilters');
  const prevBtn = document.getElementById('btnPayPrevPage');
  const nextBtn = document.getElementById('btnPayNextPage');

  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      payPageState.search = searchInput.value.trim();
      payPageState.page = 1;
      loadPaymentsData();
    }, 300);
  });

  statusSelect?.addEventListener('change', () => {
    payPageState.paymentStatus = statusSelect.value;
    payPageState.page = 1;
    loadPaymentsData();
  });

  gameSelect?.addEventListener('change', () => {
    payPageState.game = gameSelect.value;
    payPageState.page = 1;
    loadPaymentsData();
  });

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (gameSelect) gameSelect.value = 'all';

    payPageState.search = '';
    payPageState.paymentStatus = '';
    payPageState.game = 'all';
    payPageState.page = 1;

    loadPaymentsData();
  });

  prevBtn?.addEventListener('click', () => {
    if (payPageState.page > 1) {
      payPageState.page--;
      loadPaymentsData();
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (payPageState.page < payPageState.totalPages) {
      payPageState.page++;
      loadPaymentsData();
    }
  });
}

async function loadPaymentsData(isSilent = false) {
  const tbody = document.getElementById('paymentsTbody');
  if (!tbody) return;
  const currentSeq = ++payRequestSeq;

  const hasExistingRows = tbody.querySelectorAll('tr:not(.table-state-row)').length > 0;

  if (!hasExistingRows && !isSilent) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 30px;">Loading payment audit records...</td></tr>`;
  } else {
    tbody.style.opacity = '0.65';
    tbody.style.transition = 'opacity 0.2s ease';
  }

  try {
    const params = new URLSearchParams({
      page: payPageState.page,
      limit: payPageState.limit
    });

    if (payPageState.search) params.append('search', payPageState.search);
    if (payPageState.paymentStatus) params.append('paymentStatus', payPageState.paymentStatus);
    if (payPageState.game && payPageState.game !== 'all') params.append('game', payPageState.game);

    const res = await fetch(`${API_BASE_URL}/api/admin/registrations?${params.toString()}`, {
      credentials: 'include'
    });

    if (currentSeq !== payRequestSeq) return;

    if (!res.ok) {
      tbody.style.opacity = '1';
      if (res.status === 401) checkSession();
      throw new Error('Failed to load payment records');
    }

    const { registrations, pagination } = await res.json();
    if (currentSeq !== payRequestSeq) return;

    payPageState.totalPages = pagination.totalPages || 1;
    payPageState.total = pagination.total || 0;

    // Update Pagination UI
    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);

    const infoEl = document.getElementById('payPaginationInfo');
    if (infoEl) infoEl.textContent = `Showing ${start}-${end} of ${pagination.total} payment records`;

    const indicatorEl = document.getElementById('payPageIndicator');
    if (indicatorEl) indicatorEl.textContent = `Page ${pagination.page} of ${pagination.totalPages || 1}`;

    const prevBtn = document.getElementById('btnPayPrevPage');
    const nextBtn = document.getElementById('btnPayNextPage');
    if (prevBtn) prevBtn.disabled = pagination.page <= 1;
    if (nextBtn) nextBtn.disabled = pagination.page >= pagination.totalPages;

    // Also update metric summary from dashboard API if elements exist
    fetch(`${API_BASE_URL}/api/admin/dashboard`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d?.data?.summary) {
          const sm = d.data.summary;
          const pv = document.getElementById('metricPayPendingVer');
          const ppaid = document.getElementById('metricPayVerified');
          const ppend = document.getElementById('metricPayPending');
          const ptot = document.getElementById('metricPayEstimatedTotal');
          if (pv) pv.textContent = sm.pendingVerificationCount || 0;
          if (ppaid) ppaid.textContent = sm.paidPaymentsCount || 0;
          if (ppend) ppend.textContent = sm.pendingPaymentCount || 0;
          if (ptot) ptot.textContent = `₹${sm.verifiedRevenue != null ? sm.verifiedRevenue : (sm.paidPaymentsCount || 0) * 10}`;
        }
      })
      .catch(() => {});

    renderPaymentsRows(registrations || []);
    tbody.style.opacity = '1';

  } catch (err) {
    if (currentSeq !== payRequestSeq) return;
    console.error('Failed to load payment records:', err);
    tbody.style.opacity = '1';
    if (!hasExistingRows) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--red-light); padding: 30px;">Error loading payment records: ${escapeHtml(err.message)}</td></tr>`;
    } else {
      showToast('Notice: Could not refresh payment records. Showing cached data.');
    }
  }
}

function renderPaymentsRows(registrations) {
  const tbody = document.getElementById('paymentsTbody');
  if (!tbody) return;

  if (registrations.length === 0) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 36px;">No payment records match your search or filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = registrations.map(reg => {
    const student = reg.student || {};
    const fee = reg.totalAmount != null ? reg.totalAmount : (reg.feeAmount != null ? reg.feeAmount : 10);
    const dateStr = formatDate(reg.createdAt);

    const isPaid = reg.paymentStatus === 'paid';
    const isPendingVer = reg.paymentStatus === 'payment_verification_pending';
    const isFailed = reg.paymentStatus === 'payment_failed';

    let payBadgeClass = 'status-payment_pending';
    let payLabel = 'Payment Pending';

    if (isPaid) {
      payBadgeClass = 'status-paid';
      payLabel = 'Payment Verified';
    } else if (isPendingVer) {
      payBadgeClass = 'status-payment_verification_pending';
      payLabel = 'Verification Pending';
    } else if (isFailed) {
      payBadgeClass = 'status-payment_failed';
      payLabel = 'Payment Failed';
    }

    let utrDisplay = '<span style="color: var(--text-dim); font-size: 0.78rem;">None submitted</span>';
    if (reg.paymentReference) {
      utrDisplay = `
        <span class="utr-code-badge" title="${escapeHtml(reg.paymentReference)}">
          <span>${escapeHtml(reg.paymentReference)}</span>
          <button type="button" class="btn-copy-utr" onclick="copyTextToClipboard('${escapeHtml(reg.paymentReference)}')" title="Copy UTR">
            📋
          </button>
        </span>
      `;
    }

    // Actions
    let actionButtons = `
      <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">
        Review
      </button>
    `;

    if (!isPaid) {
      actionButtons = `
        <button type="button" class="btn-table-action btn-verify-pay" onclick="window.markPaymentVerifiedQuick('${escapeHtml(reg.registrationId)}', '${escapeHtml(reg.paymentReference || '')}')" title="Confirm transaction evidence and mark paid">
          Verify
        </button>
        <button type="button" class="btn-table-action" style="color: #34D399; border-color: rgba(52, 211, 153, 0.4);" onclick="window.collectCashAndCheckIn('${escapeHtml(reg.registrationId)}', ${fee})" title="Helpdesk 1-Tap Cash Collection">
          Cash In
        </button>
        <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">
          Details
        </button>
      `;
    }

    return `
      <tr class="payment-row payment-status-${reg.paymentStatus || 'unknown'}">
        <td data-label="ID">
          <span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">
            ${escapeHtml(reg.registrationId)}
          </span>
        </td>
        <td data-label="Student"><strong style="color: var(--text-main); font-weight: 700;">${escapeHtml(student.fullName)}</strong></td>
        <td data-label="Fee"><span class="fee-amount-badge">₹${fee}</span></td>
        <td data-label="Payment"><span class="status-pill ${payBadgeClass}">${escapeHtml(payLabel)}</span></td>
        <td data-label="UTR / Ref">${utrDisplay}</td>
        <td data-label="Date">${dateStr}</td>
        <td data-label="Action">
          <div class="action-btn-group">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.copyTextToClipboard = function(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`✓ Copied '${text}' to clipboard.`);
  }).catch(() => {
    prompt('Copy transaction reference:', text);
  });
};

window.deleteRegistrationQuick = async function(registrationId, studentName) {
  if (!registrationId) return;
  const nameLabel = studentName ? `for ${studentName} (${registrationId})` : `(${registrationId})`;
  const confirmMsg = `Are you sure you want to delete participant ${nameLabel}?\n\nThis will permanently remove their registration and payment records.\nThis action cannot be undone.`;
  
  if (!window.confirm(confirmMsg)) return;

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'DELETE'
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete registration ${registrationId}`);
    }

    showToast(`✓ Participant ${registrationId} successfully deleted.`);
    
    // Close modal if open for this registration
    if (activeRegistrationInModal && activeRegistrationInModal.registrationId === registrationId) {
      if (typeof window.closeRegistrationModal === 'function') {
        window.closeRegistrationModal();
      }
    }

    // Refresh active data
    refreshCurrentView();
  } catch (err) {
    console.error('Delete registration error:', err);
    alert(`Could not delete registration: ${err.message}`);
  }
};

window.markPaymentVerifiedQuick = async function(registrationId, utr) {
  const utrPrompt = utr 
    ? `Submitted Reference / UTR: ${utr}\n` 
    : 'No reference submitted online (Helpdesk cash/offline collection)\n';

  const confirmMsg = `CONFIRM PAYMENT VERIFICATION for ${registrationId}?\n\n` +
    utrPrompt +
    `Please ensure that transaction proof matches organizer bank statement or cash receipt before confirming.`;

  if (!window.confirm(confirmMsg)) return;

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentStatus: 'paid', status: 'confirmed' })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }

    showToast(`✓ Payment marked VERIFIED for ${registrationId}.`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.collectCashAndCheckIn = async function(registrationId, fee) {
  if (!window.confirm(`COLLECT CASH & CHECK-IN for ${registrationId}?\nRegistration Fee: ₹${fee}\n\nMark payment verified via campus desk cash collection?`)) return;

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        paymentStatus: 'paid',
        status: 'confirmed',
        paymentReference: `CASH-DESK-${Date.now().toString().slice(-6)}`
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to record cash payment');
    }

    showToast(`✓ Cash collected (₹${fee}) & verified for ${registrationId}!`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

async function initPaymentQrConfig() {
  const form = document.getElementById('qrConfigForm');
  const upiIdInput = document.getElementById('inputQrUpiId');
  const upiNameInput = document.getElementById('inputQrUpiName');
  const paymentMobileInput = document.getElementById('inputPaymentMobile');
  const qrUrlInput = document.getElementById('inputQrImageUrl');
  const passFeeInput = document.getElementById('inputPassFee');
  const requireUtrInput = document.getElementById('inputRequireUtr');
  const regStatusInput = document.getElementById('inputRegStatus');
  const paymentModeInput = document.getElementById('inputPaymentMode');
  const whatsappUrlInput = document.getElementById('inputWhatsappUrl');
  const announcementInput = document.getElementById('inputAnnouncementText');
  const badge = document.getElementById('qrStatusBadge');
  const thumbImg = document.getElementById('qrThumbnailImg');
  const thumbLink = document.getElementById('qrPreviewThumbLink');

  if (!form) return;

  const updateQrThumb = (url) => {
    const finalUrl = (url && url.trim()) ? url.trim() : '/assets/official-upi-qr.jpg';
    if (thumbImg) thumbImg.src = finalUrl;
    if (thumbLink) thumbLink.href = finalUrl;
  };

  qrUrlInput?.addEventListener('input', () => updateQrThumb(qrUrlInput.value));

  try {
    const res = await fetch(`${API_BASE_URL}/api/config/payment-qr`, { cache: 'no-store' });
    if (res.ok) {
      const { data } = await res.json();
      if (data) {
        if (upiIdInput && data.upi_id) upiIdInput.value = data.upi_id;
        if (paymentMobileInput && data.payment_mobile) paymentMobileInput.value = data.payment_mobile;
        if (upiNameInput && data.upi_name) upiNameInput.value = data.upi_name;
        if (qrUrlInput) {
          qrUrlInput.value = data.qr_image_url || '';
          updateQrThumb(data.qr_image_url);
        }
        if (passFeeInput && data.pass_fee != null) {
          passFeeInput.value = data.pass_fee;
        }
        if (requireUtrInput) {
          requireUtrInput.value = data.require_utr !== false ? 'true' : 'false';
        }
        if (regStatusInput) {
          regStatusInput.value = data.registration_open !== false ? 'open' : 'closed';
        }
        if (paymentModeInput && data.payment_mode) {
          paymentModeInput.value = data.payment_mode;
        }
        if (whatsappUrlInput && data.whatsapp_group_url) {
          whatsappUrlInput.value = data.whatsapp_group_url;
        }
        if (announcementInput && data.announcement) {
          announcementInput.value = data.announcement;
        }
        if (badge) {
          badge.className = 'status-pill status-paid';
          badge.textContent = 'Live Sync Active (Supabase)';
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch live database config:', err);
    if (badge) {
      badge.className = 'status-pill status-unverified';
      badge.textContent = 'Offline / In-Memory';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const upi_id = upiIdInput ? upiIdInput.value.trim() : 'guptashrijaya-1@oksbi';
    const payment_mobile = paymentMobileInput ? paymentMobileInput.value.trim() : '8858500856';
    const upi_name = upiNameInput ? upiNameInput.value.trim() : 'Shrijaya Gupta';
    const qr_image_url = qrUrlInput ? qrUrlInput.value.trim() : '/assets/official-upi-qr.jpg';
    const pass_fee = passFeeInput ? Math.max(0, parseInt(passFeeInput.value, 10) || 10) : 10;
    const require_utr = requireUtrInput ? requireUtrInput.value === 'true' : true;
    const registration_open = regStatusInput ? regStatusInput.value === 'open' : true;
    const payment_mode = paymentModeInput ? paymentModeInput.value : 'online_upi';
    const whatsapp_group_url = whatsappUrlInput ? whatsappUrlInput.value.trim() : '';
    const announcement = announcementInput ? announcementInput.value.trim() : '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/config/payment-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify({
          upi_id,
          upi_name,
          payment_mobile,
          qr_image_url,
          is_qr_active: Boolean(qr_image_url),
          pass_fee,
          require_utr,
          registration_open,
          payment_mode,
          whatsapp_group_url,
          announcement
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to update database configuration');
      }

      showToast('✓ Carnival settings & fee synchronized with Supabase database!');
      updateQrThumb(qr_image_url);
      if (badge) {
        badge.className = 'status-pill status-paid';
        badge.textContent = 'Live Sync Active (Supabase)';
      }

      // Notify any active student wizard tabs via BroadcastChannel & localStorage
      try {
        const syncChannel = new BroadcastChannel('srmu_carnival_sync');
        syncChannel.postMessage({ type: 'CONFIG_UPDATED', pass_fee, require_utr, registration_open });
        syncChannel.close();
      } catch (e) {}
      try {
        localStorage.setItem('srmu_config_updated_at', String(Date.now()));
      } catch (e) {}

    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  });
}

window.updatePaymentStatusDirect = async function(registrationId, paymentStatus) {
  try {
    const updateBody = { paymentStatus };
    if (paymentStatus === 'paid') {
      updateBody.status = 'confirmed';
    }
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateBody)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');

    showToast(`✓ Payment status updated to '${paymentStatus}'.`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

// ============================================================================
// 7. CSV DATA EXPORT SECTION
// ============================================================================

function initExportSection() {
  const downloadBtn = document.getElementById('btnDownloadCsv');
  const gameScopeSelect = document.getElementById('exportGameScope');
  const statusScopeSelect = document.getElementById('exportStatusScope');

  downloadBtn?.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
      <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <span>Generating Sanitized CSV...</span>
    `;

    try {
      const params = new URLSearchParams();
      if (gameScopeSelect && gameScopeSelect.value !== 'all') {
        params.append('game', gameScopeSelect.value);
      }
      if (statusScopeSelect && statusScopeSelect.value) {
        params.append('status', statusScopeSelect.value);
      }
      const payScopeSelect = document.getElementById('exportPaymentScope');
      if (payScopeSelect && payScopeSelect.value) {
        params.append('paymentStatus', payScopeSelect.value);
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/registrations/export?${params.toString()}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Export request failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `srmu-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast('✓ CSV export generated and downloaded successfully.');
    } catch (err) {
      console.error('Export download error:', err);
      showToast('Failed to export CSV. Please retry.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Download CSV Report</span>
      `;
    }
  });
}

// ============================================================================
// 7. REGISTRATION DETAILS MODAL & ACTIONS
// ============================================================================

window.openRegistrationModal = async function(registrationId) {
  const modal = document.getElementById('registrationDetailsModal');
  if (!modal) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      showToast('Could not load registration details.');
      return;
    }

    const { data } = await res.json();
    if (!data) {
      showToast('No registration data returned by server.');
      return;
    }
    activeRegistrationInModal = data;

    const student = data.student || {};
    const studentFullName = student.fullName || student.name || 'Anonymous Student';

    // Populate modal fields
    const regBadge = document.getElementById('modalRegIdBadge');
    if (regBadge) regBadge.textContent = data.registrationId || '';

    const nameEl = document.getElementById('modalStudentName');
    if (nameEl) nameEl.textContent = studentFullName;

    const rollWrap = document.getElementById('modalStudentRollWrap');
    const rollVal = student.rollNumber && student.rollNumber !== 'N/A' ? student.rollNumber : '';
    if (rollWrap) {
      if (rollVal) {
        rollWrap.style.display = '';
        const rollEl = document.getElementById('modalStudentRoll');
        if (rollEl) rollEl.textContent = rollVal;
      } else {
        rollWrap.style.display = 'none';
      }
    }

    const createdEl = document.getElementById('modalCreatedAt');
    if (createdEl) createdEl.textContent = formatDate(data.createdAt);

    // Direct mobile display & phone call / WhatsApp links
    const mobileEl = document.getElementById('modalStudentMobile');
    if (mobileEl) {
      mobileEl.textContent = student.mobileNumber || 'N/A';
    }

    // Academic Profile (Course, Branch, Year)
    const academicEl = document.getElementById('modalStudentAcademic');
    if (academicEl) {
      const parts = [
        student.course,
        student.branch ? `(${student.branch})` : '',
        student.academicYear ? `Year ${student.academicYear}` : ''
      ].filter(Boolean);
      academicEl.textContent = parts.length > 0 ? parts.join(' • ') : 'N/A';
    }

    const rawMobile = student.mobileNumber ? String(student.mobileNumber).replace(/[^0-9]/g, '') : '';
    const clean10 = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
    const callBtn = document.getElementById('modalCallStudent');
    const waBtn = document.getElementById('modalWhatsAppStudent');
    if (callBtn) {
      if (clean10) {
        callBtn.href = `tel:+91${clean10}`;
        callBtn.style.display = 'inline-flex';
      } else {
        callBtn.style.display = 'none';
      }
    }
    if (waBtn) {
      if (clean10) {
        const textMsg = encodeURIComponent(`Namaste ${studentFullName}, regards from Vijayadashami Carnival (SRMU B5-408 Desk). Regarding your Registration ID: ${data.registrationId}:`);
        waBtn.href = `https://wa.me/91${clean10}?text=${textMsg}`;
        waBtn.style.display = 'inline-flex';
      } else {
        waBtn.style.display = 'none';
      }
    }

    // WhatsApp Consent badge
    const consentEl = document.getElementById('modalWhatsAppConsent');
    if (consentEl) {
      const consented = student.whatsAppConsent !== false;
      consentEl.innerHTML = consented
        ? `<span style="color: var(--emerald-light); font-weight: 700; font-size: 0.82rem;">✓ Subscribed for Event Alerts</span>`
        : `<span style="color: var(--text-dim); font-size: 0.82rem;">Not Opted In</span>`;
    }

    const statusBadgeWrap = document.getElementById('modalStatusBadgeWrap');
    if (statusBadgeWrap) {
      statusBadgeWrap.innerHTML = `<span class="status-pill status-${data.status || 'confirmed'}">${escapeHtml(data.status || 'confirmed')}</span>`;
    }

    // Fee & Payment Status
    const modalFeeEl = document.getElementById('modalRegistrationFee');
    const modalPayEl = document.getElementById('modalPaymentStatus');
    const feeVal = data.totalAmount != null ? data.totalAmount : (data.feeAmount != null ? data.feeAmount : 10);
    if (modalFeeEl) modalFeeEl.textContent = `₹${feeVal}.00 (All-Access Pass)`;
    if (modalPayEl) {
      const isPaid = data.paymentStatus === 'paid';
      const isPendingVer = data.paymentStatus === 'payment_verification_pending';
      const payClass = isPaid ? 'status-paid' : (isPendingVer ? 'status-payment_verification_pending' : (data.paymentStatus === 'payment_failed' ? 'status-payment_failed' : 'status-payment_pending'));
      const payLabel = isPaid ? 'Payment Verified' : (isPendingVer ? 'Payment Verification Pending' : (data.paymentStatus === 'payment_failed' ? 'Payment Failed' : 'Payment Pending'));
      const utrInfo = data.paymentReference ? `<div style="font-size: 0.75rem; color: #64748B; font-weight: 600; margin-top: 4px;">UTR/Ref: <strong style="color: #0F172A;">${escapeHtml(data.paymentReference)}</strong></div>` : '';
      modalPayEl.innerHTML = `<span class="status-pill ${payClass}">${escapeHtml(payLabel)}</span>${utrInfo}`;
    }

    // Phase 5: Payment Audit & Verification Workflow Card
    const payWorkflowDesc = document.getElementById('modalPayWorkflowDesc');
    const modalUtrCode = document.getElementById('modalUtrCode');
    const btnCopyModalUtr = document.getElementById('btnCopyModalUtr');
    const modalPayButtonsGroup = document.getElementById('modalPayButtonsGroup');

    if (modalUtrCode) {
      modalUtrCode.textContent = data.paymentReference || 'None submitted';
    }

    if (btnCopyModalUtr) {
      btnCopyModalUtr.style.display = data.paymentReference ? 'inline-flex' : 'none';
      btnCopyModalUtr.onclick = () => window.copyTextToClipboard(data.paymentReference);
    }

    const isPaid = data.paymentStatus === 'paid';
    const isPendingVer = data.paymentStatus === 'payment_verification_pending';
    const isFailed = data.paymentStatus === 'payment_failed';

    if (payWorkflowDesc) {
      if (isPaid) {
        const verifier = data.paymentVerifiedBy ? `by organizer '${escapeHtml(data.paymentVerifiedBy)}'` : 'by staff';
        const dateStr = data.paymentVerifiedAt ? ` on ${formatDate(data.paymentVerifiedAt)}` : '';
        payWorkflowDesc.innerHTML = `<span style="color: var(--emerald-light);">✓ Payment verified ${verifier}${dateStr}. Registration fee settled.</span>`;
      } else if (isPendingVer) {
        payWorkflowDesc.innerHTML = `<span style="color: #92400E; font-weight: 600;">Student submitted transaction reference. Compare with official bank statement or desk cash before marking verified.</span>`;
      } else if (isFailed) {
        payWorkflowDesc.innerHTML = `<span style="color: var(--red-light);">Payment verification was marked as FAILED/INVALID. Can be reviewed or reset.</span>`;
      } else {
        payWorkflowDesc.textContent = 'Awaiting online transaction reference or cash fee payment at Carnival Helpdesk B5-408.';
      }
    }

    if (modalPayButtonsGroup) {
      modalPayButtonsGroup.innerHTML = '';

      if (!isPaid) {
        const btnVerifyPay = document.createElement('button');
        btnVerifyPay.type = 'button';
        btnVerifyPay.className = 'btn-table-action btn-verify-pay';
        btnVerifyPay.innerHTML = '<span>Mark Payment Verified</span>';
        btnVerifyPay.onclick = async () => {
          await window.markPaymentVerifiedQuick(data.registrationId, data.paymentReference);
          window.openRegistrationModal(data.registrationId);
        };
        modalPayButtonsGroup.appendChild(btnVerifyPay);

        if (isPendingVer) {
          const btnFailPay = document.createElement('button');
          btnFailPay.type = 'button';
          btnFailPay.className = 'btn-table-action btn-fail-pay';
          btnFailPay.innerHTML = '<span>Mark Failed / Invalid</span>';
          btnFailPay.onclick = async () => {
            if (!confirm(`Mark payment as FAILED/INVALID for ${data.registrationId}?\nThis indicates the submitted UTR could not be verified against event collections.`)) return;
            await window.updatePaymentStatusDirect(data.registrationId, 'payment_failed');
            window.openRegistrationModal(data.registrationId);
          };
          modalPayButtonsGroup.appendChild(btnFailPay);
        }
      } else {
        const btnRevokePay = document.createElement('button');
        btnRevokePay.type = 'button';
        btnRevokePay.className = 'btn-table-action btn-revoke';
        btnRevokePay.innerHTML = '<span>Revoke Payment Verification</span>';
        btnRevokePay.onclick = async () => {
          if (!confirm(`REVOKE payment verification for ${data.registrationId}?\nStatus will return to Payment Pending.`)) return;
          await window.updatePaymentStatusDirect(data.registrationId, 'payment_pending');
          window.openRegistrationModal(data.registrationId);
        };
        modalPayButtonsGroup.appendChild(btnRevokePay);
      }
    }

    // Participation Status & Certificate (Phase 7)
    const partStatus = data.participationStatus || 'unverified';
    const isVerified = partStatus === 'verified';
    const certIssued = Boolean(data.certificateIssued);

    const partStatusEl = document.getElementById('modalParticipationStatus');
    if (partStatusEl) {
      partStatusEl.innerHTML = `<span class="status-pill status-${isVerified ? 'verified' : 'unverified'}">${escapeHtml(partStatus.toUpperCase())}</span>`;
    }

    const certIdEl = document.getElementById('modalCertificateId');
    if (certIdEl) {
      certIdEl.innerHTML = data.certificateId
        ? `<span class="reg-id-badge">${escapeHtml(data.certificateId)}</span>`
        : `<span style="color: var(--text-dim); font-size: 0.82rem;">Not Issued</span>`;
    }

    const descEl = document.getElementById('modalCertWorkflowDesc');
    const btnGroup = document.getElementById('modalCertButtonsGroup');

    if (btnGroup) {
      btnGroup.innerHTML = '';
      if (!isVerified) {
        if (descEl) descEl.textContent = 'Attendance is unverified. Verify attendance before issuing certificate.';
        const btnVerify = document.createElement('button');
        btnVerify.className = 'btn-table-action btn-verify';
        btnVerify.innerHTML = '<span>Verify Attendance</span>';
        btnVerify.onclick = async () => {
          await window.verifyParticipantAttendance(data.registrationId);
          window.openRegistrationModal(data.registrationId);
        };
        btnGroup.appendChild(btnVerify);
      } else if (!certIssued) {
        if (descEl) descEl.textContent = 'Attendance verified! Participant is eligible for participation certificate.';
        const btnIssue = document.createElement('button');
        btnIssue.className = 'btn-table-action btn-issue-cert';
        btnIssue.innerHTML = '<span>Issue Certificate</span>';
        btnIssue.onclick = async () => {
          await window.issueParticipantCertificate(data.registrationId);
          window.openRegistrationModal(data.registrationId);
        };
        btnGroup.appendChild(btnIssue);

        const btnRevokeVer = document.createElement('button');
        btnRevokeVer.className = 'btn-table-action btn-revoke';
        btnRevokeVer.innerHTML = '<span>Revoke Verification</span>';
        btnRevokeVer.onclick = async () => {
          await window.revokeParticipantAttendance(data.registrationId);
          window.openRegistrationModal(data.registrationId);
        };
        btnGroup.appendChild(btnRevokeVer);
      } else {
        if (descEl) descEl.textContent = `Certificate ${data.certificateId} is issued and ready.`;
        if (data.certificateId) {
          const btnDl = document.createElement('button');
          btnDl.className = 'btn-table-action btn-cert-download';
          btnDl.innerHTML = '<span>Download PDF</span>';
          btnDl.onclick = () => window.downloadParticipantCertificate(data.certificateId);
          btnGroup.appendChild(btnDl);

          const btnRevoke = document.createElement('button');
          btnRevoke.className = 'btn-table-action btn-revoke';
          btnRevoke.innerHTML = '<span>Revoke Cert</span>';
          btnRevoke.onclick = async () => {
            await window.revokeIssuedCertificate(data.certificateId);
            window.openRegistrationModal(data.registrationId);
          };
          btnGroup.appendChild(btnRevoke);
        }
      }
    }

    const statusSelect = document.getElementById('modalStatusSelect');
    if (statusSelect) statusSelect.value = data.status || 'confirmed';

    const payStatusSelect = document.getElementById('modalPaymentStatusSelect');
    if (payStatusSelect) {
      payStatusSelect.value = (data.paymentStatus === 'pending' || data.paymentStatus === 'pending_desk_collection') ? 'payment_pending' : (data.paymentStatus || 'payment_pending');
    }

    // Keep games empty - Flat ₹10 Carnival Pass covers all entries
    const gamesWrap = document.getElementById('modalGamesContainer');
    if (gamesWrap) {
      gamesWrap.innerHTML = '';
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  } catch (err) {
    console.error('Failed to open registration modal:', err);
    showToast('Failed to load registration record.');
  }
};

function initModalActions() {
  const modal = document.getElementById('registrationDetailsModal');
  const closeBtn = document.getElementById('btnModalClose');
  const saveStatusBtn = document.getElementById('btnSaveStatus');
  const deleteBtn = document.getElementById('btnDeleteRegistration');

  const closeModal = () => {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    activeRegistrationInModal = null;
  };

  window.closeRegistrationModal = closeModal;

  closeBtn?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Save Status handler
  saveStatusBtn?.addEventListener('click', async () => {
    if (!activeRegistrationInModal) return;

    const newStatus = document.getElementById('modalStatusSelect')?.value;
    const newPaymentStatus = document.getElementById('modalPaymentStatusSelect')?.value;
    saveStatusBtn.disabled = true;

    try {
      const res = await adminApiFetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(activeRegistrationInModal.registrationId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, paymentStatus: newPaymentStatus })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Update failed');
      }

      showToast(`✓ Registration status updated to '${newStatus}'.`);
      closeModal();
      refreshCurrentView();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      saveStatusBtn.disabled = false;
    }
  });

  // Delete record handler
  deleteBtn?.addEventListener('click', async () => {
    if (!activeRegistrationInModal) return;
    const regId = activeRegistrationInModal.registrationId;
    const studentName = activeRegistrationInModal.student?.fullName || '';
    window.deleteRegistrationQuick(regId, studentName);
  });
}

// ============================================================================
// 8. CERTIFICATES & ATTENDANCE MANAGEMENT (PHASE 7)
// ============================================================================

function initCertificatesTable() {
  const searchInput = document.getElementById('filterCertSearch');
  const statusSelect = document.getElementById('filterCertStatus');
  const gameSelect = document.getElementById('filterCertGame');
  const resetBtn = document.getElementById('btnResetCertFilters');
  const prevBtn = document.getElementById('btnCertPrevPage');
  const nextBtn = document.getElementById('btnCertNextPage');

  let debounceTimer = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      certPageState.search = e.target.value.trim();
      certPageState.page = 1;
      loadCertificatesData();
    }, 300);
  });

  statusSelect?.addEventListener('change', (e) => {
    certPageState.participationStatus = e.target.value;
    certPageState.page = 1;
    loadCertificatesData();
  });

  gameSelect?.addEventListener('change', (e) => {
    certPageState.game = e.target.value;
    certPageState.page = 1;
    loadCertificatesData();
  });

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (gameSelect) gameSelect.value = 'all';

    certPageState.search = '';
    certPageState.participationStatus = '';
    certPageState.game = 'all';
    certPageState.page = 1;
    loadCertificatesData();
  });

  prevBtn?.addEventListener('click', () => {
    if (certPageState.page > 1) {
      certPageState.page--;
      loadCertificatesData();
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (certPageState.page < certPageState.totalPages) {
      certPageState.page++;
      loadCertificatesData();
    }
  });
}

async function loadCertificatesData(isSilent = false) {
  const tbody = document.getElementById('certificatesTbody');
  if (!tbody) return;
  const currentSeq = ++certRequestSeq;

  const hasExistingRows = tbody.querySelectorAll('tr:not(.table-state-row)').length > 0;

  if (!hasExistingRows && !isSilent) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-dim);">Loading participant records...</td></tr>`;
  } else {
    tbody.style.opacity = '0.65';
    tbody.style.transition = 'opacity 0.2s ease';
  }

  try {
    const params = new URLSearchParams({
      page: certPageState.page,
      limit: certPageState.limit
    });
    if (certPageState.search) params.append('search', certPageState.search);
    if (certPageState.participationStatus) params.append('participationStatus', certPageState.participationStatus);
    if (certPageState.game && certPageState.game !== 'all') params.append('game', certPageState.game);

    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/participants?${params.toString()}`, {
      credentials: 'include'
    });

    if (currentSeq !== certRequestSeq) return;

    if (!res.ok) {
      tbody.style.opacity = '1';
      if (res.status === 401) checkSession();
      throw new Error('Failed to load certificates participant roster');
    }

    const data = await res.json();
    if (currentSeq !== certRequestSeq) return;

    certPageState.total = data.totalCount || 0;
    certPageState.totalPages = data.totalPages || 1;

    renderCertificatesRows(data.participants || []);
    tbody.style.opacity = '1';

    // Pagination display
    const start = certPageState.total === 0 ? 0 : (certPageState.page - 1) * certPageState.limit + 1;
    const end = Math.min(certPageState.page * certPageState.limit, certPageState.total);
    const infoEl = document.getElementById('certPaginationInfo');
    if (infoEl) {
      infoEl.textContent = `Showing ${start}-${end} of ${certPageState.total} participants`;
    }

    const indicatorEl = document.getElementById('certPageIndicator');
    if (indicatorEl) {
      indicatorEl.textContent = `Page ${certPageState.page} of ${certPageState.totalPages}`;
    }

    const prevBtn = document.getElementById('btnCertPrevPage');
    const nextBtn = document.getElementById('btnCertNextPage');
    if (prevBtn) prevBtn.disabled = certPageState.page <= 1;
    if (nextBtn) nextBtn.disabled = certPageState.page >= certPageState.totalPages;

  } catch (err) {
    if (currentSeq !== certRequestSeq) return;
    console.error('Error loading certificates data:', err);
    tbody.style.opacity = '1';
    if (!hasExistingRows) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="6" style="text-align: center; color: var(--red-light); padding: 24px;">Failed to load participant data.</td></tr>`;
    } else {
      showToast('Notice: Could not refresh certificates roster. Showing cached data.');
    }
  }
}

function renderCertificatesRows(participants) {
  const tbody = document.getElementById('certificatesTbody');
  if (!tbody) return;

  if (participants.length === 0) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 32px;">No matching participant records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = participants.map(p => {
    const isVerified = p.participationStatus === 'verified';
    const certIssued = Boolean(p.certificateIssued && p.certificateId);
    const isRevoked = p.certificateStatus === 'revoked';

    // Status Pill
    const partPill = isVerified
      ? `<span class="status-pill status-verified">Verified</span>`
      : `<span class="status-pill status-unverified">Unverified</span>`;

    // Cert Status
    let certStatusHtml = `<span style="color: var(--text-dim); font-size: 0.8rem;">Not Issued</span>`;
    if (isRevoked) {
      certStatusHtml = `<span class="status-pill status-cancelled">Revoked</span>`;
    } else if (certIssued) {
      certStatusHtml = `<span class="status-pill status-confirmed">Issued &amp; Valid</span>`;
    }

    // Action buttons
    let actionButtonsHtml = '';
    if (!isVerified) {
      actionButtonsHtml = `
        <button type="button" class="btn-table-action btn-verify" onclick="window.verifyParticipantAttendance('${p.registrationId}')" title="Confirm that student actually attended the event">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Verify</span>
        </button>
      `;
    } else if (!certIssued || isRevoked) {
      actionButtonsHtml = `
        <button type="button" class="btn-table-action btn-issue-cert" onclick="window.issueParticipantCertificate('${p.registrationId}')" title="Generate collision-resistant unique certificate and QR code">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>
          <span>Issue Cert</span>
        </button>
        <button type="button" class="btn-table-action btn-revoke" onclick="window.revokeParticipantAttendance('${p.registrationId}')" title="Revoke verified status if marked mistakenly">
          <span>Revoke</span>
        </button>
      `;
    } else {
      actionButtonsHtml = `
        <button type="button" class="btn-table-action btn-cert-download" onclick="window.downloadParticipantCertificate('${p.certificateId}')" title="Download official PDF certificate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>PDF</span>
        </button>
        ${p.verificationToken ? `
          <a href="/verify.html?token=${encodeURIComponent(p.verificationToken)}" target="_blank" rel="noopener" class="btn-table-action" title="View public verification page">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>QR Link</span>
          </a>
        ` : ''}
        <button type="button" class="btn-table-action btn-revoke" onclick="window.revokeIssuedCertificate('${p.certificateId}')" title="Revoke certificate">
          <span>Revoke</span>
        </button>
      `;
    }

    return `
      <tr>
        <td data-label="ID">
          <span class="reg-id-badge cursor-pointer" onclick="window.openRegistrationModal('${p.registrationId}')" title="Click to view details">
            ${escapeHtml(p.registrationId)}
          </span>
        </td>
        <td data-label="Participant">
          <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(p.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(p.course)} &bull; ${escapeHtml(p.branch)}</div>
        </td>
        <td data-label="Attendance">${partPill}</td>
        <td data-label="Certificate">
          <div>${certStatusHtml}</div>
          ${p.certificateId ? `<div style="font-size: 0.72rem; font-family: monospace; color: var(--sky); margin-top: 2px;">${escapeHtml(p.certificateId)}</div>` : ''}
        </td>
        <td data-label="Action">
          <div class="action-btn-group">
            ${actionButtonsHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleInstantQrLookup = async function(e) {
  if (e) e.preventDefault();
  const inputEl = document.getElementById('instantQrInput');
  const resultEl = document.getElementById('instantQrResult');
  if (!inputEl || !resultEl) return;

  const rawQuery = inputEl.value.trim();
  if (!rawQuery) {
    showToast('Please enter or scan a Registration ID');
    return;
  }

  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #E5C158; padding: 0.75rem; font-size: 0.88rem;">
      <div style="width: 14px; height: 14px; border: 2px solid #E5C158; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <span>Verifying registration pass...</span>
    </div>
  `;

  try {
    let reg = null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(rawQuery)}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        reg = json.data || json;
      }
    } catch (_) {}

    if (!reg) {
      const certRes = await fetch(`${API_BASE_URL}/api/admin/certificates/participants?search=${encodeURIComponent(rawQuery)}`, {
        credentials: 'include'
      });
      if (certRes.ok) {
        const certData = await certRes.json();
        if (certData.success && certData.data && certData.data.length > 0) {
          reg = certData.data.find(p => 
            (p.registrationId && p.registrationId.toUpperCase() === rawQuery.toUpperCase()) ||
            (p.registrationReference && p.registrationReference.toUpperCase() === rawQuery.toUpperCase())
          ) || certData.data[0];
        }
      }
    }

    if (!reg) {
      throw new Error(`Registration ID "${rawQuery}" not found in carnival records. Please check the ID or QR scan.`);
    }

    renderInstantCard(reg);
  } catch (err) {
    resultEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.6rem; color: #FCA5A5; font-size: 0.88rem; padding: 0.25rem;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>${escapeHtml(err.message)}</span>
      </div>
    `;
  }

  function renderInstantCard(item) {
    const regId = item.registrationId || item.registrationReference || item._id;
    const name = item.studentName || (item.student && item.student.fullName) || 'Participant';
    const mobile = item.studentMobile || (item.student && item.student.mobileNumber) || 'N/A';
    const course = item.course || (item.student && item.student.course) || 'N/A';
    const branch = item.branch || (item.student && item.student.branch) || '';
    const year = item.academicYear || (item.student && item.student.academicYear) || '';
    const games = Array.isArray(item.selectedGames) ? item.selectedGames : [];
    const isAttended = item.attendanceStatus === 'verified' || item.participationStatus === 'verified';
    const payStatus = item.paymentStatus || 'pending';
    const totalFee = item.totalAmount != null ? item.totalAmount : (item.feeAmount != null ? item.feeAmount : 10);

    const gamesSummary = games.map(g => {
      if (typeof g === 'string') return g;
      return g.gameTitle || g.gameId;
    }).join(', ') || 'None';

    resultEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; padding-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-family: monospace; font-weight: 800; color: #FFE28A; font-size: 1.05rem;">${escapeHtml(regId)}</span>
            <span class="status-pill ${isAttended ? 'status-confirmed' : 'status-payment_verification_pending'}" style="font-size: 0.75rem;">
              ${isAttended ? '✓ Attendance Verified' : 'Attendance Unverified'}
            </span>
          </div>
          <div style="font-size: 0.82rem; color: #E5C158; font-weight: 700;">
            Fee: ₹${totalFee}.00 &bull; Payment: <span style="text-transform: capitalize; color: ${payStatus === 'paid' ? '#34D399' : '#FBBF24'}">${escapeHtml(payStatus.replace(/_/g, ' '))}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.6rem; font-size: 0.84rem; color: #E7E5E4;">
          <div><span style="color: #A8A29E;">Student Name:</span> <strong>${escapeHtml(name)}</strong></div>
          <div><span style="color: #A8A29E;">Mobile:</span> <strong>${escapeHtml(mobile)}</strong></div>
          <div><span style="color: #A8A29E;">Course / Year:</span> <strong>${escapeHtml(course)} ${year ? '(' + escapeHtml(year) + ')' : ''} ${branch ? '&bull; ' + escapeHtml(branch) : ''}</strong></div>
          <div><span style="color: #A8A29E;">Selected Games (${games.length}):</span> <strong>${escapeHtml(gamesSummary)}</strong></div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; justify-content: flex-end; margin-top: 0.25rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.1);">
          ${!isAttended ? `
            <button type="button" class="btn-primary" onclick="window.markInstantAttendance('${escapeHtml(regId)}')" style="padding: 0.5rem 1.1rem; font-weight: 700; background: linear-gradient(135deg, #059669, #10B981); border: 1px solid #34D399; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Verify & Check-In Attendee</span>
            </button>
          ` : `
            <span style="color: #34D399; font-weight: 700; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Attendee Verified &amp; Checked-In
            </span>
          `}
          <button type="button" class="btn-table-action" onclick="window.openRegistrationModal('${escapeHtml(regId)}')" style="padding: 0.45rem 0.85rem; font-size: 0.8rem; cursor: pointer;">
            View Profile
          </button>
        </div>
      </div>
    `;
  }
};

window.markInstantAttendance = async function(registrationId) {
  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/certificates/verify-participation/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    showToast(`✓ Attendance verified for ${registrationId}! Student check-in confirmed.`);
    refreshCurrentView();
    window.handleInstantQrLookup();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.verifyParticipantAttendance = async function(registrationId) {
  if (!confirm(`Mark participation attendance as VERIFIED for registration ${registrationId}?\nThis indicates the student actually attended and participated in the event challenges.`)) {
    return;
  }

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/certificates/verify-participation/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    showToast(`✓ Participation verified for ${registrationId}.`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.revokeParticipantAttendance = async function(registrationId) {
  if (!confirm(`REVOKE attendance verification for ${registrationId}?`)) {
    return;
  }

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/certificates/revoke-verification/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Revocation failed');
    }

    showToast(`✓ Attendance verification revoked for ${registrationId}.`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.issueParticipantCertificate = async function(registrationId) {
  if (!confirm(`Generate and issue official participation certificate for ${registrationId}?\nThis will create a collision-resistant unique Certificate ID and QR code.`)) {
    return;
  }

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/certificates/issue/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Certificate issuance failed');
    }

    const certId = data.certificate?.certificateId || '';
    showToast(`✓ Certificate ${certId} issued successfully!`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.revokeIssuedCertificate = async function(certificateId) {
  const reason = prompt(`Please enter the reason for revoking Certificate ${certificateId}:`, 'Organizing committee review / attendance record adjustment');
  if (reason === null) return; // user cancelled

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/certificates/${encodeURIComponent(certificateId)}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Revocation failed');
    }

    showToast(`✓ Certificate ${certificateId} has been revoked.`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.downloadParticipantCertificate = function(certificateId) {
  if (!certificateId) return;
  const url = `${API_BASE_URL}/api/admin/certificates/${encodeURIComponent(certificateId)}/download`;
  window.open(url, '_blank');
};

// ============================================================================
// 9. UTILITY HELPERS
// ============================================================================

function showToast(message) {
  const toast = document.getElementById('adminToast');
  const msgEl = document.getElementById('adminToastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function formatDate(isoString) {
  if (!isoString) return '&mdash;';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// 10. QR PASS SCANNER & CAMERA CONTROLLER
// ============================================================================

let html5QrScannerInstance = null;
let isCameraActive = false;
let currentCameraId = null;
let lastScannedPassId = null;
let scanCooldownTimer = null;

function playScanSuccessTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (_) {}
  try {
    if (navigator.vibrate) navigator.vibrate(80);
  } catch (_) {}
}

function extractRegIdFromText(text) {
  if (!text) return '';
  const trimmed = text.trim();
  const urlMatch = trimmed.match(/[?&](?:reg|registrationId|regId)=([A-Za-z0-9\-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }
  const codeMatch = trimmed.match(/(?:VJC|SRMU)[A-Za-z0-9\-_]+/i);
  if (codeMatch && codeMatch[0]) {
    return codeMatch[0].toUpperCase();
  }
  return trimmed.toUpperCase();
}

let detectedCameras = [];
let currentCameraIndex = 0;
let isTorchActive = false;

async function initScanner() {
  const toggleBtn = document.getElementById('btnToggleCamera');
  const toggleText = document.getElementById('btnCameraToggleText');
  const liveIndicator = document.getElementById('cameraLiveIndicator');
  const deviceSelect = document.getElementById('cameraDeviceSelect');
  const manualInput = document.getElementById('manualPassIdInput');
  const verifyManualBtn = document.getElementById('btnVerifyManualPass');
  const flipBtn = document.getElementById('btnFlipCamera');
  const torchBtn = document.getElementById('btnToggleTorch');

  if (typeof Html5Qrcode !== 'undefined') {
    try {
      detectedCameras = await Html5Qrcode.getCameras() || [];
      if (detectedCameras.length && deviceSelect) {
        deviceSelect.innerHTML = '';
        detectedCameras.forEach((dev, idx) => {
          const opt = document.createElement('option');
          opt.value = dev.id;
          opt.textContent = dev.label || `Camera ${idx + 1}`;
          deviceSelect.appendChild(opt);
        });

        const backIdx = detectedCameras.findIndex(d => /back|rear|environment|primary/i.test(d.label));
        if (backIdx !== -1) {
          currentCameraIndex = backIdx;
          currentCameraId = detectedCameras[backIdx].id;
          deviceSelect.value = currentCameraId;
        } else {
          currentCameraIndex = 0;
          currentCameraId = detectedCameras[0].id;
        }
      }
    } catch (err) {
      console.warn('Camera enumeration note:', err);
    }
  }

  deviceSelect?.addEventListener('change', async (e) => {
    currentCameraId = e.target.value;
    const foundIdx = detectedCameras.findIndex(d => d.id === currentCameraId);
    if (foundIdx !== -1) currentCameraIndex = foundIdx;
    if (isCameraActive) {
      await stopCameraScanner();
      await startCameraScanner();
    }
  });

  flipBtn?.addEventListener('click', async () => {
    if (detectedCameras.length > 1) {
      currentCameraIndex = (currentCameraIndex + 1) % detectedCameras.length;
      currentCameraId = detectedCameras[currentCameraIndex].id;
      if (deviceSelect) deviceSelect.value = currentCameraId;
      showToast(`Switched to: ${detectedCameras[currentCameraIndex].label || 'Camera ' + (currentCameraIndex + 1)}`);
      if (isCameraActive) {
        await stopCameraScanner();
        await startCameraScanner();
      }
    } else {
      showToast('Camera flip: Using device camera');
    }
  });

  torchBtn?.addEventListener('click', async () => {
    if (!html5QrScannerInstance || !isCameraActive) {
      showToast('Start camera first to turn on flashlight.');
      return;
    }
    try {
      isTorchActive = !isTorchActive;
      await html5QrScannerInstance.applyVideoConstraints({
        advanced: [{ torch: isTorchActive }]
      });
      torchBtn.classList.toggle('active', isTorchActive);
      const label = document.getElementById('torchBtnLabel');
      if (label) label.textContent = isTorchActive ? 'Torch ON' : 'Torch';
      showToast(isTorchActive ? 'Flashlight ON' : 'Flashlight OFF');
    } catch (err) {
      console.warn('Torch constraint error:', err);
      showToast('Torch flashlight is not supported by this camera hardware.');
    }
  });

  toggleBtn?.addEventListener('click', async () => {
    if (isCameraActive) {
      await stopCameraScanner();
    } else {
      await startCameraScanner();
    }
  });

  verifyManualBtn?.addEventListener('click', () => {
    const rawVal = manualInput?.value || '';
    const cleanId = extractRegIdFromText(rawVal);
    if (!cleanId) {
      showToast('Please enter a Registration ID.');
      return;
    }
    fetchAndDisplayPass(cleanId);
  });

  manualInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyManualBtn?.click();
    }
  });
}

async function startCameraScanner() {
  const toggleBtn = document.getElementById('btnToggleCamera');
  const toggleText = document.getElementById('btnCameraToggleText');
  const liveIndicator = document.getElementById('cameraLiveIndicator');
  const statusText = document.getElementById('scannerStatusText');
  const deviceSelect = document.getElementById('cameraDeviceSelect');
  const idleOverlay = document.getElementById('cameraIdleOverlay');
  const scannerOverlay = document.getElementById('scannerOverlay');
  const wrapper = document.getElementById('cameraViewfinderWrapper');

  if (typeof Html5Qrcode === 'undefined') {
    showToast('Camera scanner library loading. Please try again.');
    return;
  }

  try {
    if (!html5QrScannerInstance) {
      html5QrScannerInstance = new Html5Qrcode('qrReaderView');
    }

    const cameraId = deviceSelect?.value || currentCameraId || { facingMode: 'environment' };

    await html5QrScannerInstance.start(
      cameraId,
      {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
          return { width: Math.round(edge), height: Math.round(edge) };
        },
        aspectRatio: 1.333333
      },
      (decodedText) => {
        handleQrScanSuccess(decodedText);
      },
      () => {}
    );

    isCameraActive = true;
    toggleBtn?.classList.add('active');
    if (toggleText) toggleText.textContent = 'Stop Camera';
    liveIndicator?.classList.add('active');
    if (statusText) statusText.textContent = 'Scanner ready &bull; Point at student pass';
    if (idleOverlay) idleOverlay.style.display = 'none';
    if (scannerOverlay) scannerOverlay.style.display = 'flex';
    wrapper?.classList.add('camera-running');
  } catch (err) {
    console.error('Failed to start camera scanner:', err);
    showToast('Camera access denied or camera not found. Enter pass ID manually.');
    if (statusText) statusText.textContent = 'Camera unavailable — enter ID manually below';
    if (idleOverlay) idleOverlay.style.display = 'flex';
    if (scannerOverlay) scannerOverlay.style.display = 'none';
    wrapper?.classList.remove('camera-running');
  }
}

async function stopCameraScanner() {
  const toggleBtn = document.getElementById('btnToggleCamera');
  const toggleText = document.getElementById('btnCameraToggleText');
  const liveIndicator = document.getElementById('cameraLiveIndicator');
  const statusText = document.getElementById('scannerStatusText');
  const idleOverlay = document.getElementById('cameraIdleOverlay');
  const scannerOverlay = document.getElementById('scannerOverlay');
  const wrapper = document.getElementById('cameraViewfinderWrapper');
  const torchBtn = document.getElementById('btnToggleTorch');

  if (html5QrScannerInstance && isCameraActive) {
    try {
      if (isTorchActive) {
        isTorchActive = false;
        if (torchBtn) torchBtn.classList.remove('active');
        const label = document.getElementById('torchBtnLabel');
        if (label) label.textContent = 'Torch';
      }
      await html5QrScannerInstance.stop();
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    }
  }

  isCameraActive = false;
  toggleBtn?.classList.remove('active');
  if (toggleText) toggleText.textContent = 'Start Camera';
  liveIndicator?.classList.remove('active');
  if (statusText) statusText.textContent = 'Camera paused';
  if (idleOverlay) idleOverlay.style.display = 'flex';
  if (scannerOverlay) scannerOverlay.style.display = 'none';
  wrapper?.classList.remove('camera-running');
}

function handleQrScanSuccess(decodedText) {
  const regId = extractRegIdFromText(decodedText);
  if (!regId) return;

  if (regId === lastScannedPassId && scanCooldownTimer) {
    return;
  }

  lastScannedPassId = regId;
  clearTimeout(scanCooldownTimer);
  scanCooldownTimer = setTimeout(() => {
    lastScannedPassId = null;
  }, 2500);

  playScanSuccessTone();
  showToast(`Pass Scanned: ${regId}`);
  fetchAndDisplayPass(regId);
}

async function fetchAndDisplayPass(regId) {
  const emptyState = document.getElementById('scannerEmptyState');
  const activeResult = document.getElementById('scannerActiveResult');

  if (!activeResult) return;

  if (emptyState) emptyState.style.display = 'none';
  activeResult.style.display = 'block';
  activeResult.innerHTML = `
    <div style="text-align: center; padding: 36px 16px;">
      <div class="table-loading-spinner" style="margin: 0 auto 14px;"></div>
      <p style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600;">Verifying Pass <strong style="color: var(--text-main); font-family: var(--font-mono);">${escapeHtml(regId)}</strong>...</p>
    </div>
  `;

  // Auto-scroll on mobile to make result instantly visible
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      document.getElementById('scannerResultContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(regId)}`, {
      method: 'GET',
      credentials: 'include'
    });

    const body = await res.json();

    if (!res.ok || !body.success || !body.data) {
      activeResult.innerHTML = `
        <div class="verified-pass-card">
          <div class="pass-status-banner status-unpaid">
            <span>❌ INVALID PASS / NOT FOUND</span>
            <span style="font-family: var(--font-mono); font-size: 0.85rem;">ID: ${escapeHtml(regId)}</span>
          </div>
          <div style="padding: 24px; text-align: center; background: #FFF5F5; border-radius: var(--radius-md); border: 1px solid #FECDD3;">
            <p style="color: #E11D48; font-weight: 700; margin-bottom: 6px; font-size: 1rem;">No Registered Student Found</p>
            <p style="color: #64748B; font-size: 0.82rem; margin-bottom: 14px;">Identifier <strong style="font-family: monospace;">${escapeHtml(regId)}</strong> does not exist in the carnival database.</p>
            <button type="button" class="btn-verify-manual" onclick="window.clearScannerResult()">Scan Another Pass</button>
          </div>
        </div>
      `;
      return;
    }

    const reg = body.data;
    const isPaid = reg.paymentStatus === 'paid';
    const isPendingVer = reg.paymentStatus === 'payment_verification_pending';
    const fee = reg.totalAmount != null ? reg.totalAmount : (reg.feeAmount != null ? reg.feeAmount : (reg.registrationFee || 10));
    const student = reg.student || {};

    let bannerClass = 'status-unpaid';
    let bannerText = `PAYMENT PENDING &bull; ₹${fee}`;
    if (isPaid) {
      bannerClass = 'status-valid';
      bannerText = '✓ VALID PASS &bull; ENTRY GRANTED';
    } else if (isPendingVer) {
      bannerClass = 'status-pending';
      bannerText = `⚠ AUDIT NEEDED &bull; ₹${fee}`;
    }

    const gamesHtml = (reg.selectedGames || []).map(g => {
      const type = g.participationType === 'team' ? `Team: ${escapeHtml(g.teamName || 'Squad')}` : 'Solo';
      return `
        <div class="pass-game-item">
          <span class="pass-game-name">${escapeHtml(g.gameName || g.gameId)}</span>
          <span class="pass-game-type">${type}</span>
        </div>
      `;
    }).join('');

    activeResult.innerHTML = `
      <div class="verified-pass-card">
        <div class="pass-status-banner ${bannerClass}">
          <span>${bannerText}</span>
          <span class="pass-badge-id">${escapeHtml(reg.registrationId)}</span>
        </div>

        <div class="pass-student-info">
          <div class="pass-student-header">
            <div>
              <div class="pass-student-name">${escapeHtml(student.fullName || 'Student')}</div>
              <div class="pass-student-sub">${escapeHtml(student.course || 'SRMU')}${student.branch ? ` &bull; ${escapeHtml(student.branch)}` : ''}</div>
            </div>
            <span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">${escapeHtml(reg.registrationId)}</span>
          </div>

          <div class="pass-meta-grid">
            <div class="pass-meta-item">
              <span class="pass-meta-label">Academic Year</span>
              <span class="pass-meta-value">Year ${escapeHtml(student.academicYear || '1')}</span>
            </div>
            <div class="pass-meta-item">
              <span class="pass-meta-label">Pass Fee</span>
              <span class="pass-meta-value" style="color: #92400E; font-weight: 800;">₹${fee} All-Access</span>
            </div>
            <div class="pass-meta-item">
              <span class="pass-meta-label">Contact Mobile</span>
              <span class="pass-meta-value">
                ${student.mobileNumber ? `<a href="tel:${escapeHtml(student.mobileNumber)}" style="color: #059669; text-decoration: none; font-weight: 700;">📞 ${escapeHtml(student.mobileNumber)}</a>` : 'N/A'}
              </span>
            </div>
            <div class="pass-meta-item">
              <span class="pass-meta-label">UTR Reference</span>
              <span class="pass-meta-value" style="font-family: var(--font-mono); font-size: 0.78rem;">${escapeHtml(reg.paymentReference || 'None')}</span>
            </div>
          </div>
        </div>

        <div class="pass-games-section">
          <div class="pass-section-heading">Selected Carnival Events (${(reg.selectedGames || []).length})</div>
          <div class="pass-games-list">
            ${gamesHtml || '<p style=\"color: var(--text-dim); font-size: 0.8rem;\">All-Access Pass Holder</p>'}
          </div>
        </div>

        <div class="pass-actions-bar">
          <button type="button" class="btn-admit-pass" id="btnAdmitStudent" onclick="window.admitScannedStudent('${escapeHtml(reg.registrationId)}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>✓ Admit &amp; Check In</span>
          </button>

          ${!isPaid ? `
            <button type="button" class="btn-approve-payment-scanner" onclick="window.approveScannedPayment('${escapeHtml(reg.registrationId)}')">
              💳 Mark Paid (₹${fee})
            </button>
          ` : ''}

          <button type="button" class="btn-scan-next" onclick="window.clearScannerResult();" title="Scan next pass">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            <span>Scan Next</span>
          </button>

          <button type="button" class="btn-details-scanner" onclick="window.openRegistrationModal('${escapeHtml(reg.registrationId)}')">
            Profile
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error fetching registration for scanner:', err);
    activeResult.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #E11D48;">
        <p style="font-weight: 700;">Network error connecting to verification service.</p>
        <button type="button" class="btn-verify-manual" style="margin-top: 10px;" onclick="window.clearScannerResult()">Try Again</button>
      </div>
    `;
  }
}

window.clearScannerResult = function() {
  const emptyState = document.getElementById('scannerEmptyState');
  const activeResult = document.getElementById('scannerActiveResult');
  if (emptyState) emptyState.style.display = 'block';
  if (activeResult) {
    activeResult.style.display = 'none';
    activeResult.innerHTML = '';
  }
  const manualInput = document.getElementById('manualPassIdInput');
  if (manualInput) {
    manualInput.value = '';
    manualInput.focus();
  }
};

window.admitScannedStudent = async function(regId) {
  const btn = document.getElementById('btnAdmitStudent');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="table-loading-spinner" style="width: 14px; height: 14px; display: inline-block;"></span> Admitting...';
  }
  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/certificates/verify-participation/${encodeURIComponent(regId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`Student ${regId} Admitted & Checked In!`);
      if (btn) {
        btn.style.background = '#059669';
        btn.innerHTML = '✓ Admitted &amp; Checked In';
      }
    } else {
      showToast(data.error || 'Failed to record admission.');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Admit &amp; Check In';
      }
    }
  } catch (err) {
    console.error('Admit error:', err);
    showToast('Network error marking student admission.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Admit &amp; Check In';
    }
  }
};

window.approveScannedPayment = async function(regId) {
  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(regId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentStatus: 'paid',
        status: 'confirmed',
        notes: 'Verified via Gate QR Pass Scanner'
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`Payment Approved for ${regId}`);
      fetchAndDisplayPass(regId);
      refreshCurrentView();
    } else {
      showToast(data.error || 'Failed to update payment status.');
    }
  } catch (err) {
    console.error('Approve payment error:', err);
    showToast('Network error approving payment.');
  }
};

// ============================================================================
// 10. GAMES & ACTIVITIES CATALOGUE MANAGEMENT (PHASE 8 ADMIN CONTROL)
// ============================================================================

let adminGamesList = [];

function initGamesManagement() {
  // Pre-load games immediately
  loadAdminGamesData();

  const addBtn = document.getElementById('btnOpenAddGameModal');
  addBtn?.addEventListener('click', () => {
    window.openAddGameModal();
  });

  const activeCheckbox = document.getElementById('gameActiveCheckbox');
  const activeLabel = document.getElementById('gameActiveStatusText');
  activeCheckbox?.addEventListener('change', () => {
    if (activeLabel) {
      activeLabel.textContent = activeCheckbox.checked ? 'Active' : 'Hidden / Inactive';
      activeLabel.style.color = activeCheckbox.checked ? '#10B981' : '#94A3B8';
    }
  });

  const gameModal = document.getElementById('gameEditorModal');
  gameModal?.addEventListener('click', (e) => {
    if (e.target === gameModal) {
      window.closeGameEditorModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameModal?.classList.contains('is-open')) {
      window.closeGameEditorModal();
    }
  });
}

let adminGameStatusFilter = 'all';
let adminGameSearchQuery = '';
let adminGameCategoryFilter = 'all';

function broadcastGamesUpdate() {
  try {
    localStorage.setItem('srmu_games_updated_at', String(Date.now()));
    const ch = new BroadcastChannel('srmu_carnival_sync');
    ch.postMessage({ type: 'GAMES_UPDATED', timestamp: Date.now() });
    ch.close();
  } catch (e) {}
}

window.setAdminGameStatusFilter = function(status) {
  adminGameStatusFilter = status;
  ['all', 'active', 'hidden'].forEach(s => {
    const btn = document.getElementById(`btnFilter${s.charAt(0).toUpperCase() + s.slice(1)}Games`);
    if (btn) {
      if (s === status) {
        btn.classList.add('active-pill');
        btn.style.background = 'var(--carnival-gold)';
        btn.style.color = '#000';
      } else {
        btn.classList.remove('active-pill');
        btn.style.background = '';
        btn.style.color = '';
      }
    }
  });
  filterAndRenderAdminGames();
};

window.handleAdminGameFilterChange = function() {
  adminGameSearchQuery = (document.getElementById('adminGameSearchInput')?.value || '').trim().toLowerCase();
  adminGameCategoryFilter = document.getElementById('adminGameCategoryFilter')?.value || 'all';
  filterAndRenderAdminGames();
};

function filterAndRenderAdminGames() {
  if (!Array.isArray(adminGamesList)) return;

  const filtered = adminGamesList.filter(game => {
    const isActive = game.isActive !== false;
    if (adminGameStatusFilter === 'active' && !isActive) return false;
    if (adminGameStatusFilter === 'hidden' && isActive) return false;

    if (adminGameCategoryFilter !== 'all' && (game.category || '').toLowerCase() !== adminGameCategoryFilter.toLowerCase()) {
      return false;
    }

    if (adminGameSearchQuery) {
      const q = adminGameSearchQuery;
      const matchName = (game.name || '').toLowerCase().includes(q);
      const matchCat = (game.category || '').toLowerCase().includes(q);
      const matchDesc = (game.shortDescription || game.description || '').toLowerCase().includes(q);
      const matchRules = Array.isArray(game.proposedRules) && game.proposedRules.some(r => r.toLowerCase().includes(q));
      if (!matchName && !matchCat && !matchDesc && !matchRules) return false;
    }

    return true;
  });

  renderAdminGameCards(filtered);
}

async function loadAdminGamesData(isSilent = false) {
  const container = document.getElementById('adminGamesContainer');
  if (!container) return;

  const hasExistingCards = container.querySelectorAll('.admin-game-card').length > 0;
  if (!hasExistingCards && !isSilent) {
    container.innerHTML = `<div class="empty-state-card" style="padding: 30px; text-align: center; color: var(--text-dim);">Loading games catalogue...</div>`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/games-catalogue`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (!hasExistingCards) {
        container.innerHTML = `<div class="empty-state-card" style="padding: 30px; text-align: center; color: var(--text-dim);">Failed to load games: ${escapeHtml(data.error || 'Server error')}</div>`;
      }
      return;
    }

    adminGamesList = data.games || [];

    // Update stats strip
    const total = adminGamesList.length;
    const activeCount = adminGamesList.filter(g => g.isActive !== false).length;
    const hiddenCount = total - activeCount;

    const elTotal = document.getElementById('statTotalGames');
    if (elTotal) elTotal.textContent = total;
    const elActive = document.getElementById('statActiveGames');
    if (elActive) elActive.textContent = activeCount;
    const elHidden = document.getElementById('statHiddenGames');
    if (elHidden) elHidden.textContent = hiddenCount;

    const pillAll = document.getElementById('countPillAll');
    if (pillAll) pillAll.textContent = total;
    const pillActive = document.getElementById('countPillActive');
    if (pillActive) pillActive.textContent = activeCount;
    const pillHidden = document.getElementById('countPillHidden');
    if (pillHidden) pillHidden.textContent = hiddenCount;

    // Update categories dropdown
    const catSelect = document.getElementById('adminGameCategoryFilter');
    if (catSelect) {
      const currentCatVal = catSelect.value || 'all';
      const categories = Array.from(new Set(adminGamesList.map(g => g.category || 'General').filter(Boolean))).sort();
      catSelect.innerHTML = `<option value="all">All Categories</option>` + 
        categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      catSelect.value = categories.includes(currentCatVal) ? currentCatVal : 'all';
    }

    filterAndRenderAdminGames();
  } catch (err) {
    console.error('Error loading games catalogue:', err);
    if (!hasExistingCards) {
      container.innerHTML = `<div class="empty-state-card" style="padding: 30px; text-align: center; color: var(--text-dim);">Network error loading games catalogue.</div>`;
    }
  }
}

function renderAdminGameCards(games) {
  const container = document.getElementById('adminGamesContainer');
  if (!container) return;

  if (!games || games.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--color-border); grid-column: 1 / -1;">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 10px;">🎯</span>
        <h4 style="color: var(--text-main); font-weight: 700; margin-bottom: 6px;">No games match your filter</h4>
        <p style="color: var(--text-dim); margin-bottom: 16px; font-size: 0.85rem;">Try clearing the search input or switching status filter tabs.</p>
        <button type="button" class="btn-primary" onclick="window.setAdminGameStatusFilter('all'); document.getElementById('adminGameSearchInput').value=''; window.handleAdminGameFilterChange();">
          Reset Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="admin-games-grid-layout" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
      ${games.map(game => {
        const isActive = game.isActive !== false;
        const format = game.participationType || 'Individual';
        const rulesCount = Array.isArray(game.proposedRules) ? game.proposedRules.length : (game.proposedRules ? 1 : 0);

        return `
          <div class="admin-game-card ${isActive ? 'card-active' : 'card-inactive'}" style="background: var(--bg-card); border: 1px solid ${isActive ? 'rgba(212, 175, 55, 0.35)' : 'var(--color-border)'}; border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: all 0.2s ease; box-shadow: ${isActive ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'};">
            <div>
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
                <div>
                  <span style="display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--carnival-gold); margin-bottom: 4px;">
                    ${escapeHtml(game.category || 'General')}
                  </span>
                  <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0; line-height: 1.3;">
                    ${escapeHtml(game.name)}
                  </h4>
                </div>
                <span class="status-pill ${isActive ? 'status-paid' : 'status-payment_failed'}" style="font-size: 0.72rem; padding: 3px 10px; border-radius: 9999px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isActive ? '#10B981' : '#F59E0B'}; display: inline-block;"></span>
                  ${isActive ? 'Live on Portal' : 'Hidden'}
                </span>
              </div>

              <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; margin-bottom: 14px; min-height: 38px;">
                ${escapeHtml(game.shortDescription || game.description || 'Exciting campus carnival game.')}
              </p>

              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">
                <span class="badge" style="font-size: 0.75rem; background: var(--bg-surface-secondary); color: var(--text-main); border: 1px solid var(--color-border); border-radius: 6px; padding: 3px 8px;">
                  👥 ${escapeHtml(format)}
                </span>
                <span class="badge" style="font-size: 0.72rem; background: rgba(16, 185, 129, 0.1); color: #6EE7B7; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px; padding: 3px 8px;">
                  🎟️ All-Access Pass
                </span>
                ${game.suggestedDuration ? `
                  <span class="badge" style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.1); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 6px; padding: 3px 8px;">
                    ⏱️ ${escapeHtml(game.suggestedDuration)}
                  </span>
                ` : ''}
                <span class="badge" style="font-size: 0.72rem; background: rgba(59, 130, 246, 0.1); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 6px; padding: 3px 8px;">
                  📜 ${rulesCount} Rules
                </span>
                <span class="badge" style="font-size: 0.70rem; background: rgba(255, 255, 255, 0.05); color: var(--text-dim); border: 1px solid var(--color-border); border-radius: 6px; padding: 3px 6px;">
                  ID: ${escapeHtml(game.id)}
                </span>
              </div>
            </div>

            <div class="game-card-actions" style="display: grid; grid-template-columns: 1fr 1fr 42px; gap: 8px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 4px;">
              <button type="button" 
                      onclick="window.openEditGameModal('${encodeURIComponent(game.id)}')" 
                      title="Edit carnival game specifications"
                      style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; font-size: 0.8rem; font-weight: 700; color: #93C5FD; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
                      onmouseenter="this.style.background='rgba(59, 130, 246, 0.25)'; this.style.borderColor='#60A5FA'; this.style.transform='translateY(-1px)';"
                      onmouseleave="this.style.background='rgba(59, 130, 246, 0.12)'; this.style.borderColor='rgba(59, 130, 246, 0.35)'; this.style.transform='none';">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>

              <button type="button" 
                      onclick="window.handleToggleGame('${encodeURIComponent(game.id)}')" 
                      title="${isActive ? 'Hide game from public registration' : 'Show game on public registration'}"
                      style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; font-size: 0.8rem; font-weight: 700; color: ${isActive ? '#FCD34D' : '#6EE7B7'}; background: ${isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.14)'}; border: 1px solid ${isActive ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
                      onmouseenter="this.style.background='${isActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}'; this.style.borderColor='${isActive ? '#F59E0B' : '#10B981'}'; this.style.transform='translateY(-1px)';"
                      onmouseleave="this.style.background='${isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.14)'}'; this.style.borderColor='${isActive ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}'; this.style.transform='none';">
                ${isActive ? `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <span>Hide</span>
                ` : `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Show</span>
                `}
              </button>

              <button type="button" 
                      onclick="window.handleDeleteGame('${encodeURIComponent(game.id)}')" 
                      title="Permanently delete game"
                      aria-label="Delete Game"
                      style="display: inline-flex; align-items: center; justify-content: center; padding: 8px; font-size: 0.85rem; color: #FCA5A5; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
                      onmouseenter="this.style.background='rgba(239, 68, 68, 0.28)'; this.style.borderColor='#EF4444'; this.style.color='#FFF'; this.style.transform='translateY(-1px)';"
                      onmouseleave="this.style.background='rgba(239, 68, 68, 0.12)'; this.style.borderColor='rgba(239, 68, 68, 0.35)'; this.style.color='#FCA5A5'; this.style.transform='none';">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.openAddGameModal = function() {
  const modal = document.getElementById('gameEditorModal');
  const title = document.getElementById('modalGameEditorTitle');
  const form = document.getElementById('gameEditorForm');
  if (!modal || !form) return;

  form.reset();
  const editId = document.getElementById('editGameId');
  if (editId) editId.value = '';
  const feeInput = document.getElementById('gameFeeInput');
  if (feeInput) feeInput.value = '0';
  const durationInput = document.getElementById('gameDurationInput');
  if (durationInput) durationInput.value = '3 to 5 minutes';
  const teamSizeInput = document.getElementById('gameTeamSizeInput');
  if (teamSizeInput) teamSizeInput.value = 'Individual';
  const procedureInput = document.getElementById('gameProcedureTextarea');
  if (procedureInput) procedureInput.value = '';
  const materialsInput = document.getElementById('gameMaterialsInput');
  if (materialsInput) materialsInput.value = 'Supplied at arena.';
  const winningInput = document.getElementById('gameWinningInput');
  if (winningInput) winningInput.value = 'Highest score or completion speed.';
  const safetyInput = document.getElementById('gameSafetyTextarea');
  if (safetyInput) safetyInput.value = 'Closed-toe footwear mandatory.\nAdhere to arena marshal instructions.';
  
  const activeCheck = document.getElementById('gameActiveCheckbox');
  if (activeCheck) activeCheck.checked = true;
  const activeLabel = document.getElementById('gameActiveStatusText');
  if (activeLabel) {
    activeLabel.textContent = 'Active (Live on Portal)';
    activeLabel.style.color = '#10B981';
  }

  if (title) title.textContent = 'Add New Carnival Game';
  modal.classList.add('is-open', 'active');
  modal.setAttribute('aria-hidden', 'false');
};

window.openEditGameModal = async function(rawId) {
  const gameId = typeof rawId === 'string' ? decodeURIComponent(rawId) : rawId;
  let game = (adminGamesList || []).find(g => g.id === gameId);
  if (!game) {
    await loadAdminGamesData();
    game = (adminGamesList || []).find(g => g.id === gameId);
  }
  if (!game) {
    try {
      const res = await adminApiFetch(`${API_BASE_URL}/api/admin/games-catalogue`);
      const data = await res.json();
      if (data && Array.isArray(data.games)) {
        adminGamesList = data.games;
        game = adminGamesList.find(g => g.id === gameId);
      }
    } catch (e) {}
  }
  if (!game) {
    showToast('Game not found in catalogue.');
    return;
  }

  const modal = document.getElementById('gameEditorModal');
  const title = document.getElementById('modalGameEditorTitle');
  if (!modal) return;

  const editId = document.getElementById('editGameId');
  if (editId) editId.value = game.id;
  const titleInput = document.getElementById('gameTitleInput');
  if (titleInput) titleInput.value = game.name || '';
  const catInput = document.getElementById('gameCategoryInput');
  if (catInput) catInput.value = game.category || '';
  const feeInput = document.getElementById('gameFeeInput');
  if (feeInput) feeInput.value = '0';
  
  const formatSelect = document.getElementById('gameFormatSelect');
  if (formatSelect) {
    const targetFormat = game.participationType || game.format || 'Individual';
    let matched = false;
    for (let i = 0; i < formatSelect.options.length; i++) {
      if (formatSelect.options[i].value.toLowerCase() === targetFormat.toLowerCase() ||
          formatSelect.options[i].value === targetFormat) {
        formatSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const opt = document.createElement('option');
      opt.value = targetFormat;
      opt.textContent = targetFormat;
      formatSelect.appendChild(opt);
      formatSelect.value = targetFormat;
    }
  }

  const durationInput = document.getElementById('gameDurationInput');
  if (durationInput) durationInput.value = game.suggestedDuration || '';
  const teamSizeInput = document.getElementById('gameTeamSizeInput');
  if (teamSizeInput) teamSizeInput.value = game.suggestedTeamSize || game.participationType || '';

  const shortDesc = document.getElementById('gameShortDescInput');
  if (shortDesc) shortDesc.value = game.shortDescription || '';
  const desc = document.getElementById('gameDescTextarea');
  if (desc) desc.value = game.description || game.objective || '';
  
  const rules = Array.isArray(game.proposedRules) ? game.proposedRules.join('\n') : (game.proposedRules || game.rules || '');
  const rulesInput = document.getElementById('gameRulesTextarea');
  if (rulesInput) rulesInput.value = rules;

  const procedure = Array.isArray(game.procedure) ? game.procedure.join('\n') : (game.procedure || '');
  const procedureInput = document.getElementById('gameProcedureTextarea');
  if (procedureInput) procedureInput.value = procedure;

  const materialsInput = document.getElementById('gameMaterialsInput');
  if (materialsInput) materialsInput.value = game.materials || '';
  const winningInput = document.getElementById('gameWinningInput');
  if (winningInput) winningInput.value = game.winningCriteria || '';

  const safety = Array.isArray(game.safetyNotes) ? game.safetyNotes.join('\n') : (game.safetyNotes || '');
  const safetyInput = document.getElementById('gameSafetyTextarea');
  if (safetyInput) safetyInput.value = safety;

  const activeCheck = document.getElementById('gameActiveCheckbox');
  const activeLabel = document.getElementById('gameActiveStatusText');
  if (activeCheck) {
    activeCheck.checked = game.isActive !== false;
    if (activeLabel) {
      activeLabel.textContent = activeCheck.checked ? 'Active (Live on Portal)' : 'Hidden / Offline';
      activeLabel.style.color = activeCheck.checked ? '#10B981' : '#F59E0B';
    }
  }

  if (title) title.textContent = `Edit Game: ${game.name}`;
  modal.classList.add('is-open', 'active');
  modal.setAttribute('aria-hidden', 'false');
};

window.closeGameEditorModal = function() {
  const modal = document.getElementById('gameEditorModal');
  if (!modal) return;
  modal.classList.remove('is-open', 'active');
  modal.setAttribute('aria-hidden', 'true');
};

window.handleGameEditorSubmit = async function(event) {
  if (event) event.preventDefault();
  const editId = document.getElementById('editGameId')?.value;
  const isEditing = Boolean(editId);

  const payload = {
    name: document.getElementById('gameTitleInput')?.value?.trim(),
    category: document.getElementById('gameCategoryInput')?.value?.trim(),
    feeAmount: 0,
    registrationFee: 'Included with All-Access Pass',
    participationType: document.getElementById('gameFormatSelect')?.value || 'Individual',
    suggestedDuration: document.getElementById('gameDurationInput')?.value?.trim() || '3 to 5 minutes',
    suggestedTeamSize: document.getElementById('gameTeamSizeInput')?.value?.trim() || 'Individual',
    shortDescription: document.getElementById('gameShortDescInput')?.value?.trim(),
    description: document.getElementById('gameDescTextarea')?.value?.trim(),
    objective: document.getElementById('gameDescTextarea')?.value?.trim(),
    proposedRules: document.getElementById('gameRulesTextarea')?.value?.split('\n').map(s => s.trim()).filter(Boolean),
    procedure: document.getElementById('gameProcedureTextarea')?.value?.split('\n').map(s => s.trim()).filter(Boolean),
    materials: document.getElementById('gameMaterialsInput')?.value?.trim(),
    winningCriteria: document.getElementById('gameWinningInput')?.value?.trim(),
    safetyNotes: document.getElementById('gameSafetyTextarea')?.value?.split('\n').map(s => s.trim()).filter(Boolean),
    isActive: document.getElementById('gameActiveCheckbox')?.checked !== false
  };

  if (!payload.name) {
    showToast('Game Title / Name is required.');
    return false;
  }

  const submitBtn = document.getElementById('btnSubmitGame');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    const url = isEditing
      ? `${API_BASE_URL}/api/admin/games-catalogue/${encodeURIComponent(editId)}`
      : `${API_BASE_URL}/api/admin/games-catalogue`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await adminApiFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      showToast('Your session has expired. Redirecting to login...');
      setTimeout(() => window.location.replace('login.html'), 1200);
      return false;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to save game.');
      return false;
    }

    broadcastGamesUpdate();
    showToast(isEditing ? `✓ Game "${payload.name}" updated! Changes are live on User Portal.` : `✓ New game "${payload.name}" added! Live on User Portal.`);
    window.closeGameEditorModal();
    await loadAdminGamesData();
    refreshCurrentView();
  } catch (err) {
    console.error('Error saving game:', err);
    showToast('Network error saving game details.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Game';
    }
  }
  return false;
};

window.handleToggleGame = async function(rawId) {
  try {
    const gameId = typeof rawId === 'string' ? decodeURIComponent(rawId) : rawId;
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/games-catalogue/${encodeURIComponent(gameId)}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      broadcastGamesUpdate();
      showToast(data.message ? `✓ ${data.message} Live on User Portal.` : '✓ Status updated & live on User Portal.');
      await loadAdminGamesData();
    } else {
      showToast(data.error || 'Failed to toggle game status.');
    }
  } catch (err) {
    showToast('Network error updating game status.');
  }
};

window.handleDeleteGame = async function(rawId) {
  const gameId = typeof rawId === 'string' ? decodeURIComponent(rawId) : rawId;
  const game = (adminGamesList || []).find(g => g.id === gameId);
  const gameName = game ? game.name : gameId;

  if (!confirm(`Are you sure you want to delete "${gameName}"? This will remove it from the active festival lineup and the live portal.`)) {
    return;
  }

  try {
    const res = await adminApiFetch(`${API_BASE_URL}/api/admin/games-catalogue/${encodeURIComponent(gameId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      broadcastGamesUpdate();
      showToast(`✓ Game "${gameName}" removed from catalogue & live portal.`);
      await loadAdminGamesData();
    } else {
      showToast(data.error || 'Failed to delete game.');
    }
  } catch (err) {
    showToast('Network error deleting game.');
  }
};


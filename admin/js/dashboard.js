/**
 * Vijayadashami Carnival — Secure Admin Dashboard Controller
 * Phase 6 Organizer Management System
 */

const API_BASE_URL = window.API_BASE_URL || (
  window.location.protocol === 'file:'
    ? 'http://localhost:5000'
    : (
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '3000'
          ? 'http://localhost:5000'
          : ''
      )
);

// State Management
let currentAdmin = null;
let csrfToken = null;
let currentView = 'overview';

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

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await checkSession();
  if (!isAuthed) return;

  initNavigation();
  initOverview();
  initRegistrationsTable();
  initPaymentsTable();
  initPaymentQrConfig();
  initCertificatesTable();
  initGamewiseRoster();
  initExportSection();
  initModalActions();
  initScanner();

  // Real-Time live auto-refresh every 10s for on-ground festival desk
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      refreshCurrentView();
    }
  }, 10000);
});

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
    await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
    });
  } catch (err) {
    console.warn('Logout network error:', err);
  } finally {
    sessionStorage.removeItem('srmu_csrf_token');
    sessionStorage.removeItem('srmu_admin_user');
    window.location.replace('login.html');
  }
}

// ============================================================================
// 2. NAVIGATION & VIEW SWITCHING
// ============================================================================

function initNavigation() {
  const navButtons = document.querySelectorAll('.sidebar-nav-item[data-view]');
  const logoutBtn = document.getElementById('btnLogoutSidebar');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileClose = document.getElementById('mobileSidebarClose');
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebar = document.getElementById('dashboardSidebar');
  const refreshBtn = document.getElementById('btnRefreshData');

  const closeSidebarMobile = () => {
    sidebar?.classList.remove('mobile-open');
    backdrop?.classList.remove('active');
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
      if (window.innerWidth <= 992) {
        closeSidebarMobile();
      }
    });
  });

  logoutBtn?.addEventListener('click', handleLogout);

  mobileToggle?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.toggle('mobile-open');
    if (isOpen) {
      backdrop?.classList.add('active');
    } else {
      backdrop?.classList.remove('active');
    }
  });

  mobileClose?.addEventListener('click', closeSidebarMobile);
  backdrop?.addEventListener('click', closeSidebarMobile);

  const bottomNavButtons = document.querySelectorAll('.bottom-nav-item[data-view]');
  bottomNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Topbar & Quick Action Hub shortcuts
  const quickScanBtn = document.getElementById('btnQuickScanPass');
  quickScanBtn?.addEventListener('click', () => switchView('scanner'));

  document.getElementById('btnQuickHubScan')?.addEventListener('click', () => switchView('scanner'));
  document.getElementById('btnQuickHubPayments')?.addEventListener('click', () => switchView('payments'));
  document.getElementById('btnQuickHubRegistrations')?.addEventListener('click', () => switchView('registrations'));
  document.getElementById('btnQuickHubGamewise')?.addEventListener('click', () => switchView('gamewise'));

  refreshBtn?.addEventListener('click', () => {
    refreshCurrentView();
    showToast('Dashboard data refreshed.');
  });
}

function switchView(viewName) {
  // If leaving scanner view, stop camera stream to save resources
  if (currentView === 'scanner' && viewName !== 'scanner') {
    if (typeof stopCameraScanner === 'function') {
      stopCameraScanner();
    }
  }

  currentView = viewName;

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
    payments: 'viewPayments',
    certificates: 'viewCertificates',
    export: 'viewExport'
  };

  const titleMap = {
    overview: 'Dashboard Overview',
    registrations: 'All Registrations Management',
    scanner: 'QR Pass Scanner & Student Verification',
    gamewise: 'Game-wise Participants Roster',
    payments: 'Payment Management & Desk Verification',
    certificates: 'Participation Certificates & Attendance Verification',
    export: 'CSV Data Export'
  };

  document.querySelectorAll('.dashboard-view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const activeSec = document.getElementById(viewMap[viewName]);
  if (activeSec) {
    activeSec.classList.add('active');
  }

  const topbarTitle = document.getElementById('topbarPageTitle');
  if (topbarTitle) {
    topbarTitle.textContent = titleMap[viewName] || 'Dashboard';
  }

  // Load view data
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
  } else if (viewName === 'scanner') {
    const manualInput = document.getElementById('manualPassIdInput');
    manualInput?.focus();
  }
}

function refreshCurrentView() {
  if (currentView === 'overview') loadOverviewData();
  else if (currentView === 'registrations') loadRegistrationsData();
  else if (currentView === 'payments') loadPaymentsData();
  else if (currentView === 'certificates') loadCertificatesData();
  else if (currentView === 'gamewise') loadGamewiseData(activeGameId);
}

// ============================================================================
// 3. OVERVIEW VIEW HANDLERS
// ============================================================================

function initOverview() {
  loadOverviewData();
}

async function loadOverviewData() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) checkSession();
      return;
    }

    const { data } = await res.json();
    if (!data) return;

    // Metrics summary
    const s = data.summary;
    document.getElementById('metricTotalRegistrations').textContent = s.totalRegistrations || 0;
    document.getElementById('metricTotalGameEntries').textContent = s.totalSelectedGameEntries || 0;
    document.getElementById('metricIndividualEntries').textContent = s.totalIndividualEntries || 0;
    document.getElementById('metricTeamEntries').textContent = s.totalTeamEntries || 0;
    document.getElementById('metricTeamMembersSub').textContent = `${s.totalTeamMembersListed || 0} team members listed`;

    const verifiedEl = document.getElementById('metricVerifiedAttendees');
    if (verifiedEl) verifiedEl.textContent = s.verifiedParticipantsCount || 0;

    const certIssuedEl = document.getElementById('metricCertificatesIssued');
    if (certIssuedEl) certIssuedEl.textContent = s.certificatesIssuedCount || 0;

    // Payment Summary Metrics (Phase 5)
    const paidPaymentsEl = document.getElementById('metricPaidPayments');
    if (paidPaymentsEl) paidPaymentsEl.textContent = s.paidPaymentsCount || 0;

    const pendingVerPaymentsEl = document.getElementById('metricPendingVerPayments');
    if (pendingVerPaymentsEl) pendingVerPaymentsEl.textContent = s.pendingVerificationCount || 0;

    const pendingPaymentsEl = document.getElementById('metricPendingPayments');
    if (pendingPaymentsEl) pendingPaymentsEl.textContent = s.pendingPaymentCount || 0;

    // 6 Games Breakdown
    renderOverviewGames(data.gameStats || []);

    // Recent Registrations
    renderOverviewRecent(data.recentRegistrations || []);

  } catch (err) {
    console.error('Failed to load overview data:', err);
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
          <span>Entries: <span class="stat-count-pill">${game.totalEntries || 0}</span></span>
          <span>Solo: <span class="stat-count-pill">${game.individualEntries || 0}</span></span>
          <span>Team: <span class="stat-count-pill">${game.teamEntries || 0}</span></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderOverviewRecent(recent) {
  const tbody = document.getElementById('overviewRecentTbody');
  if (!tbody) return;

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 30px;">No registrations recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(r => {
    const statusClass = `status-${r.status || 'confirmed'}`;
    const dateStr = formatDate(r.createdAt);
    return `
      <tr>
        <td data-label="ID"><span class="reg-id-badge">${escapeHtml(r.registrationId)}</span></td>
        <td data-label="Student"><strong>${escapeHtml(r.studentName)}</strong></td>
        <td data-label="Roll No">${escapeHtml(r.rollNumber || '—')}</td>
        <td data-label="Course">${escapeHtml(r.course)}</td>
        <td data-label="Games">${r.gamesCount} game${r.gamesCount !== 1 ? 's' : ''}</td>
        <td data-label="Status"><span class="status-pill ${statusClass}">${escapeHtml(r.status || 'confirmed')}</span></td>
        <td data-label="Date">${dateStr}</td>
        <td data-label="Action">
          <div class="action-btn-group">
            <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(r.registrationId)}')">
              Details
            </button>
            <button type="button" class="btn-table-action btn-revoke" onclick="window.deleteRegistrationQuick('${escapeHtml(r.registrationId)}', '${escapeHtml(r.studentName)}')" title="Delete participant">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Delete</span>
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

async function loadRegistrationsData() {
  const tbody = document.getElementById('registrationsTbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-dim); padding: 40px;">Loading records from MongoDB...</td></tr>`;

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

    if (!res.ok) {
      if (res.status === 401) checkSession();
      return;
    }

    const { registrations, pagination } = await res.json();
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
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-dim); padding: 40px;">No registrations match your search or filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = registrations.map(reg => {
      const student = reg.student || {};
      const statusClass = `status-${reg.status || 'confirmed'}`;
      const dateStr = formatDate(reg.createdAt);

      const gamesChips = (reg.selectedGames || []).map(g => {
        const isTeam = g.participationType === 'team';
        return `<span style="display: inline-block; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: rgba(255,255,255,0.06); margin: 2px;">
          ${escapeHtml(g.gameName || g.gameId)} ${isTeam ? '<strong style="color: #FCD34D;">[Team]</strong>' : ''}
        </span>`;
      }).join(' ');

      const fee = reg.feeAmount != null ? reg.feeAmount : (reg.selectedGames ? reg.selectedGames.length * 5 : 0);
      const isPaid = reg.paymentStatus === 'paid';
      const isPendingVer = reg.paymentStatus === 'payment_verification_pending';
      const isFailed = reg.paymentStatus === 'payment_failed';
      const paymentLabel = isPaid ? 'Verified' : (isPendingVer ? 'Audit Needed' : (isFailed ? 'Failed' : 'Pending'));
      const paymentClass = isPaid ? 'status-paid' : (isPendingVer ? 'status-payment_verification_pending' : (isFailed ? 'status-payment_failed' : 'status-payment_pending'));
      const utrBadge = reg.paymentReference ? `<div style="font-size: 0.7rem; font-family: monospace; color: #FCD34D; margin-top: 3px;" title="Submitted UTR: ${escapeHtml(reg.paymentReference)}">Ref: ${escapeHtml(reg.paymentReference)}</div>` : '';

      const subInfo = [
        student.rollNumber || '',
        student.course || '',
        student.branch ? `(${student.branch})` : ''
      ].filter(Boolean).join(' • ');

      return `
        <tr>
          <td data-label="ID">
            <span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">${escapeHtml(reg.registrationId)}</span>
          </td>
          <td data-label="Student">
            <div style="font-weight: 700; color: #FFFDF9; font-size: 0.92rem;">${escapeHtml(student.fullName)}</div>
            <div style="font-size: 0.74rem; color: var(--text-dim); margin-top: 2px;">${escapeHtml(subInfo || '—')}</div>
          </td>
          <td data-label="Games">
            <div style="font-size: 0.76rem; font-weight: 600; color: #FFFDF9; margin-bottom: 2px;">
              ${(reg.selectedGames || []).length} Game${(reg.selectedGames || []).length !== 1 ? 's' : ''}
            </div>
            ${gamesChips}
          </td>
          <td data-label="Fee"><strong style="color: #FCD34D; font-size: 0.95rem;">₹${fee}</strong></td>
          <td data-label="Payment">
            <span class="status-pill ${paymentClass}">${escapeHtml(paymentLabel)}</span>
            ${utrBadge}
          </td>
          <td data-label="Status"><span class="status-pill ${statusClass}">${escapeHtml(reg.status || 'confirmed')}</span></td>
          <td data-label="Action">
            <div class="action-btn-group">
              <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')" title="View complete details">
                Details
              </button>
              <button type="button" class="btn-table-action btn-revoke" onclick="window.deleteRegistrationQuick('${escapeHtml(reg.registrationId)}', '${escapeHtml(student.fullName)}')" title="Delete participant">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load registrations:', err);
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--red-light); padding: 40px;">Failed to load records from server.</td></tr>`;
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

async function loadGamewiseData(gameId) {
  const headerCard = document.getElementById('gamewiseGameHeader');
  const tbody = document.getElementById('gamewiseTbody');

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 30px;">Loading game roster...</td></tr>`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/games/${gameId}/registrations`, {
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) checkSession();
      return;
    }

    const { data } = await res.json();
    if (!data) return;

    // Header Card
    if (headerCard) {
      const g = data.game;
      const m = data.metrics;
      headerCard.innerHTML = `
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--sky); text-transform: uppercase;">Category: ${escapeHtml(g.category)} &bull; ${escapeHtml(g.rulesApprovalStatus)}</div>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: #FFFFFF; margin: 4px 0 8px 0;">${escapeHtml(g.name)}</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 600px;">${escapeHtml(g.description)}</p>
          </div>
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 18px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; display: block;">Total Entries</span>
              <strong style="font-size: 1.4rem; color: #FFFFFF;">${m.totalRegistrations}</strong>
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">No students have registered for this game yet.</td></tr>`;
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
            <td data-label="ID"><span class="reg-id-badge">${escapeHtml(p.registrationId)}</span></td>
            <td data-label="Student"><strong>${escapeHtml(p.studentName)}</strong></td>
            <td data-label="Roll No">${escapeHtml(p.rollNumber)}</td>
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
    }

    // Also load live heat scores for this game
    loadGamewiseScores(gameId);

  } catch (err) {
    console.error('Failed to load game participants:', err);
  }
}

async function loadGamewiseScores(gameId) {
  const tbody = document.getElementById('gamewiseScoresTbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 20px;">Loading live heat scores...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/config/scoreboard?gameId=${encodeURIComponent(gameId)}`);
    if (!res.ok) throw new Error('Failed to fetch game scores');
    const json = await res.json();
    const scores = Array.isArray(json.data) ? json.data : [];

    if (scores.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 24px;">No live heat scores recorded yet for this challenge. Click "Record Heat Score" above to add verified times or points.</td></tr>`;
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
            <div style="font-weight: 700; color: #FFFFFF;">${escapeHtml(s.participant_name)}</div>
          </td>
          <td data-label="Roll No">
            <span style="font-family: monospace; color: var(--text-muted);">${escapeHtml(s.roll_number || '—')}</span>
          </td>
          <td data-label="Score">
            <strong style="color: #FCD34D; font-size: 0.95rem;">${escapeHtml(s.score)}</strong>
          </td>
          <td data-label="Category">
            <span class="status-pill status-confirmed">${escapeHtml(s.category || 'Solo')}</span>
          </td>
          <td data-label="Recorded At">
            <span style="font-size: 0.8rem; color: var(--text-dim);">${formatDate(s.created_at)}</span>
          </td>
          <td data-label="Action">
            <button type="button" class="btn-table-action btn-revoke" onclick="window.deleteHeatScore('${escapeHtml(s.id)}')" title="Remove score from leaderboard">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load scoreboard:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--red-light); padding: 20px;">Could not load leaderboard scores.</td></tr>`;
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
        'Content-Type': 'application/json'
      },
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
      method: 'DELETE'
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

async function loadPaymentsData() {
  const tbody = document.getElementById('paymentsTbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 30px;">Loading payment audit records...</td></tr>`;

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

    if (!res.ok) {
      if (res.status === 401) checkSession();
      throw new Error('Failed to load payment records');
    }

    const { registrations, pagination } = await res.json();
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
          if (ptot) ptot.textContent = `₹${(sm.paidPaymentsCount || 0) * 5}`;
        }
      })
      .catch(() => {});

    renderPaymentsRows(registrations || []);

  } catch (err) {
    console.error('Failed to load payment records:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--red-light); padding: 30px;">Error loading payment records: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderPaymentsRows(registrations) {
  const tbody = document.getElementById('paymentsTbody');
  if (!tbody) return;

  if (registrations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 36px;">No payment records match your search or filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = registrations.map(reg => {
    const student = reg.student || {};
    const games = reg.selectedGames || [];
    const fee = reg.feeAmount != null ? reg.feeAmount : (games.length * 5);
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

    const gamesSummary = games.map(g => g.gameName || g.gameId).join(', ');
    const gamesDisplay = games.length > 0 
      ? `<span title="${escapeHtml(gamesSummary)}"><strong>${games.length}</strong> game${games.length > 1 ? 's' : ''}</span>`
      : '0 games';

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
      <tr>
        <td data-label="ID">
          <span class="reg-id-badge cursor-pointer" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">
            ${escapeHtml(reg.registrationId)}
          </span>
        </td>
        <td data-label="Student"><strong>${escapeHtml(student.fullName)}</strong></td>
        <td data-label="Roll No">${escapeHtml(student.rollNumber || '—')}</td>
        <td data-label="Games">${gamesDisplay}</td>
        <td data-label="Fee"><strong style="color: #FCD34D;">₹${fee}</strong></td>
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
  const confirmMsg = `Are you sure you want to delete participant ${nameLabel}?\n\nThis will permanently remove their registration, payment audit, and issued certificates.\nThis action cannot be undone.`;
  
  if (!window.confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete registration ${registrationId}`);
    }

    showToast(`✓ Participant ${registrationId} successfully deleted.`);
    
    // Close modal if open for this registration
    if (activeRegistrationInModal && activeRegistrationInModal.registrationId === registrationId) {
      closeModal();
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
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify({ paymentStatus: 'paid' })
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
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify({ 
        paymentStatus: 'paid',
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
  const qrUrlInput = document.getElementById('inputQrImageUrl');
  const badge = document.getElementById('qrStatusBadge');

  if (!form) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/config/payment-qr`);
    if (res.ok) {
      const { data } = await res.json();
      if (data) {
        if (upiIdInput && data.upi_id) upiIdInput.value = data.upi_id;
        if (upiNameInput && data.upi_name) upiNameInput.value = data.upi_name;
        if (qrUrlInput) qrUrlInput.value = data.qr_image_url || '';
        if (badge) {
          if (data.qr_image_url) {
            badge.className = 'status-pill status-paid';
            badge.textContent = 'Active QR Configured';
          } else {
            badge.className = 'status-pill status-unverified';
            badge.textContent = 'Blank Placeholder Active';
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch payment QR config:', err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const upi_id = upiIdInput ? upiIdInput.value.trim() : 'guptashrijaya-1@oksbi';
    const upi_name = upiNameInput ? upiNameInput.value.trim() : 'Shrijaya Gupta (SRMU B5-408 Carnival Desk)';
    const qr_image_url = qrUrlInput ? qrUrlInput.value.trim() : '/assets/official-upi-qr.jpg';

    try {
      const res = await fetch(`${API_BASE_URL}/api/config/payment-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          upi_id,
          upi_name,
          qr_image_url,
          is_qr_active: Boolean(qr_image_url)
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to update');
      }

      showToast('✓ UPI Payment QR configuration saved successfully!');
      if (badge) {
        if (qr_image_url) {
          badge.className = 'status-pill status-paid';
          badge.textContent = 'Active QR Configured';
        } else {
          badge.className = 'status-pill status-unverified';
          badge.textContent = 'Blank Placeholder Active';
        }
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  });
}

window.updatePaymentStatusDirect = async function(registrationId, paymentStatus) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(registrationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify({ paymentStatus })
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
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${registrationId}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      showToast('Could not load registration details.');
      return;
    }

    const { data } = await res.json();
    activeRegistrationInModal = data;

    // Populate modal fields
    document.getElementById('modalRegIdBadge').textContent = data.registrationId;
    document.getElementById('modalStudentName').textContent = data.student.fullName;
    document.getElementById('modalStudentMobile').textContent = data.student.mobileNumber || 'Not provided';
    document.getElementById('modalStudentRoll').textContent = data.student.rollNumber;
    document.getElementById('modalStudentAcademic').textContent = `${data.student.course} - ${data.student.branch} (${data.student.academicYear})`;
    document.getElementById('modalCreatedAt').textContent = formatDate(data.createdAt);

    // Direct phone call & WhatsApp links
    const rawMobile = data.student.mobileNumber ? String(data.student.mobileNumber).replace(/[^0-9]/g, '') : '';
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
        const textMsg = encodeURIComponent(`Namaste ${data.student.fullName}, regards from Vijayadashami Carnival (SRMU B5-408 Desk). Regarding your Registration ID: ${data.registrationId}:`);
        waBtn.href = `https://wa.me/91${clean10}?text=${textMsg}`;
        waBtn.style.display = 'inline-flex';
      } else {
        waBtn.style.display = 'none';
      }
    }

    // WhatsApp Consent badge
    const consentEl = document.getElementById('modalWhatsAppConsent');
    if (consentEl) {
      const consented = data.student.whatsAppConsent !== false;
      consentEl.innerHTML = consented
        ? `<span style="color: var(--emerald-light); font-weight: 700; font-size: 0.82rem;">✓ Subscribed for Event Alerts</span>`
        : `<span style="color: var(--text-dim); font-size: 0.82rem;">Not Opted In</span>`;
    }

    const statusPill = `<span class="status-pill status-${data.status || 'confirmed'}">${escapeHtml(data.status || 'confirmed')}</span>`;
    document.getElementById('modalStatusBadgeWrap').innerHTML = statusPill;

    // Fee & Payment Status
    const modalFeeEl = document.getElementById('modalRegistrationFee');
    const modalPayEl = document.getElementById('modalPaymentStatus');
    const feeVal = data.feeAmount != null ? data.feeAmount : (data.selectedGames ? data.selectedGames.length * 5 : 0);
    if (modalFeeEl) modalFeeEl.textContent = `₹${feeVal}.00 (₹5/game)`;
    if (modalPayEl) {
      const isPaid = data.paymentStatus === 'paid';
      const isPendingVer = data.paymentStatus === 'payment_verification_pending';
      const payClass = isPaid ? 'status-paid' : (isPendingVer ? 'status-payment_verification_pending' : (data.paymentStatus === 'payment_failed' ? 'status-payment_failed' : 'status-payment_pending'));
      const payLabel = isPaid ? 'Payment Verified' : (isPendingVer ? 'Payment Verification Pending' : (data.paymentStatus === 'payment_failed' ? 'Payment Failed' : 'Payment Pending'));
      const utrInfo = data.paymentReference ? `<div style="font-size: 0.75rem; color: #FCD34D; margin-top: 4px;">UTR/Ref: ${escapeHtml(data.paymentReference)}</div>` : '';
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
        payWorkflowDesc.innerHTML = `<span style="color: #FCD34D;">Student submitted transaction reference. Compare with official bank statement or desk cash before marking verified.</span>`;
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

    // Populate selected games & rosters
    const gamesWrap = document.getElementById('modalGamesContainer');
    if (gamesWrap) {
      gamesWrap.innerHTML = (data.selectedGames || []).map(g => {
        const isTeam = g.participationType === 'team';
        let teamHtml = '';

        if (isTeam) {
          const membersList = (g.teamMembers && g.teamMembers.length > 0)
            ? g.teamMembers.map(m => `<li><strong>${escapeHtml(m.name)}</strong> ${m.roll ? `(Roll: ${escapeHtml(m.roll)})` : ''} ${m.contact ? `&bull; Phone: ${escapeHtml(m.contact)}` : ''}</li>`).join('')
            : '<li><em>No additional members listed.</em></li>';

          teamHtml = `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 8px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #FCD34D;">Team Name: ${escapeHtml(g.teamName || 'Squad')}</div>
              <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 4px;">Roster Members:</div>
              <ul style="padding-left: 20px; font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                ${membersList}
              </ul>
            </div>
          `;
        }

        return `
          <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #FFFFFF; font-size: 0.95rem;">${escapeHtml(g.gameName || g.gameId)}</strong>
              <span class="status-pill ${isTeam ? 'status-pending' : 'status-confirmed'}">${isTeam ? 'Team Entry' : 'Solo / Individual'}</span>
            </div>
            ${teamHtml}
          </div>
        `;
      }).join('');
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
      const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${activeRegistrationInModal.registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
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

async function loadCertificatesData() {
  const tbody = document.getElementById('certificatesTbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-dim);">Loading participant records...</td></tr>`;

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

    if (!res.ok) {
      if (res.status === 401) checkSession();
      throw new Error('Failed to load certificates participant roster');
    }

    const data = await res.json();
    certPageState.total = data.totalCount || 0;
    certPageState.totalPages = data.totalPages || 1;

    renderCertificatesRows(data.participants || []);

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
    console.error('Error loading certificates data:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--red-light); padding: 24px;">Failed to load participant data.</td></tr>`;
  }
}

function renderCertificatesRows(participants) {
  const tbody = document.getElementById('certificatesTbody');
  if (!tbody) return;

  if (participants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 32px;">No matching participant records found.</td></tr>`;
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

    // Games summary
    const gamesCount = (p.selectedGames || []).length;
    const gamesNames = (p.selectedGames || []).map(g => g.gameName).join(', ');

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
          <div style="font-weight: 700; color: #FFFFFF;">${escapeHtml(p.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(p.course)} &bull; ${escapeHtml(p.branch)}</div>
        </td>
        <td data-label="Roll No">
          <span style="font-family: monospace; color: var(--text-muted);">${escapeHtml(p.rollNumber || '—')}</span>
        </td>
        <td data-label="Games">
          <div style="font-weight: 600; color: #FFFFFF;">${gamesCount} challenge${gamesCount !== 1 ? 's' : ''}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(gamesNames)}">
            ${escapeHtml(gamesNames)}
          </div>
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
    const totalFee = item.feeAmount != null ? item.feeAmount : (games.length * 5);

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
              Attendee Verified for Challenges &amp; Certificate
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
    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/verify-participation/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
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
    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/verify-participation/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    showToast(`✓ Participation verified for ${registrationId}. Certificate issuance enabled!`);
    refreshCurrentView();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

window.revokeParticipantAttendance = async function(registrationId) {
  if (!confirm(`REVOKE attendance verification for ${registrationId}?\nIf a certificate was previously issued, it will also be revoked.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/revoke-verification/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
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
    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/issue/${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
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
    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/${encodeURIComponent(certificateId)}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify({ reason }),
      credentials: 'include'
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

async function initScanner() {
  const toggleBtn = document.getElementById('btnToggleCamera');
  const toggleText = document.getElementById('btnCameraToggleText');
  const liveIndicator = document.getElementById('cameraLiveIndicator');
  const deviceSelect = document.getElementById('cameraDeviceSelect');
  const manualInput = document.getElementById('manualPassIdInput');
  const verifyManualBtn = document.getElementById('btnVerifyManualPass');

  if (typeof Html5Qrcode !== 'undefined') {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length && deviceSelect) {
        deviceSelect.innerHTML = '';
        devices.forEach((dev, idx) => {
          const opt = document.createElement('option');
          opt.value = dev.id;
          opt.textContent = dev.label || `Camera ${idx + 1}`;
          deviceSelect.appendChild(opt);
        });
        const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
        if (backCam) {
          deviceSelect.value = backCam.id;
          currentCameraId = backCam.id;
        } else {
          currentCameraId = devices[0].id;
        }
      }
    } catch (err) {
      console.warn('Camera enumeration note:', err);
    }
  }

  deviceSelect?.addEventListener('change', async (e) => {
    currentCameraId = e.target.value;
    if (isCameraActive) {
      await stopCameraScanner();
      await startCameraScanner();
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
        fps: 15,
        qrbox: { width: 220, height: 220 },
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
    if (statusText) statusText.textContent = 'Camera active — point at student pass';
  } catch (err) {
    console.error('Failed to start camera scanner:', err);
    showToast('Camera access denied or camera not found. Enter pass ID manually.');
    if (statusText) statusText.textContent = 'Camera unavailable — enter ID manually below';
  }
}

async function stopCameraScanner() {
  const toggleBtn = document.getElementById('btnToggleCamera');
  const toggleText = document.getElementById('btnCameraToggleText');
  const liveIndicator = document.getElementById('cameraLiveIndicator');
  const statusText = document.getElementById('scannerStatusText');

  if (html5QrScannerInstance && isCameraActive) {
    try {
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
  }, 3000);

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
    <div style="text-align: center; padding: 40px 20px;">
      <div class="table-loading-spinner" style="margin: 0 auto 16px;"></div>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Verifying Pass ID <strong>${escapeHtml(regId)}</strong> with database...</p>
    </div>
  `;

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
            <span>ID: ${escapeHtml(regId)}</span>
          </div>
          <div style="padding: 24px; text-align: center; background: var(--bg-darker); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <p style="color: #F87171; font-weight: 600; margin-bottom: 8px;">No registered student found with ID: ${escapeHtml(regId)}</p>
            <p style="color: var(--text-dim); font-size: 0.85rem;">Check if the student completed registration or re-scan the official pass QR code.</p>
            <button type="button" class="btn-verify-manual" style="margin-top: 14px;" onclick="window.clearScannerResult()">Scan Another Pass</button>
          </div>
        </div>
      `;
      return;
    }

    const reg = body.data;
    const isPaid = reg.paymentStatus === 'paid';
    const isPendingVer = reg.paymentStatus === 'payment_verification_pending';
    const fee = reg.registrationFee || (Array.isArray(reg.selectedGames) ? reg.selectedGames.length * 5 : 5);
    const student = reg.student || {};

    let bannerClass = 'status-unpaid';
    let bannerText = `PAYMENT PENDING &bull; ₹${fee}`;
    if (isPaid) {
      bannerClass = 'status-valid';
      bannerText = '✓ PASS VALID &amp; PAYMENT VERIFIED';
    } else if (isPendingVer) {
      bannerClass = 'status-pending';
      bannerText = `⚠ UTR VERIFICATION PENDING &bull; ₹${fee}`;
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
          <span style="font-family: var(--font-mono); font-size: 0.85rem;">${escapeHtml(reg.registrationId)}</span>
        </div>

        <div class="pass-student-info">
          <div class="pass-student-header">
            <div>
              <div class="pass-student-name">${escapeHtml(student.fullName || 'Student')}</div>
              <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 2px;">Roll: <strong style="color: var(--text-main);">${escapeHtml(student.rollNumber || 'N/A')}</strong></div>
            </div>
            <span class="pass-reg-id">${escapeHtml(reg.registrationId)}</span>
          </div>

          <div class="pass-meta-grid">
            <div class="pass-meta-item">
              <span class="pass-meta-label">Course &amp; Branch</span>
              <span class="pass-meta-value">${escapeHtml(student.course || '')} ${escapeHtml(student.branch || '')}</span>
            </div>
            <div class="pass-meta-item">
              <span class="pass-meta-label">Academic Year</span>
              <span class="pass-meta-value">Year ${escapeHtml(student.academicYear || '1')}</span>
            </div>
            <div class="pass-meta-item">
              <span class="pass-meta-label">Contact Mobile</span>
              <span class="pass-meta-value" style="color: var(--emerald-light);">${escapeHtml(student.mobileNumber || student.maskedMobile || 'N/A')}</span>
            </div>
            <div class="pass-meta-item">
              <span class="pass-meta-label">Payment UTR / Ref</span>
              <span class="pass-meta-value" style="font-family: var(--font-mono); font-size: 0.78rem;">${escapeHtml(reg.paymentReference || 'None')}</span>
            </div>
          </div>
        </div>

        <div class="pass-games-section">
          <div class="pass-section-heading">Registered Events (${(reg.selectedGames || []).length}) &bull; Fee ₹${fee}</div>
          <div class="pass-games-list">
            ${gamesHtml || '<p style=\"color: var(--text-dim); font-size: 0.8rem;\">No games listed</p>'}
          </div>
        </div>

        <div class="pass-actions-bar">
          <button type="button" class="btn-admit-pass" id="btnAdmitStudent" onclick="window.admitScannedStudent('${escapeHtml(reg.registrationId)}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Admit &amp; Check In</span>
          </button>

          ${!isPaid ? `
            <button type="button" class="btn-approve-payment-scanner" onclick="window.approveScannedPayment('${escapeHtml(reg.registrationId)}')">
              💳 Mark Paid (₹${fee})
            </button>
          ` : ''}

          <button type="button" class="btn-details-scanner" onclick="window.openRegistrationModal('${escapeHtml(reg.registrationId)}')">
            View Profile
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error fetching registration for scanner:', err);
    activeResult.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #F87171;">
        <p>Network error connecting to verification service.</p>
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
    const csrfToken = getCsrfToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/certificates/verify-participation/${encodeURIComponent(regId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include'
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
    const csrfToken = getCsrfToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${encodeURIComponent(regId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      credentials: 'include',
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

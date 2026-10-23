/**
 * Vijayadashami Carnival — Secure Admin Dashboard Controller
 * Phase 6 Organizer Management System
 */

const API_BASE_URL = window.API_BASE_URL || (
  window.location.protocol === 'file:'
    ? 'http://localhost:5000'
    : (window.location.port === '5000' ? '' : 'http://localhost:5000')
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
  status: ''
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
  initCertificatesTable();
  initGamewiseRoster();
  initExportSection();
  initModalActions();
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
  const sidebar = document.getElementById('dashboardSidebar');
  const refreshBtn = document.getElementById('btnRefreshData');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
      if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  logoutBtn?.addEventListener('click', handleLogout);

  mobileToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  refreshBtn?.addEventListener('click', () => {
    refreshCurrentView();
    showToast('Dashboard data refreshed.');
  });

  const themeToggle = document.getElementById('adminThemeToggle');
  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('srmu_theme', nextTheme);
    } catch (e) {}
  });
}

function switchView(viewName) {
  currentView = viewName;

  // Update nav buttons
  document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update view sections
  const viewMap = {
    overview: 'viewOverview',
    registrations: 'viewRegistrations',
    certificates: 'viewCertificates',
    gamewise: 'viewGamewise',
    export: 'viewExport'
  };

  const titleMap = {
    overview: 'Dashboard Overview',
    registrations: 'All Registrations Management',
    certificates: 'Participation Certificates & Attendance Verification',
    gamewise: 'Game-wise Participants Roster',
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
  } else if (viewName === 'certificates') {
    loadCertificatesData();
  } else if (viewName === 'gamewise') {
    loadGamewiseData(activeGameId);
  }
}

function refreshCurrentView() {
  if (currentView === 'overview') loadOverviewData();
  else if (currentView === 'registrations') loadRegistrationsData();
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
        <td><span class="reg-id-badge">${escapeHtml(r.registrationId)}</span></td>
        <td><strong>${escapeHtml(r.studentName)}</strong></td>
        <td>${escapeHtml(r.rollNumber)}</td>
        <td>${escapeHtml(r.course)}</td>
        <td>${r.gamesCount} game${r.gamesCount !== 1 ? 's' : ''}</td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(r.status || 'confirmed')}</span></td>
        <td>${dateStr}</td>
        <td>
          <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(r.registrationId)}')">
            View
          </button>
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

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (gameSelect) gameSelect.value = 'all';
    if (formatSelect) formatSelect.value = '';
    if (statusSelect) statusSelect.value = '';

    regPageState.search = '';
    regPageState.game = 'all';
    regPageState.format = '';
    regPageState.status = '';
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

  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 40px;">Loading records from MongoDB...</td></tr>`;

  try {
    const params = new URLSearchParams({
      page: regPageState.page,
      limit: regPageState.limit,
      search: regPageState.search,
      game: regPageState.game,
      format: regPageState.format,
      status: regPageState.status
    });

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
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 40px;">No registrations match your search or filter criteria.</td></tr>`;
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

      const hasTeam = (reg.selectedGames || []).some(g => g.participationType === 'team');
      const formatLabel = hasTeam ? 'Team & Solo' : 'Solo Only';

      const fee = reg.feeAmount != null ? reg.feeAmount : (reg.selectedGames ? reg.selectedGames.length * 5 : 0);
      const isPaid = reg.paymentStatus === 'paid';
      const isPendingVer = reg.paymentStatus === 'payment_verification_pending';
      const paymentLabel = isPaid ? 'Paid' : (isPendingVer ? 'Verifying' : (reg.paymentStatus === 'payment_failed' ? 'Failed' : 'Pending'));
      const paymentClass = isPaid ? 'status-confirmed' : (isPendingVer ? 'status-pending' : (reg.paymentStatus === 'payment_failed' ? 'status-cancelled' : 'status-pending'));

      return `
        <tr>
          <td><span class="reg-id-badge">${escapeHtml(reg.registrationId)}</span></td>
          <td><strong>${escapeHtml(student.fullName)}</strong></td>
          <td>${escapeHtml(student.rollNumber)}</td>
          <td>${escapeHtml(student.course)} - ${escapeHtml(student.branch)}</td>
          <td>${escapeHtml(student.academicYear)}</td>
          <td>${gamesChips}</td>
          <td><strong style="color: #F59E0B;">₹${fee}</strong></td>
          <td><span class="status-pill ${paymentClass}">${escapeHtml(paymentLabel)}</span></td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(reg.status || 'confirmed')}</span></td>
          <td>${dateStr}</td>
          <td>
            <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(reg.registrationId)}')">
              Details
            </button>
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
            <td><span class="reg-id-badge">${escapeHtml(p.registrationId)}</span></td>
            <td><strong>${escapeHtml(p.studentName)}</strong></td>
            <td>${escapeHtml(p.rollNumber)}</td>
            <td>${escapeHtml(p.course)} - ${escapeHtml(p.branch)}</td>
            <td><span class="status-pill ${isTeam ? 'status-pending' : 'status-confirmed'}">${isTeam ? 'Team' : 'Solo'}</span></td>
            <td>${teamInfo}</td>
            <td>${formatDate(p.createdAt)}</td>
            <td>
              <button type="button" class="btn-table-action" onclick="openRegistrationModal('${escapeHtml(p.registrationId)}')">
                View
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Failed to load game participants:', err);
  }
}

// ============================================================================
// 6. CSV DATA EXPORT SECTION
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
      const payClass = isPaid ? 'status-confirmed' : (isPendingVer ? 'status-pending' : (data.paymentStatus === 'payment_failed' ? 'status-cancelled' : 'status-pending'));
      const payLabel = isPaid ? 'Payment Verified' : (isPendingVer ? 'Payment Verification Pending' : (data.paymentStatus === 'payment_failed' ? 'Payment Failed' : 'Payment Pending'));
      const utrInfo = data.paymentReference ? `<div style="font-size: 0.75rem; color: #FCD34D; margin-top: 4px;">UTR/Ref: ${escapeHtml(data.paymentReference)}</div>` : '';
      modalPayEl.innerHTML = `<span class="status-pill ${payClass}">${escapeHtml(payLabel)}</span>${utrInfo}`;
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
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete registration ${regId}?\nThis action is irreversible and should only be used for duplicate or test entries.`);
    if (!confirmDelete) return;

    deleteBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${regId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Deletion failed');
      }

      showToast(`✓ Registration ${regId} was removed.`);
      closeModal();
      refreshCurrentView();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      deleteBtn.disabled = false;
    }
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
        <td>
          <span class="reg-id-badge cursor-pointer" onclick="window.openRegistrationModal('${p.registrationId}')" title="Click to view details">
            ${escapeHtml(p.registrationId)}
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: #FFFFFF;">${escapeHtml(p.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(p.course)} &bull; ${escapeHtml(p.branch)}</div>
        </td>
        <td>
          <span style="font-family: monospace; color: var(--text-muted);">${escapeHtml(p.rollNumber || '—')}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: #FFFFFF;">${gamesCount} challenge${gamesCount !== 1 ? 's' : ''}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(gamesNames)}">
            ${escapeHtml(gamesNames)}
          </div>
        </td>
        <td>${partPill}</td>
        <td>
          <div>${certStatusHtml}</div>
          ${p.certificateId ? `<div style="font-size: 0.72rem; font-family: monospace; color: var(--sky); margin-top: 2px;">${escapeHtml(p.certificateId)}</div>` : ''}
        </td>
        <td>
          <div class="action-btn-group">
            ${actionButtonsHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

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

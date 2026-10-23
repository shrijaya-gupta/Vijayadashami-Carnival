/**
 * Vijayadashami Carnival — Phase 3 Student Registration Controller
 * 
 * Manages:
 * 1. Form input validation (Indian mobile regex, roll number, course/branch with 'other' reveals)
 * 2. Two-way synchronization with Phase 2 game catalogue and floating preview bar
 * 3. Individual vs. Team format toggling per game
 * 4. Dynamic team-member rows and game-specific team roster isolation
 * 5. Review registration panel generation with state preservation
 * 6. Phase 3 submission behavior (clear notification, no fake database/backend storage)
 */

// Per-game team configurations state: gameId -> { format: 'individual' | 'team', teamName: '', members: [ { name, roll, contact } ] }
const gameFormatState = {
  'lemon-race': { format: 'individual', teamName: '', members: [] },
  'target-shooting': { format: 'individual', teamName: '', members: [] },
  'musical-chairs': { format: 'individual', teamName: '', members: [] },
  'human-knot': { format: 'team', teamName: '', members: [] },
  'cup-balloon-pyramid': { format: 'individual', teamName: '', members: [] },
  'balloon-dual-race': { format: 'team', teamName: '', members: [] }
};

// Configurable API base URL (Phase 5)
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : (typeof window !== 'undefined' && window.location.protocol === 'file:'
      ? 'http://localhost:5000'
      : (typeof window !== 'undefined' && window.location.port === '5000' ? '' : 'http://localhost:5000'));

// Cached in-memory registration state for Review and Confirmation Preview
let cachedRegistrationData = null;

// Phase 5 Backend Integration State
let currentIdempotencyKey = null;
let confirmedRegistrationRecord = null;
let isSubmittingRegistration = false;

document.addEventListener('DOMContentLoaded', () => {
  initRegistrationForm();
});

function initRegistrationForm() {
  const form = document.getElementById('studentRegistrationForm');
  if (!form) return;

  initCourseBranchDropdowns();
  initFormGameSelectionSync();
  initFormValidationAndReview();
  initConfirmationPreviewFlow();
  initPhase5BackendSubmission();
  initConfirmationModal();
}

/**
 * 1. COURSE & BRANCH DROPDOWNS WITH 'OTHER' CONDITIONAL TEXT INPUTS
 */
function initCourseBranchDropdowns() {
  const courseSelect = document.getElementById('regCourse');
  const courseOtherWrap = document.getElementById('courseOtherWrap');
  const courseOtherInput = document.getElementById('regCourseOther');

  const branchSelect = document.getElementById('regBranch');
  const branchOtherWrap = document.getElementById('branchOtherWrap');
  const branchOtherInput = document.getElementById('regBranchOther');

  if (courseSelect && courseOtherWrap) {
    courseSelect.addEventListener('change', () => {
      const isOther = courseSelect.value === 'Other';
      courseOtherWrap.classList.toggle('show', isOther);
      if (courseOtherInput) {
        courseOtherInput.required = isOther;
        if (!isOther) {
          courseOtherInput.value = '';
          clearFieldError(courseOtherInput);
        } else {
          courseOtherInput.focus();
        }
      }
      clearFieldError(courseSelect);
    });
  }

  if (branchSelect && branchOtherWrap) {
    branchSelect.addEventListener('change', () => {
      const isOther = branchSelect.value === 'Other';
      branchOtherWrap.classList.toggle('show', isOther);
      if (branchOtherInput) {
        branchOtherInput.required = isOther;
        if (!isOther) {
          branchOtherInput.value = '';
          clearFieldError(branchOtherInput);
        } else {
          branchOtherInput.focus();
        }
      }
      clearFieldError(branchSelect);
    });
  }

  // Update dynamic team leader badges as user types their name and roll number
  const nameInput = document.getElementById('regFullName');
  const rollInput = document.getElementById('regRollNumber');

  const updateLeaderBadges = () => {
    const studentName = nameInput?.value.trim() || 'Registered Student';
    const studentRoll = rollInput?.value.trim() ? ` (Roll: ${rollInput.value.trim()})` : '';
    const leaderDisplays = document.querySelectorAll('.dynamic-team-leader-name');
    leaderDisplays.forEach((el) => {
      el.textContent = `${studentName}${studentRoll}`;
    });
  };

  nameInput?.addEventListener('input', updateLeaderBadges);
  rollInput?.addEventListener('input', updateLeaderBadges);
}

/**
 * 2. GAME SELECTION & TEAM ROSTERS IN REGISTRATION FORM
 */
function initFormGameSelectionSync() {
  const formCheckboxes = document.querySelectorAll('.reg-game-checkbox-input');
  
  // Wire checkbox clicks inside registration form
  formCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const gameId = checkbox.dataset.gameId;
      if (!gameId) return;

      if (checkbox.checked) {
        if (typeof selectedGamesState !== 'undefined') {
          selectedGamesState.add(gameId);
        }
      } else {
        if (typeof selectedGamesState !== 'undefined') {
          selectedGamesState.delete(gameId);
        }
      }

      // Synchronize everywhere
      if (typeof syncAllGameSelectionUI === 'function') {
        syncAllGameSelectionUI();
      }
      syncRegistrationFormGamesUI();
    });
  });

  // Wire format radio selectors (Individual vs Team)
  const formatRadios = document.querySelectorAll('input[type="radio"][name^="format-"]');
  formatRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const gameId = radio.dataset.gameId;
      const format = radio.value; // 'individual' or 'team'
      if (!gameId || !gameFormatState[gameId]) return;

      gameFormatState[gameId].format = format;
      const teamBlock = document.getElementById(`teamConfig-${gameId}`);
      if (teamBlock) {
        teamBlock.classList.toggle('show', format === 'team');
      }
    });
  });

  // Wire '+ Add Team Member' buttons
  const addMemberButtons = document.querySelectorAll('.btn-add-member');
  addMemberButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.gameId;
      if (gameId) {
        addTeamMemberRow(gameId);
      }
    });
  });

  // Initial sync from existing catalogue selection state
  syncRegistrationFormGamesUI();
}

/**
 * Adds a new dynamic team-member row to a game's team block
 */
function addTeamMemberRow(gameId, memberData = { name: '', roll: '', contact: '' }) {
  const container = document.getElementById(`teamMembersList-${gameId}`);
  if (!container) return;

  const rowId = 'member-' + Math.random().toString(36).substr(2, 9);
  const row = document.createElement('div');
  row.className = 'team-member-row';
  row.id = rowId;

  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="form-input member-name-input" placeholder="Member Name *" value="${escapeHtml(memberData.name)}" aria-label="Team member full name">
    </div>
    <div class="form-group">
      <input type="text" class="form-input member-roll-input" placeholder="Roll No (Provisional)" value="${escapeHtml(memberData.roll)}" aria-label="Team member roll number">
    </div>
    <div class="form-group">
      <input type="tel" class="form-input member-contact-input" placeholder="Contact No (Optional)" value="${escapeHtml(memberData.contact)}" aria-label="Team member contact number">
    </div>
    <button type="button" class="btn-remove-member" title="Remove member" aria-label="Remove this team member">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Attach remove handler
  const removeBtn = row.querySelector('.btn-remove-member');
  removeBtn.addEventListener('click', () => {
    row.remove();
  });

  container.appendChild(row);
  row.querySelector('.member-name-input')?.focus();
}

/**
 * Synchronizes registration form checkboxes and counters with selectedGamesState
 */
function syncRegistrationFormGamesUI() {
  if (typeof selectedGamesState === 'undefined') return;

  const formCheckboxes = document.querySelectorAll('.reg-game-checkbox-input');
  formCheckboxes.forEach((checkbox) => {
    const gameId = checkbox.dataset.gameId;
    const isChecked = selectedGamesState.has(gameId);
    checkbox.checked = isChecked;

    const card = document.getElementById(`regCard-${gameId}`);
    if (card) {
      card.classList.toggle('is-checked', isChecked);
    }

    // Toggle team block visibility based on stored format
    const teamBlock = document.getElementById(`teamConfig-${gameId}`);
    if (teamBlock && gameFormatState[gameId]) {
      const isTeam = gameFormatState[gameId].format === 'team';
      teamBlock.classList.toggle('show', isChecked && isTeam);
    }
  });

  // Update counter in registration section
  const regCountPill = document.getElementById('regGamesCountPill');
  const count = selectedGamesState.size;
  if (regCountPill) {
    const total = (typeof GAMES_DATA !== 'undefined') ? GAMES_DATA.length : 6;
    regCountPill.textContent = `${count} of ${total} Selected`;
  }

  // Update dynamic registration fee counters in the form
  const feeAmount = count * 5;
  const feeCountEl = document.getElementById('feeDisplayGameCount');
  const feeTotalEl = document.getElementById('feeDisplayTotalAmount');
  if (feeCountEl) feeCountEl.textContent = String(count);
  if (feeTotalEl) feeTotalEl.textContent = `₹${feeAmount}.00 INR`;

  // Clear game selection error if at least one is selected
  const gameSelError = document.getElementById('gameSelectionError');
  if (gameSelError && selectedGamesState.size > 0) {
    gameSelError.classList.remove('show');
  }
}

/**
 * 3. VALIDATION AND REVIEW STEP
 */
function initFormValidationAndReview() {
  const form = document.getElementById('studentRegistrationForm');
  const reviewBtn = document.getElementById('btnReviewRegistration');
  const reviewPanel = document.getElementById('registrationReviewPanel');
  const formCard = document.getElementById('registrationFormCard');
  const editDetailsBtn = document.getElementById('btnEditDetails');
  const confirmDetailsBtn = document.getElementById('btnConfirmDetails');

  if (!form || !reviewBtn || !reviewPanel || !formCard) return;

  // Real-time error clearing on input with event delegation (handles both static & dynamic fields)
  form.addEventListener('input', (e) => {
    const target = e.target;
    if (!target) return;
    if (target.classList.contains('is-invalid')) {
      target.classList.remove('is-invalid');
      target.removeAttribute('aria-invalid');
    }
    clearFieldError(target);
  });

  form.addEventListener('change', (e) => {
    const target = e.target;
    if (!target) return;
    clearFieldError(target);
  });

  // "Review Registration" Button Click
  reviewBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const isValid = validateRegistrationForm();
    if (!isValid) return;

    // Collect validated data into memory
    cachedRegistrationData = collectRegistrationFormData();

    // Populate review summary panel
    populateReviewPanel(cachedRegistrationData);

    // Switch view to Review Panel
    formCard.style.display = 'none';
    const confirmPanel = document.getElementById('registrationConfirmPanel');
    if (confirmPanel) {
      confirmPanel.classList.remove('show');
      confirmPanel.setAttribute('aria-hidden', 'true');
    }
    reviewPanel.classList.add('show');
    reviewPanel.setAttribute('aria-hidden', 'false');

    // Smooth scroll to review header
    reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Announce to screen readers
    const reviewTitle = reviewPanel.querySelector('.review-title');
    if (reviewTitle) {
      reviewTitle.setAttribute('tabindex', '-1');
      reviewTitle.focus({ preventScroll: true });
    }
  });

  // "Edit Details" Button Click: Return to form with state intact
  editDetailsBtn?.addEventListener('click', () => {
    reviewPanel.classList.remove('show');
    reviewPanel.setAttribute('aria-hidden', 'true');
    formCard.style.display = 'block';

    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const nameInput = document.getElementById('regFullName');
    nameInput?.focus();
  });
}

/**
 * Form Validation Logic
 */
function validateRegistrationForm() {
  let hasErrors = false;
  let firstInvalidEl = null;

  const markError = (inputEl, errorId, message) => {
    if (!inputEl) return;
    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');

    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
    }

    if (!firstInvalidEl) {
      firstInvalidEl = inputEl;
    }
    hasErrors = true;
  };

  // 1. Full Name
  const nameInput = document.getElementById('regFullName');
  if (!nameInput || nameInput.value.trim().length < 2) {
    markError(nameInput, 'fullNameError', 'Please enter your full name (at least 2 characters).');
  } else {
    clearFieldError(nameInput);
  }

  // 2. Mobile Number (Indian Mobile Validation)
  const mobileInput = document.getElementById('regMobileNumber');
  if (mobileInput) {
    const rawVal = mobileInput.value.trim();
    // Normalize input for validation (remove spaces, dashes, brackets)
    const normalizedMobile = rawVal.replace(/[\s\-\(\)]/g, '');
    // Indian mobile regex: optional +91 or 0 prefix, then 10 digits starting with 6, 7, 8, or 9
    const indianMobileRegex = /^(?:\+91|0)?[6-9]\d{9}$/;

    if (!rawVal) {
      markError(mobileInput, 'mobileError', 'Mobile number is required.');
    } else if (!indianMobileRegex.test(normalizedMobile)) {
      markError(mobileInput, 'mobileError', 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +919876543210).');
    } else {
      clearFieldError(mobileInput);
    }
  }

  // 3. Roll Number
  const rollInput = document.getElementById('regRollNumber');
  if (!rollInput || !rollInput.value.trim()) {
    markError(rollInput, 'rollError', 'University roll number is required.');
  } else {
    clearFieldError(rollInput);
  }

  // 4. Course
  const courseSelect = document.getElementById('regCourse');
  if (!courseSelect || !courseSelect.value) {
    markError(courseSelect, 'courseError', 'Please select your course.');
  } else {
    clearFieldError(courseSelect);

    // If "Other" selected, check text input
    if (courseSelect.value === 'Other') {
      const courseOther = document.getElementById('regCourseOther');
      if (!courseOther || !courseOther.value.trim()) {
        markError(courseOther, 'courseOtherError', 'Please specify your course.');
      } else {
        clearFieldError(courseOther);
      }
    }
  }

  // 5. Branch
  const branchSelect = document.getElementById('regBranch');
  if (!branchSelect || !branchSelect.value) {
    markError(branchSelect, 'branchError', 'Please select your branch.');
  } else {
    clearFieldError(branchSelect);

    // If "Other" selected, check text input
    if (branchSelect.value === 'Other') {
      const branchOther = document.getElementById('regBranchOther');
      if (!branchOther || !branchOther.value.trim()) {
        markError(branchOther, 'branchOtherError', 'Please specify your branch.');
      } else {
        clearFieldError(branchOther);
      }
    }
  }

  // 6. Academic Year
  const yearSelect = document.getElementById('regYear');
  if (!yearSelect || !yearSelect.value) {
    markError(yearSelect, 'yearError', 'Please select your academic year.');
  } else {
    clearFieldError(yearSelect);
  }

  // 7. Game Selection (At least one must be selected)
  const gameSelError = document.getElementById('gameSelectionError');
  if (typeof selectedGamesState === 'undefined' || selectedGamesState.size === 0) {
    if (gameSelError) {
      gameSelError.classList.add('show');
    }
    if (!firstInvalidEl) {
      firstInvalidEl = document.querySelector('.reg-game-card');
    }
    hasErrors = true;
  } else {
    if (gameSelError) gameSelError.classList.remove('show');

    // 8. Team Configuration Validation for selected team games
    selectedGamesState.forEach((gameId) => {
      const format = gameFormatState[gameId]?.format;
      if (format === 'team') {
        const teamNameInput = document.getElementById(`teamName-${gameId}`);
        if (!teamNameInput || !teamNameInput.value.trim()) {
          markError(teamNameInput, `teamNameError-${gameId}`, 'Team name is required for team participation.');
        } else {
          clearFieldError(teamNameInput);
        }

        // Validate each existing member row: member name cannot be blank
        const memberRows = document.querySelectorAll(`#teamMembersList-${gameId} .team-member-row`);
        memberRows.forEach((row) => {
          const nameField = row.querySelector('.member-name-input');
          if (nameField && !nameField.value.trim()) {
            nameField.classList.add('is-invalid');
            if (!firstInvalidEl) firstInvalidEl = nameField;
            hasErrors = true;
          } else if (nameField) {
            nameField.classList.remove('is-invalid');
          }
        });
      }
    });
  }

  // Scroll to and focus the first invalid field
  if (firstInvalidEl) {
    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof firstInvalidEl.focus === 'function') {
      firstInvalidEl.focus();
    }
  }

  return !hasErrors;
}

function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('is-invalid');
  inputEl.removeAttribute('aria-invalid');

  const errorEl = inputEl.parentElement?.querySelector('.field-error');
  if (errorEl) {
    errorEl.classList.remove('show');
    errorEl.textContent = '';
  }
}

/**
 * Collects form state into a structured JSON-like object
 */
function collectRegistrationFormData() {
  const name = document.getElementById('regFullName')?.value.trim() || '';
  const mobile = document.getElementById('regMobileNumber')?.value.trim() || '';
  const roll = document.getElementById('regRollNumber')?.value.trim() || '';
  
  const courseSelect = document.getElementById('regCourse')?.value || '';
  const course = (courseSelect === 'Other') 
    ? (document.getElementById('regCourseOther')?.value.trim() || 'Other')
    : courseSelect;

  const branchSelect = document.getElementById('regBranch')?.value || '';
  const branch = (branchSelect === 'Other')
    ? (document.getElementById('regBranchOther')?.value.trim() || 'Other')
    : branchSelect;

  const academicYear = document.getElementById('regYear')?.value || '';

  // Selected Games
  const games = [];
  selectedGamesState.forEach((gameId) => {
    const gameDef = typeof getGameById === 'function' ? getGameById(gameId) : null;
    const format = gameFormatState[gameId]?.format || 'individual';
    
    let teamData = null;
    if (format === 'team') {
      const teamName = document.getElementById(`teamName-${gameId}`)?.value.trim() || 'Unnamed Squad';
      const members = [];
      const memberRows = document.querySelectorAll(`#teamMembersList-${gameId} .team-member-row`);
      memberRows.forEach((row) => {
        const mName = row.querySelector('.member-name-input')?.value.trim();
        const mRoll = row.querySelector('.member-roll-input')?.value.trim();
        const mContact = row.querySelector('.member-contact-input')?.value.trim();
        if (mName) {
          members.push({ name: mName, roll: mRoll, contact: mContact });
        }
      });
      teamData = { teamName, members };
    }

    games.push({
      id: gameId,
      name: gameDef ? gameDef.name : gameId,
      category: gameDef ? gameDef.category : '',
      format: format,
      team: teamData
    });
  });

  const selectedCount = games.length;
  const totalAmount = selectedCount * 5;

  const paymentReferenceInput = document.getElementById('regPaymentReference');
  const paymentReference = paymentReferenceInput ? paymentReferenceInput.value.trim() : '';
  const whatsappConsentInput = document.getElementById('regWhatsAppConsent');
  const whatsappConsent = whatsappConsentInput ? whatsappConsentInput.checked : true;

  const hasUtr = paymentReference.length > 0;
  const paymentStatus = hasUtr ? 'payment_verification_pending' : 'payment_pending';
  const paymentStatusLabel = hasUtr ? 'Payment Verification Pending' : 'Payment Pending';

  return {
    student: { name, mobile, roll, course, branch, academicYear },
    whatsappConsent: whatsappConsent,
    paymentReference: paymentReference,
    games: games,
    fee: {
      feePerGame: 5,
      selectedGamesCount: selectedCount,
      totalAmount: totalAmount,
      currency: 'INR',
      formattedTotal: `₹${totalAmount}.00 INR`,
      paymentStatus: paymentStatus,
      paymentStatusLabel: paymentStatusLabel
    }
  };
}

/**
 * Populates the Review Panel with live in-memory data
 */
function populateReviewPanel(data) {
  // Student Details
  document.getElementById('revStudentName').textContent = data.student.name;
  document.getElementById('revStudentRoll').textContent = data.student.roll;

  // Mask mobile number to protect student privacy in review summary (Phase 4 requirement)
  const rawMobile = data.student.mobile || '';
  const maskedMobile = rawMobile.length >= 4 
    ? '••••••' + rawMobile.slice(-4) + ' (Protected)'
    : 'Provided (Protected)';
  const mobEl = document.getElementById('revStudentMobile');
  if (mobEl) mobEl.textContent = maskedMobile;

  document.getElementById('revStudentCourse').textContent = data.student.course;
  document.getElementById('revStudentBranch').textContent = data.student.branch;
  document.getElementById('revStudentYear').textContent = data.student.academicYear;

  // Selected Games Breakdown
  const gamesContainer = document.getElementById('revGamesListContainer');
  if (!gamesContainer) return;

  gamesContainer.innerHTML = '';
  data.games.forEach((game) => {
    const entry = document.createElement('div');
    entry.className = 'review-game-entry';

    const isTeam = game.format === 'team';
    const formatBadge = isTeam ? 'Team Participation' : 'Individual Participation';
    const badgeClass = isTeam ? 'badge-team' : 'badge-indiv';

    let teamHtml = '';
    if (isTeam && game.team) {
      const membersList = (game.team.members && game.team.members.length > 0)
        ? game.team.members.map(m => `<li><strong>${escapeHtml(m.name)}</strong> ${m.roll ? `(Roll: ${escapeHtml(m.roll)})` : ''}</li>`).join('')
        : '<li><em>No additional members listed. You are registered as sole team registrant.</em></li>';

      teamHtml = `
        <div class="review-team-details-wrap">
          <div class="review-team-name-line">Team Name: ${escapeHtml(game.team.teamName)}</div>
          <div>Team Leader: <strong>${escapeHtml(data.student.name)}</strong> (Roll: ${escapeHtml(data.student.roll)})</div>
          <div style="margin-top: 6px; font-weight: 600; color: #94A3B8;">Listed Squad Members:</div>
          <ul class="review-team-members-list">
            ${membersList}
          </ul>
        </div>
      `;
    } else {
      teamHtml = `
        <div class="review-team-details-wrap" style="color: #94A3B8; font-size: 0.78rem;">
          Format: <strong>Individual (Solo Competitor)</strong> &bull; No team members required.
        </div>
      `;
    }

    entry.innerHTML = `
      <div class="review-game-top">
        <span class="review-game-title">${escapeHtml(game.name)}</span>
        <span class="review-game-format-tag ${badgeClass}">${formatBadge}</span>
      </div>
      <div style="font-size: 0.75rem; color: #38BDF8;">Category: ${escapeHtml(game.category)}</div>
      ${teamHtml}
    `;

    gamesContainer.appendChild(entry);
  });

  // Populate Registration Fee & Payment Status Summary in Review Panel
  const feeContainer = document.getElementById('revFeeSummaryContainer');
  if (feeContainer) {
    const feeCount = data.games.length;
    const feeTotal = feeCount * 5;
    const statusLabel = data.fee?.paymentStatusLabel || 'Payment Pending';
    const statusClass = (statusLabel === 'Payment Verification Pending') ? 'status-verification-pending' : 'status-pending';
    const utrSnippet = data.paymentReference
      ? `<div style="font-size: 0.8rem; margin-top: 6px; color: var(--color-text-muted);">Entered Transaction Reference: <strong style="color: var(--color-gold);">${escapeHtml(data.paymentReference)}</strong></div>`
      : '';

    feeContainer.innerHTML = `
      <div class="review-fee-card" style="background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px 18px; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text-muted);">
          <span>Fee per Game:</span>
          <strong style="color: var(--color-text-main);">₹5.00 INR</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text-muted);">
          <span>Selected Games Count:</span>
          <strong style="color: var(--color-text-main);">${feeCount}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; padding-top: 8px; border-top: 1px dashed var(--color-border); margin-bottom: 10px;">
          <span style="color: var(--color-text-light);">Total Registration Fee:</span>
          <span style="color: var(--color-gold);">₹${feeTotal}.00 INR</span>
        </div>
        <div style="font-size: 0.82rem; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 14px; color: var(--color-text-main);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700;">Online Payment Status:</span>
            <span class="payment-status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
          </div>
          ${utrSnippet}
          <div style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.45; margin-top: 6px;">
            The registration fee is ₹5 per selected game. Complete payment using the official organizer QR code. Status will be marked as Payment Verified once verified by the organizers.
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * 4. PHASE 4 & 5: CONFIRMATION PREVIEW & REAL SUBMISSION CONTROLLER
 */
function initConfirmationPreviewFlow() {
  const confirmDetailsBtn = document.getElementById('btnConfirmDetails');
  const reviewPanel = document.getElementById('registrationReviewPanel');
  const confirmPanel = document.getElementById('registrationConfirmPanel');
  const formCard = document.getElementById('registrationFormCard');
  const previewBackBtn = document.getElementById('btnPreviewBackToEdit');
  const shareWhatsAppBtn = document.getElementById('btnShareWhatsApp');
  const copySummaryBtn = document.getElementById('btnCopyEventSummary');

  // "Proceed to Registration Preview" from Review Panel
  confirmDetailsBtn?.addEventListener('click', () => {
    if (!cachedRegistrationData) {
      cachedRegistrationData = collectRegistrationFormData();
    }

    // Generate fresh idempotency key for this registration draft
    currentIdempotencyKey = 'srmu-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    confirmedRegistrationRecord = null;

    populateRegistrationPreview(cachedRegistrationData);

    if (reviewPanel) {
      reviewPanel.classList.remove('show');
      reviewPanel.setAttribute('aria-hidden', 'true');
    }
    if (formCard) {
      formCard.style.display = 'none';
    }
    if (confirmPanel) {
      confirmPanel.classList.add('show');
      confirmPanel.setAttribute('aria-hidden', 'false');
      confirmPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const prevTitle = confirmPanel.querySelector('.confirm-preview-title');
      if (prevTitle) {
        prevTitle.setAttribute('tabindex', '-1');
        prevTitle.focus({ preventScroll: true });
      }
    }
  });

  // "Back to Edit Form" from Confirmation Preview Panel
  previewBackBtn?.addEventListener('click', () => {
    if (confirmPanel) {
      confirmPanel.classList.remove('show');
      confirmPanel.setAttribute('aria-hidden', 'true');
    }
    if (reviewPanel) {
      reviewPanel.classList.remove('show');
      reviewPanel.setAttribute('aria-hidden', 'true');
    }
    if (formCard) {
      formCard.style.display = 'block';
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const nameInput = document.getElementById('regFullName');
    nameInput?.focus();
  });

  // "Share Event Details on WhatsApp" (Pre-submission)
  shareWhatsAppBtn?.addEventListener('click', () => {
    shareEventOnWhatsApp(cachedRegistrationData || collectRegistrationFormData());
  });

  // "Copy Event Summary" (Pre-submission)
  copySummaryBtn?.addEventListener('click', () => {
    copyEventSummary(cachedRegistrationData || collectRegistrationFormData());
  });
}

/**
 * Populates the Registration Preview screen & resets submission UI
 */
function populateRegistrationPreview(data) {
  if (!data) return;

  // Reset Phase 5 submission UI state
  const submissionActionBox = document.getElementById('submissionActionBox');
  const loadingIndicator = document.getElementById('submissionLoadingIndicator');
  const errorAlert = document.getElementById('submissionErrorAlert');
  const successBox = document.getElementById('submissionSuccessBox');
  const noticeBanner = document.getElementById('previewStatusNoticeBanner');
  const preSubmitActions = document.getElementById('previewPreSubmitActionsPanel');
  const submitBtn = document.getElementById('btnSubmitRegistration');

  if (submissionActionBox) submissionActionBox.style.display = 'block';
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (errorAlert) errorAlert.style.display = 'none';
  if (successBox) successBox.style.display = 'none';
  if (noticeBanner) noticeBanner.style.display = 'flex';
  if (preSubmitActions) preSubmitActions.style.display = 'block';
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  }

  const badgeEl = document.getElementById('confirmPanelBadge');
  if (badgeEl) badgeEl.textContent = 'Registration Review & Submit';
  const titleEl = document.getElementById('confirmPanelTitle');
  if (titleEl) titleEl.textContent = 'Vijayadashami Carnival Registration';
  const subtitleEl = document.getElementById('confirmPanelSubtitle');
  if (subtitleEl) subtitleEl.textContent = 'Review your participant details, selected games, and online payment details below, then submit to confirm your registration.';

  const partNameEl = document.getElementById('prevParticipantName');
  if (partNameEl) {
    const studentName = data.student.name || 'Student Participant';
    const studentRoll = data.student.roll ? ` (Roll: ${data.student.roll})` : '';
    partNameEl.textContent = `${studentName}${studentRoll}`;
  }

  const acadProfileEl = document.getElementById('prevAcademicProfile');
  if (acadProfileEl) {
    const course = data.student.course || 'Course';
    const branch = data.student.branch || 'Branch';
    const year = data.student.academicYear || '';
    acadProfileEl.textContent = `${course} - ${branch} ${year ? `(${year})` : ''}`;
  }

  const countTag = document.getElementById('prevGamesCountTag');
  if (countTag) {
    const count = data.games.length;
    countTag.textContent = `${count} Challenge${count !== 1 ? 's' : ''} Selected`;
  }

  const gamesContainer = document.getElementById('prevGamesList');
  if (gamesContainer) {
    gamesContainer.innerHTML = '';
    if (data.games.length === 0) {
      gamesContainer.innerHTML = '<div style="color: #94A3B8; font-size: 0.85rem;">No games currently selected.</div>';
    } else {
      data.games.forEach((game) => {
        const chip = document.createElement('div');
        chip.className = 'prev-game-chip-card';
        const isTeam = game.format === 'team';
        
        let teamInfo = '';
        if (isTeam && game.team) {
          const membersCount = game.team.members ? game.team.members.length + 1 : 1;
          teamInfo = ` &bull; Team: <strong style="color: #FCD34D;">${escapeHtml(game.team.teamName)}</strong> (${membersCount} players listed)`;
        }

        chip.innerHTML = `
          <div class="prev-game-chip-top">
            <span class="prev-game-name">${escapeHtml(game.name)}</span>
            <span class="prev-game-badge ${isTeam ? 'badge-team' : 'badge-indiv'}">
              ${isTeam ? 'Team Entry' : 'Solo / Individual'}
            </span>
          </div>
          <div class="prev-game-meta">
            Category: ${escapeHtml(game.category)}${teamInfo}
          </div>
        `;
        gamesContainer.appendChild(chip);
      });
    }
  }

  // Populate dynamic fee summary in preview panel
  const prevFeeContainer = document.getElementById('prevFeeSummaryContainer');
  if (prevFeeContainer) {
    const feeCount = data.games.length;
    const feeTotal = feeCount * 5;
    const statusLabel = data.fee?.paymentStatusLabel || 'Payment Pending';
    const statusClass = (statusLabel === 'Payment Verification Pending') ? 'status-verification-pending' : 'status-pending';
    const utrSnippet = data.paymentReference
      ? `<div style="font-size: 0.8rem; margin-top: 6px; color: var(--color-text-muted);">Entered Transaction Reference: <strong style="color: var(--color-gold);">${escapeHtml(data.paymentReference)}</strong></div>`
      : '';

    prevFeeContainer.innerHTML = `
      <div class="prev-fee-card" style="background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px 18px; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text-muted);">
          <span>Fee per Game:</span>
          <strong style="color: var(--color-text-main);">₹5.00 INR</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text-muted);">
          <span>Selected Games Count:</span>
          <strong style="color: var(--color-text-main);">${feeCount}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; padding-top: 8px; border-top: 1px dashed var(--color-border); margin-bottom: 10px;">
          <span style="color: var(--color-text-light);">Total Registration Fee:</span>
          <span style="color: var(--color-gold);">₹${feeTotal}.00 INR</span>
        </div>
        <div style="font-size: 0.82rem; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 14px; color: var(--color-text-main);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700;">Online Payment Status:</span>
            <span class="payment-status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
          </div>
          ${utrSnippet}
          <div style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.45; margin-top: 6px;">
            Registrations are marked as paid only after payment is verified by the organizers.
          </div>
        </div>
      </div>
    `;
  }

  // Clear any previous copy status message
  const statusEl = document.getElementById('copyStatusMessage');
  if (statusEl) {
    statusEl.className = 'copy-status-msg';
    statusEl.textContent = '';
  }
}

/**
 * 5. PHASE 5: REAL BACKEND SUBMISSION CONTROLLER
 */
function initPhase5BackendSubmission() {
  const submitBtn = document.getElementById('btnSubmitRegistration');
  const retryBtn = document.getElementById('btnRetrySubmission');
  const backToEditBtn = document.getElementById('btnBackToFormAfterError');
  const shareWaConfirmedBtn = document.getElementById('btnShareWhatsAppConfirmed');
  const copyConfirmedBtn = document.getElementById('btnCopyConfirmedRegistration');

  // Submit button
  submitBtn?.addEventListener('click', () => {
    submitRegistrationToBackend();
  });

  // Retry button (uses same idempotency key for safe duplicate prevention)
  retryBtn?.addEventListener('click', () => {
    submitRegistrationToBackend();
  });

  // Return to edit form from error state
  backToEditBtn?.addEventListener('click', () => {
    const confirmPanel = document.getElementById('registrationConfirmPanel');
    const formCard = document.getElementById('registrationFormCard');
    if (confirmPanel) {
      confirmPanel.classList.remove('show');
      confirmPanel.setAttribute('aria-hidden', 'true');
    }
    if (formCard) {
      formCard.style.display = 'block';
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Share confirmed registration on WhatsApp
  shareWaConfirmedBtn?.addEventListener('click', () => {
    shareConfirmedRegistrationOnWhatsApp(confirmedRegistrationRecord);
  });

  // Copy confirmed registration summary
  copyConfirmedBtn?.addEventListener('click', () => {
    copyConfirmedRegistrationSummary(confirmedRegistrationRecord);
  });
}

/**
 * Submits the in-memory validated registration to POST /api/registrations
 */
async function submitRegistrationToBackend() {
  if (isSubmittingRegistration) return;

  if (!cachedRegistrationData) {
    cachedRegistrationData = collectRegistrationFormData();
  }

  const submitBtn = document.getElementById('btnSubmitRegistration');
  const loadingIndicator = document.getElementById('submissionLoadingIndicator');
  const errorAlert = document.getElementById('submissionErrorAlert');
  const errorTitle = document.getElementById('submissionErrorTitle');
  const errorDesc = document.getElementById('submissionErrorDesc');

  // Prepare payload mapping client structure to backend API format
  const enteredUtr = cachedRegistrationData.paymentReference || document.getElementById('regPaymentReference')?.value.trim();
  const payload = {
    student: {
      fullName: cachedRegistrationData.student.name,
      mobileNumber: cachedRegistrationData.student.mobile,
      rollNumber: cachedRegistrationData.student.roll,
      course: cachedRegistrationData.student.course,
      branch: cachedRegistrationData.student.branch,
      academicYear: cachedRegistrationData.student.academicYear
    },
    ...(enteredUtr ? { paymentReference: enteredUtr } : {}),
    selectedGames: (cachedRegistrationData.games || []).map((g) => {
      const gameObj = {
        gameId: g.id,
        participationType: g.format
      };
      if (g.format === 'team' && g.team) {
        gameObj.teamName = g.team.teamName || 'Squad';
        if (Array.isArray(g.team.members) && g.team.members.length > 0) {
          gameObj.teamMembers = g.team.members.map((m) => ({
            name: m.name,
            roll: m.roll || '',
            contact: m.contact || ''
          }));
        }
      }
      return gameObj;
    })
  };

  // Pre-flight check: ensure game array is not empty
  if (payload.selectedGames.length === 0) {
    if (errorAlert && errorDesc) {
      errorAlert.style.display = 'block';
      errorTitle.textContent = 'Selection Missing';
      errorDesc.textContent = 'Please select at least one game before submitting.';
    }
    return;
  }

  // Ensure an idempotency key exists
  if (!currentIdempotencyKey) {
    currentIdempotencyKey = 'srmu-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  // UI: In-progress state
  isSubmittingRegistration = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
  }
  if (loadingIndicator) loadingIndicator.style.display = 'flex';
  if (errorAlert) errorAlert.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': currentIdempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);

    if (response.status === 201 || (response.status === 200 && result?.success)) {
      // Genuine Confirmation: Database recorded!
      confirmedRegistrationRecord = result.data;
      displaySubmissionSuccess(result.data);
    } else {
      // Backend returned validation error or issue
      let errorMsg = result?.message || 'Server returned an error (HTTP ' + response.status + ').';
      if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        errorMsg += ' Details: ' + result.errors.map(e => e.message || e.field).join(', ');
      }
      displaySubmissionError('Submission Rejected', errorMsg);
    }
  } catch (netErr) {
    // Network failure / server offline
    displaySubmissionError(
      'Network Interruption &bull; Status Unknown',
      'Unable to connect to the registration server at ' + API_BASE_URL + '. Your form entries are completely safe. Please check that the backend server is running and click "Retry Submission". (Retrying uses an idempotency key so duplicate records will not be created).'
    );
  } finally {
    isSubmittingRegistration = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (!confirmedRegistrationRecord && submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  }
}

/**
 * Genuine Confirmation UI: Renders only when database persistence succeeds
 */
function displaySubmissionSuccess(registration) {
  const submissionActionBox = document.getElementById('submissionActionBox');
  const noticeBanner = document.getElementById('previewStatusNoticeBanner');
  const preSubmitActions = document.getElementById('previewPreSubmitActionsPanel');
  const successBox = document.getElementById('submissionSuccessBox');
  const regIdDisplay = document.getElementById('confirmedRegIdDisplay');
  const badgeEl = document.getElementById('confirmPanelBadge');
  const titleEl = document.getElementById('confirmPanelTitle');
  const subtitleEl = document.getElementById('confirmPanelSubtitle');

  if (submissionActionBox) submissionActionBox.style.display = 'none';
  if (noticeBanner) noticeBanner.style.display = 'none';
  if (preSubmitActions) preSubmitActions.style.display = 'none';

  if (badgeEl) {
    badgeEl.textContent = 'Official Registration Confirmed';
    badgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
    badgeEl.style.color = '#34D399';
    badgeEl.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  }
  if (titleEl) titleEl.textContent = 'Official Registration Confirmation';
  if (subtitleEl) subtitleEl.textContent = 'Your registration reference has been generated and officially confirmed.';

  if (regIdDisplay) {
    regIdDisplay.textContent = registration.registrationId || 'SRMU-2026-CONFIRMED';
  }

  // Render confirmed fee breakdown & online payment status
  const confirmedFeeEl = document.getElementById('confirmedFeeNotice');
  const count = (registration.selectedGames || []).length;
  const total = registration.fee?.totalAmount || registration.feeAmount || (count * 5);
  const statusLabel = registration.fee?.paymentStatusLabel || (registration.paymentStatus === 'payment_verification_pending' ? 'Payment Verification Pending' : (registration.paymentStatus === 'paid' ? 'Payment Verified' : 'Payment Pending'));
  let statusClass = 'status-pending';
  if (registration.paymentStatus === 'paid') statusClass = 'status-verified';
  else if (registration.paymentStatus === 'payment_verification_pending') statusClass = 'status-verification-pending';
  else if (registration.paymentStatus === 'payment_failed') statusClass = 'status-failed';

  if (confirmedFeeEl) {
    confirmedFeeEl.innerHTML = `
      <div style="background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: 12px; padding: 14px 18px; margin-top: 14px; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted);">Fee per Game:</span>
          <strong style="color: var(--color-text-main);">₹5.00 INR</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted);">Selected Games Count:</span>
          <strong style="color: var(--color-text-main);">${count}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed var(--color-border); margin-bottom: 8px;">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted);">Total Registration Fee:</span>
          <strong style="font-size: 1.15rem; color: var(--color-gold);">₹${total}.00 INR</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted);">Online Payment Status:</span>
          <span class="payment-status-pill ${statusClass}" style="font-size: 0.72rem;">${escapeHtml(statusLabel)}</span>
        </div>
        ${registration.paymentReference ? `<div style="font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 6px;">Recorded Reference / UTR: <strong style="color: var(--color-gold);">${escapeHtml(registration.paymentReference)}</strong></div>` : ''}
        <p style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.45; margin: 0;">
          Online payments are verified by event organizers. Registrations are marked as paid only after server verification.
        </p>
      </div>
    `;
  }

  // Update status badge and bind post-submission UTR submission button
  const statusBadge = document.getElementById('confirmedPaymentStatusBadge');
  if (statusBadge) {
    statusBadge.textContent = statusLabel;
    statusBadge.className = `payment-status-pill ${statusClass}`;
  }

  const postUtrInput = document.getElementById('postSubUtrInput');
  const postUtrBtn = document.getElementById('btnSubmitPostUtr');
  const postUtrFeedback = document.getElementById('postUtrFeedback');

  if (registration.paymentReference && postUtrInput) {
    postUtrInput.value = registration.paymentReference;
  }

  if (postUtrBtn && !postUtrBtn.dataset.bound) {
    postUtrBtn.dataset.bound = 'true';
    postUtrBtn.addEventListener('click', async () => {
      const regId = confirmedRegistrationRecord?.registrationId || registration.registrationId;
      const refVal = postUtrInput?.value.trim();
      if (!refVal) {
        if (postUtrFeedback) {
          postUtrFeedback.style.display = 'block';
          postUtrFeedback.style.color = '#EF4444';
          postUtrFeedback.textContent = 'Please enter a valid transaction reference / UTR number.';
        }
        return;
      }
      postUtrBtn.disabled = true;
      postUtrBtn.textContent = 'Submitting...';
      try {
        const resp = await fetch(`${API_BASE_URL}/api/registrations/${regId}/payment-reference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentReference: refVal })
        });
        const json = await resp.json();
        if (resp.ok && json.success) {
          if (statusBadge) {
            statusBadge.textContent = 'Payment Verification Pending';
            statusBadge.className = 'payment-status-pill status-verification-pending';
          }
          if (postUtrFeedback) {
            postUtrFeedback.style.display = 'block';
            postUtrFeedback.style.color = '#10B981';
            postUtrFeedback.textContent = '✓ Transaction reference submitted successfully. Status updated to Payment Verification Pending.';
          }
          if (confirmedRegistrationRecord) {
            confirmedRegistrationRecord.paymentReference = refVal;
            confirmedRegistrationRecord.paymentStatus = 'payment_verification_pending';
            if (confirmedRegistrationRecord.fee) {
              confirmedRegistrationRecord.fee.paymentStatusLabel = 'Payment Verification Pending';
            }
          }
          if (typeof showToastNotification === 'function') {
            showToastNotification('Payment reference submitted for verification!');
          }
        } else {
          if (postUtrFeedback) {
            postUtrFeedback.style.display = 'block';
            postUtrFeedback.style.color = '#EF4444';
            postUtrFeedback.textContent = json.message || 'Failed to submit payment reference.';
          }
        }
      } catch (err) {
        if (postUtrFeedback) {
          postUtrFeedback.style.display = 'block';
          postUtrFeedback.style.color = '#EF4444';
          postUtrFeedback.textContent = 'Network error while submitting payment reference.';
        }
      } finally {
        postUtrBtn.disabled = false;
        postUtrBtn.textContent = 'Submit UTR for Verification';
      }
    });
  }

  if (successBox) {
    successBox.style.display = 'block';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (typeof showToastNotification === 'function') {
    showToastNotification('✓ Registration submitted successfully! ID: ' + registration.registrationId);
  }
}

/**
 * Error display handler
 */
function displaySubmissionError(title, message) {
  const errorAlert = document.getElementById('submissionErrorAlert');
  const errorTitle = document.getElementById('submissionErrorTitle');
  const errorDesc = document.getElementById('submissionErrorDesc');

  if (errorTitle) errorTitle.innerHTML = title;
  if (errorDesc) errorDesc.textContent = message;
  if (errorAlert) {
    errorAlert.style.display = 'block';
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (typeof showToastNotification === 'function') {
    showToastNotification('Submission issue: Please check error details.');
  }
}

/**
 * Confirmed Registration WhatsApp Sharing
 */
function shareConfirmedRegistrationOnWhatsApp(regData) {
  if (!regData) {
    if (typeof showToastNotification === 'function') {
      showToastNotification('No confirmed registration data available.');
    }
    return;
  }

  const regId = regData.registrationId || '';
  const studentName = regData.student?.fullName || 'Student';
  const count = (regData.selectedGames || []).length;
  const totalFee = regData.fee?.totalAmount || regData.feeAmount || (count * 5);
  const gamesList = (regData.selectedGames || [])
    .map(g => `- ${g.gameName || g.gameId} (${g.participationType === 'team' ? 'Team Entry' : 'Solo / Individual'})`)
    .join('\n');

  const paymentStatusLabel = regData.fee?.paymentStatusLabel || (regData.paymentStatus === 'paid' ? 'Payment Verified' : (regData.paymentStatus === 'payment_verification_pending' ? 'Payment Verification Pending' : 'Payment Pending'));
  const utrLine = regData.paymentReference ? `Transaction Reference: ${regData.paymentReference}\n` : '';

  const message = `Hi! I have officially registered for the Vijayadashami Carnival!

Official Registration ID: ${regId}
Participant: ${studentName}
Date: Thursday, 29 October 2026 at 11:00 AM
Venue: SRMU Campus, B5

Confirmed Activities:
${gamesList}

Total Registration Fee: ₹${totalFee}.00 INR
Online Payment Status: ${paymentStatusLabel}
${utrLine}
Join the official WhatsApp group "SRMU Vijayadashami Carnivals" for updates.
See you at Building B5!`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  try {
    const waWindow = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!waWindow || waWindow.closed || typeof waWindow.closed === 'undefined') {
      window.location.href = waUrl;
    }
  } catch (err) {
    window.location.href = waUrl;
  }
}

/**
 * Confirmed Registration Copy Summary
 */
function copyConfirmedRegistrationSummary(regData) {
  if (!regData) return;

  const regId = regData.registrationId || '';
  const studentName = regData.student?.fullName || '';
  const roll = regData.student?.rollNumber || '';
  const course = regData.student?.course || '';
  const branch = regData.student?.branch || '';
  const year = regData.student?.academicYear || '';
  const count = (regData.selectedGames || []).length;
  const totalFee = regData.fee?.totalAmount || regData.feeAmount || (count * 5);
  const gamesList = (regData.selectedGames || [])
    .map(g => `• ${g.gameName || g.gameId} [${g.participationType === 'team' ? 'Team' : 'Individual'}]`)
    .join('\n');

  const paymentStatusLabel = regData.fee?.paymentStatusLabel || (regData.paymentStatus === 'paid' ? 'Payment Verified' : (regData.paymentStatus === 'payment_verification_pending' ? 'Payment Verification Pending' : 'Payment Pending'));
  const utrLine = regData.paymentReference ? `Transaction Reference: ${regData.paymentReference}\n` : '';

  const summary = `VIJAYADASHAMI CARNIVAL — OFFICIAL REGISTRATION CONFIRMATION
Registration ID: ${regId}
Participant: ${studentName} (Roll: ${roll})
Academic Profile: ${course} - ${branch} ${year ? `(${year})` : ''}

Date: Thursday, 29 October 2026
Time: 11:00 AM
Venue: SRMU Campus, B5

Confirmed Activities:
${gamesList}

Total Registration Fee: ₹${totalFee}.00 INR
Online Payment Status: ${paymentStatusLabel}
${utrLine}* Note: Save or screenshot this Registration ID. Present it upon arrival at Building B5.`;

  const statusEl = document.getElementById('confirmedCopyStatusMessage');
  const setStatus = (msg, isSuccess) => {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.className = `copy-status-msg ${isSuccess ? 'success' : 'error'} show`;
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 5000);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(summary)
      .then(() => {
        setStatus('✓ Confirmed registration summary copied to clipboard!', true);
        if (typeof showToastNotification === 'function') {
          showToastNotification('Registration details copied to clipboard!');
        }
      })
      .catch(() => {
        fallbackCopyText(summary, setStatus);
      });
  } else {
    fallbackCopyText(summary, setStatus);
  }
}

/**
 * 5. WHATSAPP SHARING FEATURE
 * Standard click-to-chat URL: https://api.whatsapp.com/send?text=...
 */
function shareEventOnWhatsApp(formData) {
  let gamesText = '';
  if (formData && formData.games && formData.games.length > 0) {
    gamesText = formData.games.map(g => `- ${g.name} (${g.format === 'team' ? 'Team Entry' : 'Individual'})`).join('\n');
  } else {
    gamesText = '- General Event Attendance';
  }

  const message = `Hi! I'm interested in the Vijayadashami Carnival.

Date: Thursday, 29 October 2026
Time: 11:00 AM
Venue: SRMU Campus, B5

Games:
${gamesText}

This is an event/selection preview. Official registration will be available after the registration system is enabled.`;

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

  try {
    const waWindow = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!waWindow || waWindow.closed || typeof waWindow.closed === 'undefined') {
      if (typeof showToastNotification === 'function') {
        showToastNotification('WhatsApp pop-up was blocked. Redirecting directly...');
      }
      window.location.href = waUrl;
    } else {
      if (typeof showToastNotification === 'function') {
        showToastNotification('Opening WhatsApp with your prefilled event message...');
      }
    }
  } catch (err) {
    window.location.href = waUrl;
  }
}

/**
 * 6. COPY EVENT SUMMARY TO CLIPBOARD
 */
function copyEventSummary(formData) {
  let gamesText = '';
  if (formData && formData.games && formData.games.length > 0) {
    gamesText = formData.games.map(g => `• ${g.name} (${g.format === 'team' ? 'Team Entry' : 'Individual'})`).join('\n');
  } else {
    gamesText = '• General campus participation (no specific games selected)';
  }

  const summary = `Vijayadashami Carnival
Date: Thursday, 29 October 2026
Time: 11:00 AM
Venue: SRMU Campus, B5

Selected Games:
${gamesText}

* Note: This is an event selection preview. Official registration will be enabled in a later phase.`;

  const statusEl = document.getElementById('copyStatusMessage');
  const setStatus = (msg, isSuccess) => {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.className = `copy-status-msg ${isSuccess ? 'success' : 'error'} show`;
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 5000);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(summary)
      .then(() => {
        setStatus('✓ Event summary copied to clipboard! You can paste and share it.', true);
        if (typeof showToastNotification === 'function') {
          showToastNotification('Event summary copied to clipboard!');
        }
      })
      .catch(() => {
        fallbackCopyText(summary, setStatus);
      });
  } else {
    fallbackCopyText(summary, setStatus);
  }
}

function fallbackCopyText(text, statusCallback) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      statusCallback('✓ Event summary copied to clipboard!', true);
      if (typeof showToastNotification === 'function') {
        showToastNotification('Event summary copied to clipboard!');
      }
    } else {
      throw new Error('Fallback execCommand failed');
    }
  } catch (err) {
    statusCallback('Clipboard access unavailable in this browser. Please manually copy the summary.', false);
    if (typeof showToastNotification === 'function') {
      showToastNotification('Clipboard access unavailable.');
    }
  }
}

/**
 * Legacy Confirmation Modal Handler (Phase 3 Notice)
 */
function initConfirmationModal() {
  const modal = document.getElementById('confirmNoticeModal');
  const closeBtn = document.getElementById('btnConfirmModalClose');
  if (!modal || !closeBtn) return;

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

function openConfirmationModal() {
  const modal = document.getElementById('confirmNoticeModal');
  const closeBtn = document.getElementById('btnConfirmModalClose');
  if (!modal) return;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (closeBtn) {
    closeBtn.focus();
  }
}

// Utility HTML escape helper
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

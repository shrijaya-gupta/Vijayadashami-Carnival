/**
 * Vijayadashami Carnival — Phase 2 Client Interactions
 * 
 * Features:
 * 1. Header scroll elevation
 * 2. Responsive mobile navigation drawer
 * 3. Smooth scrolling with fixed header offset
 * 4. Interactive & accessible Game Details & Provisional Rules Modal
 * 5. Multi-game selection UI preview with floating summary bar
 * 6. Informational toast feedback for upcoming registration
 * 7. Back-to-top smooth scrolling
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initHeaderScroll();
  initMobileNav();
  initSmoothScroll();
  initGameRulesModal();
  initGameSelectionPreview();
  initRegistrationPlaceholderNotice();
  initBackToTop();
});

/**
 * Global In-Memory State for Game Selection Preview (Phase 2)
 * Isolated client-side state preparing UI for Phase 3 registration.
 */
const selectedGamesState = new Set();
let currentModalGameId = null;

/**
 * 0. ACCESSIBLE THEME TOGGLE (LIGHT & DARK VIJAYADASHAMI MODES)
 */
function initThemeToggle() {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const getPreferredTheme = () => {
    try {
      const saved = localStorage.getItem('srmu_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('srmu_theme', theme);
    } catch (e) {}

    themeToggleBtns.forEach((btn) => {
      const isDark = theme === 'dark';
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      const iconEl = btn.querySelector('.theme-toggle-icon');
      const textEl = btn.querySelector('.theme-toggle-text');
      if (iconEl) iconEl.textContent = isDark ? '☀️' : '🌙';
      if (textEl) textEl.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
  };

  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  themeToggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      if (typeof showToastNotification === 'function') {
        showToastNotification(`Theme switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
      }
    });
  });

  // Listen for OS theme changes if user has not explicitly saved preference
  try {
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('srmu_theme')) {
          applyTheme(e.matches ? 'light' : 'dark');
        }
      });
    }
  } catch (e) {}
}

/**
 * 1. HEADER SCROLL STATE
 * Adds an elevation shadow and background blur when scrolling down.
 */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * 2. MOBILE NAVIGATION DRAWER
 * Handles mobile hamburger toggle with accessible ARIA states.
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (!toggleBtn || !navMenu) return;

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : toggleBtn.getAttribute('aria-expanded') !== 'true';
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    navMenu.classList.toggle('is-active', isOpen);
  };

  toggleBtn.addEventListener('click', () => {
    toggleMenu();
  });

  // Close menu when clicking navigation links
  const navLinks = navMenu.querySelectorAll('.nav-link, .btn');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });

  // Close menu if window is resized past mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && toggleBtn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
    }
  }, { passive: true });
}

/**
 * 3. SMOOTH SCROLLING WITH FIXED HEADER OFFSET
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || targetId === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 72;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Set focus to target section for keyboard/screen reader navigation
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
      }
    });
  });
}

/**
 * 4. ACCESSIBLE GAME DETAILS & PROVISIONAL RULES MODAL
 * Dynamically loads all proposed rules, procedures, materials, and safety guidelines
 * from GAMES_DATA for the selected game.
 */
function initGameRulesModal() {
  const modalOverlay = document.getElementById('gameDetailsModal');
  if (!modalOverlay) return;

  const modalContainer = modalOverlay.querySelector('.modal-container');
  const closeBtn = modalOverlay.querySelector('.modal-close-btn');
  const modalDismissBtn = modalOverlay.querySelector('.modal-dismiss-btn');

  // Modal element references
  const modalTitle = document.getElementById('modalGameTitle');
  const modalCategory = document.getElementById('modalGameCategory');
  const modalFormat = document.getElementById('modalGameFormat');
  const modalApprovalStatus = document.getElementById('modalApprovalStatus');
  const modalIconWrap = document.getElementById('modalGameIcon');
  const modalObjective = document.getElementById('modalObjectiveText');
  const modalTeamSize = document.getElementById('modalTeamSizeText');
  const modalDuration = document.getElementById('modalDurationText');
  const modalMaterials = document.getElementById('modalMaterialsText');
  const modalWinningCriteria = document.getElementById('modalWinningCriteriaText');
  const modalProcedureList = document.getElementById('modalProcedureList');
  const modalRulesList = document.getElementById('modalRulesList');
  const modalSafetyList = document.getElementById('modalSafetyList');
  const modalChooseBtn = document.getElementById('modalChooseBtn');
  const modalChooseBtnText = document.getElementById('modalChooseBtnText');

  let lastActiveElement = null;

  // Open modal for a specific game
  const openModal = (gameId, triggerEl) => {
    const game = typeof getGameById === 'function' ? getGameById(gameId) : null;
    if (!game) {
      console.warn(`Game data not found for id: ${gameId}`);
      return;
    }

    currentModalGameId = gameId;
    lastActiveElement = triggerEl;

    // Populate basic headers
    if (modalTitle) modalTitle.textContent = game.name;
    if (modalCategory) modalCategory.textContent = game.category || 'Campus Challenge';
    if (modalFormat) modalFormat.textContent = game.participationType || 'Open Format';
    if (modalApprovalStatus) modalApprovalStatus.textContent = game.approvalStatus || 'Pending Organizer Approval';

    // Populate icon from matching card
    const cardEl = document.getElementById(`card-${gameId}`) || triggerEl.closest('.game-card');
    const svgIcon = cardEl?.querySelector('.game-illustration-svg')?.outerHTML || '';
    if (modalIconWrap && svgIcon) {
      modalIconWrap.innerHTML = svgIcon;
    }

    // Populate metadata
    if (modalObjective) modalObjective.textContent = game.objective;
    if (modalTeamSize) modalTeamSize.textContent = game.suggestedTeamSize;
    if (modalDuration) modalDuration.textContent = game.suggestedDuration;
    if (modalMaterials) modalMaterials.textContent = game.materials;
    if (modalWinningCriteria) modalWinningCriteria.textContent = game.winningCriteria;

    // Populate How to Play (Procedure steps)
    if (modalProcedureList) {
      modalProcedureList.innerHTML = '';
      (game.procedure || []).forEach((stepText, index) => {
        const li = document.createElement('li');
        li.className = 'modal-step-item';
        li.innerHTML = `
          <span class="modal-step-num">${index + 1}</span>
          <span>${stepText}</span>
        `;
        modalProcedureList.appendChild(li);
      });
    }

    // Populate Proposed Rules
    if (modalRulesList) {
      modalRulesList.innerHTML = '';
      (game.proposedRules || []).forEach((ruleText) => {
        const li = document.createElement('li');
        li.className = 'modal-rule-item';
        li.innerHTML = `
          <span class="rule-bullet">&bull;</span>
          <span>${ruleText}</span>
        `;
        modalRulesList.appendChild(li);
      });
    }

    // Populate Safety Notes
    if (modalSafetyList) {
      modalSafetyList.innerHTML = '';
      (game.safetyNotes || []).forEach((noteText) => {
        const li = document.createElement('li');
        li.textContent = noteText;
        modalSafetyList.appendChild(li);
      });
    }

    // Sync modal "Choose This Game" button state with selection
    updateModalChooseButton(gameId);

    // Show modal & prevent background scroll
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Move keyboard focus inside modal
    if (closeBtn) {
      closeBtn.focus();
    }
  };

  // Close modal handler
  const closeModal = () => {
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentModalGameId = null;

    // Restore focus to button that opened it
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  };

  // Attach click listeners to all "View Rules" buttons
  const viewRulesButtons = document.querySelectorAll('.btn-view-rules');
  viewRulesButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.gameId;
      openModal(gameId, btn);
    });
  });

  // Modal close triggers
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener('click', closeModal);

  // Close on backdrop click (click outside modalContainer)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Modal selection button toggle
  if (modalChooseBtn) {
    modalChooseBtn.addEventListener('click', () => {
      if (currentModalGameId) {
        toggleGameSelection(currentModalGameId);
        updateModalChooseButton(currentModalGameId);
      }
    });
  }

  // Keyboard navigation: Escape key to close, Tab focus trapping
  document.addEventListener('keydown', (e) => {
    if (!modalOverlay.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusables = Array.from(modalContainer.querySelectorAll(focusableSelectors));
      if (focusables.length === 0) return;

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  });
}

/**
 * Updates the "Choose This Game" button inside the modal dialog
 */
function updateModalChooseButton(gameId) {
  const modalChooseBtn = document.getElementById('modalChooseBtn');
  const modalChooseBtnText = document.getElementById('modalChooseBtnText');
  if (!modalChooseBtn || !modalChooseBtnText) return;

  const isSelected = selectedGamesState.has(gameId);

  if (isSelected) {
    modalChooseBtn.classList.add('is-selected');
    modalChooseBtnText.textContent = 'Selected in Preview ✓ (Click to Remove)';
    modalChooseBtn.setAttribute('aria-label', 'Remove game from preview selection');
  } else {
    modalChooseBtn.classList.remove('is-selected');
    modalChooseBtnText.textContent = 'Choose This Game (Preview)';
    modalChooseBtn.setAttribute('aria-label', 'Choose this game in preview selection');
  }
}

/**
 * 5. GAME SELECTION UI PREVIEW (PHASE 2)
 * Manages selecting/deselecting multiple games, updating card states,
 * and maintaining the floating Selection Preview Bar.
 */
function initGameSelectionPreview() {
  // Attach click listeners to all card toggle buttons
  const cardToggleButtons = document.querySelectorAll('.btn-select-toggle');
  cardToggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = btn.dataset.gameId;
      if (gameId) {
        toggleGameSelection(gameId);
      }
    });
  });

  // Attach clear all button in preview bar
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');
  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener('click', () => {
      selectedGamesState.clear();
      syncAllGameSelectionUI();
      showToastNotification('Selection preview cleared.');
    });
  }

  // Initial sync
  syncAllGameSelectionUI();
}

/**
 * Toggles a game in the local selection state
 */
function toggleGameSelection(gameId) {
  const game = typeof getGameById === 'function' ? getGameById(gameId) : null;
  const gameName = game ? game.name : 'Game';

  if (selectedGamesState.has(gameId)) {
    selectedGamesState.delete(gameId);
    showToastNotification(`Removed ${gameName} from preview selection.`);
  } else {
    selectedGamesState.add(gameId);
    showToastNotification(`Added ${gameName} to preview selection.`);
  }

  syncAllGameSelectionUI();
}

/**
 * Synchronizes the entire UI (cards, modal button, and floating preview bar)
 * with the current in-memory selectedGamesState.
 */
function syncAllGameSelectionUI() {
  const totalGamesCount = (typeof GAMES_DATA !== 'undefined') ? GAMES_DATA.length : 6;
  const selectedCount = selectedGamesState.size;

  // 1. Update each game card
  const allCards = document.querySelectorAll('.game-card');
  allCards.forEach((card) => {
    const gameId = card.dataset.gameId;
    const isSelected = selectedGamesState.has(gameId);
    const toggleBtn = card.querySelector('.btn-select-toggle');
    const btnLabel = toggleBtn?.querySelector('.select-btn-label');

    if (isSelected) {
      card.classList.add('is-selected');
      if (toggleBtn) {
        toggleBtn.classList.add('is-active');
        if (btnLabel) btnLabel.textContent = 'Selected ✓';
        toggleBtn.setAttribute('aria-label', `Deselect ${card.querySelector('.game-title')?.textContent || 'game'}`);
      }
    } else {
      card.classList.remove('is-selected');
      if (toggleBtn) {
        toggleBtn.classList.remove('is-active');
        if (btnLabel) btnLabel.textContent = 'Choose Game';
        toggleBtn.setAttribute('aria-label', `Choose ${card.querySelector('.game-title')?.textContent || 'game'} in preview`);
      }
    }
  });

  // 2. Update modal choose button if open
  if (currentModalGameId) {
    updateModalChooseButton(currentModalGameId);
  }

  // 3. Update Floating Selection Preview Bar
  const previewBar = document.getElementById('selectionPreviewBar');
  const countBadge = document.getElementById('selectionCountBadge');
  const chipsContainer = document.getElementById('selectedChipsContainer');
  const feeAmount = selectedCount * 5;

  // Update dynamic registration fee counters in the form
  const feeGameCountEl = document.getElementById('feeDisplayGameCount') || document.getElementById('feeGamesCountDisplay');
  const feeTotalEl = document.getElementById('feeDisplayTotalAmount') || document.getElementById('feeTotalAmountDisplay');
  const barFeeEl = document.getElementById('selectionBarFeeAmount');
  if (feeGameCountEl) feeGameCountEl.textContent = String(selectedCount);
  if (feeTotalEl) feeTotalEl.textContent = `₹${feeAmount}.00`;
  if (barFeeEl) barFeeEl.textContent = `₹${feeAmount}.00`;

  if (previewBar && countBadge && chipsContainer) {
    countBadge.innerHTML = `<span>${selectedCount} / ${totalGamesCount} Selected</span> <span class="selection-bar-fee-pill">Fee: ₹5 × ${selectedCount} = ₹${feeAmount}</span>`;

    if (selectedCount > 0) {
      previewBar.classList.add('is-visible');
      previewBar.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-selection-bar');

      // Render chip elements
      chipsContainer.innerHTML = '';
      selectedGamesState.forEach((gameId) => {
        const game = typeof getGameById === 'function' ? getGameById(gameId) : null;
        if (!game) return;

        const chip = document.createElement('span');
        chip.className = 'selected-game-chip';
        chip.innerHTML = `
          <span>${game.name}</span>
          <button type="button" class="chip-remove-btn" data-game-id="${gameId}" aria-label="Remove ${game.name} from selection">
            &times;
          </button>
        `;

        // Wire remove click
        const removeBtn = chip.querySelector('.chip-remove-btn');
        if (removeBtn) {
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleGameSelection(gameId);
          });
        }

        chipsContainer.appendChild(chip);
      });
    } else {
      previewBar.classList.remove('is-visible');
      previewBar.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-selection-bar');
      chipsContainer.innerHTML = '';
    }
  }

  // 4. Synchronize Registration Form UI (Phase 3)
  if (typeof syncRegistrationFormGamesUI === 'function') {
    syncRegistrationFormGamesUI();
  }
}

/**
 * 6. TOAST NOTIFICATION UTILITY
 */
let toastTimeoutId = null;

function showToastNotification(message) {
  const toastContainer = document.getElementById('toastNotification');
  if (!toastContainer) return;

  const toastMessageEl = toastContainer.querySelector('.toast-message');
  if (toastMessageEl) toastMessageEl.textContent = message;

  if (toastTimeoutId) clearTimeout(toastTimeoutId);

  toastContainer.classList.add('show');
  toastContainer.setAttribute('aria-hidden', 'false');

  toastTimeoutId = setTimeout(() => {
    toastContainer.classList.remove('show');
    toastContainer.setAttribute('aria-hidden', 'true');
  }, 3400);
}

/**
 * Registration Placeholder Notice handler
 */
function initRegistrationPlaceholderNotice() {
  const comingSoonBtns = document.querySelectorAll('.btn-registration-coming-soon');
  comingSoonBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      showToastNotification('🎉 Registration portal opens in Phase 3! Explore and preview game rules today.');
    });
  });
}

/**
 * 7. BACK TO TOP BUTTON
 */
function initBackToTop() {
  const backToTopBtn = document.querySelector('.footer-back-to-top');
  if (!backToTopBtn) return;

  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

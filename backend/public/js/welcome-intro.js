/**
 * Vijayadashami Carnival — Welcome Intro & Mela Animation Controller
 * 
 * Manages:
 * 1. 5-step sequence: Entrance -> Ceremonial Arrow -> Effigy Burning -> Welcome Message -> Enter Carnival
 * 2. Immediate "Skip Intro" option and countdown auto-transition
 * 3. Accessibility & reduced motion handling
 * 4. Canvas particle sparks & celebration fireworks
 * 5. Replay Intro trigger from homepage
 * 6. SessionStorage management to prevent disruptive replay on page reloads
 */

(function() {
  'use strict';

  // Configuration Constants
  const TIMINGS = {
    ARROW_START: 1800,      // Arrow begins flight
    ARROW_IMPACT: 2950,     // Arrow hits effigy, triggers golden flash
    BURNING_START: 3150,    // Symbolic festival flames ignite, sparks ascend
    WELCOME_REVEAL: 4800,   // Welcome message card slides in
    AUTO_ENTER: 8500        // Automatic transition to homepage if unclicked
  };

  let introTimeouts = [];
  let sparksAnimId = null;
  let countdownInterval = null;
  let isIntroActive = false;

  document.addEventListener('DOMContentLoaded', () => {
    initWelcomeIntro();
    initReplayButtons();
  });

  /**
   * Initializes the welcome sequence or skips if previously seen in current session
   */
  function initWelcomeIntro() {
    const overlay = document.getElementById('welcomeIntroOverlay');
    if (!overlay) return;

    // Check if user already completed the intro in this browser session
    const hasSeenIntro = sessionStorage.getItem('srmu_carnival_intro_seen');
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Skip automatically if already seen in current session
    if (hasSeenIntro === 'true') {
      overlay.classList.add('intro-hidden');
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      return;
    }

    // Launch welcome sequence
    isIntroActive = true;
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    // Wire action buttons
    bindIntroControls();

    // If reduced motion is requested by user, show static welcome card directly
    if (prefersReducedMotion) {
      showReducedMotionWelcome();
      return;
    }

    // Start full cinematic sequence
    startCinematicSequence();
  }

  /**
   * Binds click and keyboard handlers for Skip and Enter buttons
   */
  function bindIntroControls() {
    const btnSkip = document.getElementById('btnSkipIntro');
    const btnEnter = document.getElementById('btnEnterCarnival');

    btnSkip?.addEventListener('click', (e) => {
      e.preventDefault();
      finishWelcomeIntro('skip_button');
    });

    btnEnter?.addEventListener('click', (e) => {
      e.preventDefault();
      finishWelcomeIntro('enter_button');
    });

    // Keyboard shortcut: Escape key skips intro
    document.addEventListener('keydown', handleIntroKeydown);
  }

  function handleIntroKeydown(e) {
    if (!isIntroActive) return;
    if (e.key === 'Escape') {
      finishWelcomeIntro('esc_key');
    }
  }

  /**
   * Orchestrates the 5-step animation sequence
   */
  function startCinematicSequence() {
    const overlay = document.getElementById('welcomeIntroOverlay');
    const effigyStage = document.getElementById('melaEffigyStage');
    const welcomeCard = document.getElementById('introWelcomeCard');
    const sparksCanvas = document.getElementById('melaSparksCanvas');

    if (!overlay || !effigyStage) return;

    // Clear any prior running state
    clearAllIntroTimers();

    // STEP 1: Festive Entrance (active on load)
    overlay.classList.add('intro-step-1');

    // Init canvas spark particles
    if (sparksCanvas) {
      initSparksCanvas(sparksCanvas);
    }

    // STEP 2: Ceremonial Arrow flight
    introTimeouts.push(setTimeout(() => {
      if (!isIntroActive) return;
      overlay.classList.add('intro-step-2');
    }, TIMINGS.ARROW_START));

    // STEP 2.5: Impact flash
    introTimeouts.push(setTimeout(() => {
      if (!isIntroActive) return;
      overlay.classList.add('intro-impact-active');
      triggerImpactSparks();
    }, TIMINGS.ARROW_IMPACT));

    // STEP 3: Symbolic Effigy Burning & Celebration Sparks
    introTimeouts.push(setTimeout(() => {
      if (!isIntroActive) return;
      overlay.classList.add('intro-step-3', 'intro-burning-active');
      triggerCelebrationFireworks();
    }, TIMINGS.BURNING_START));

    // STEP 4: Welcome Message Card Reveal
    introTimeouts.push(setTimeout(() => {
      if (!isIntroActive) return;
      if (welcomeCard) {
        welcomeCard.classList.add('show-card');
      }
      // Start auto-countdown display (3s)
      startCountdownTimer(3);
    }, TIMINGS.WELCOME_REVEAL));

    // STEP 5: Auto-transition to homepage
    introTimeouts.push(setTimeout(() => {
      if (!isIntroActive) return;
      finishWelcomeIntro('auto_timeout');
    }, TIMINGS.AUTO_ENTER));
  }

  /**
   * Countdown timer for auto-transition
   */
  function startCountdownTimer(seconds) {
    const countdownEl = document.getElementById('countdownSeconds');
    let remaining = seconds;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remaining -= 1;
      if (countdownEl && remaining >= 0) {
        countdownEl.textContent = remaining;
      }
      if (remaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  /**
   * Reduced motion fallback: Shows static festive welcome screen
   */
  function showReducedMotionWelcome() {
    const overlay = document.getElementById('welcomeIntroOverlay');
    const welcomeCard = document.getElementById('introWelcomeCard');

    overlay?.classList.add('intro-step-1', 'intro-burning-active');
    if (welcomeCard) {
      welcomeCard.classList.add('show-card');
    }
  }

  /**
   * Smoothly finishes the welcome intro and reveals the existing homepage
   */
  function finishWelcomeIntro(triggerReason) {
    if (!isIntroActive) return;
    isIntroActive = false;

    // Clear background timers
    clearAllIntroTimers();

    const overlay = document.getElementById('welcomeIntroOverlay');
    if (!overlay) return;

    // Mark as seen in sessionStorage
    try {
      sessionStorage.setItem('srmu_carnival_intro_seen', 'true');
    } catch (e) {}

    // Add hidden transition class
    overlay.classList.add('intro-hidden');

    // Stop canvas animation loop to preserve CPU/memory
    if (sparksAnimId) {
      cancelAnimationFrame(sparksAnimId);
      sparksAnimId = null;
    }

    // Unbind escape key listener
    document.removeEventListener('keydown', handleIntroKeydown);

    // After CSS transition ends, remove overlay from flow and accessibility tree
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');

      // Shift focus gracefully to the hero section heading for screen reader and keyboard accessibility
      const targetFocus = document.getElementById('heroHeading') || document.getElementById('main-content');
      if (targetFocus) {
        targetFocus.setAttribute('tabindex', '-1');
        targetFocus.focus({ preventScroll: true });
      }
    }, 800);
  }

  /**
   * Replays the welcome intro animation on demand
   */
  window.replayWelcomeIntro = function() {
    const overlay = document.getElementById('welcomeIntroOverlay');
    const welcomeCard = document.getElementById('introWelcomeCard');
    if (!overlay) return;

    clearAllIntroTimers();
    if (sparksAnimId) {
      cancelAnimationFrame(sparksAnimId);
      sparksAnimId = null;
    }

    // Reset overlay classes
    overlay.className = 'welcome-intro-overlay';
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    if (welcomeCard) {
      welcomeCard.classList.remove('show-card');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Mark active and restart
    isIntroActive = true;
    document.addEventListener('keydown', handleIntroKeydown);

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      showReducedMotionWelcome();
    } else {
      startCinematicSequence();
    }
  };

  /**
   * Inits the navbar & hero "Watch Intro" replay buttons
   */
  function initReplayButtons() {
    const btnNavReplay = document.getElementById('btnReplayIntroNav');
    const btnHeroReplay = document.getElementById('btnReplayIntroHero');

    btnNavReplay?.addEventListener('click', (e) => {
      e.preventDefault();
      window.replayWelcomeIntro();
    });

    btnHeroReplay?.addEventListener('click', (e) => {
      e.preventDefault();
      window.replayWelcomeIntro();
    });
  }

  function clearAllIntroTimers() {
    introTimeouts.forEach((t) => clearTimeout(t));
    introTimeouts = [];
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  // ==========================================================================
  // LIGHTWEIGHT CANVAS CELEBRATION SPARKS & FIREWORKS
  // ==========================================================================
  let sparkParticles = [];
  let sparksCtx = null;

  function initSparksCanvas(canvas) {
    if (!canvas) return;
    sparksCtx = canvas.getContext('2d');
    if (!sparksCtx) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    sparkParticles = [];
    // Ambient rising golden embers
    for (let i = 0; i < 28; i++) {
      sparkParticles.push(createAmbientEmber(canvas));
    }

    renderSparks(canvas);
  }

  function createAmbientEmber(canvas) {
    return {
      x: Math.random() * (canvas?.width || 800),
      y: (canvas?.height || 600) + Math.random() * 80,
      size: Math.random() * 2.8 + 1,
      speedY: -(Math.random() * 1.5 + 0.6),
      speedX: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.7 + 0.3,
      color: Math.random() > 0.4 ? '#FCD34D' : '#F59E0B',
      isExplosion: false,
      life: 1
    };
  }

  function triggerImpactSparks() {
    if (!sparksCtx) return;
    const canvas = sparksCtx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.48;

    // Burst of 45 radiant golden sparks
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      sparkParticles.push({
        x: centerX,
        y: centerY,
        size: Math.random() * 3.5 + 1.5,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        opacity: 1,
        color: ['#FDE047', '#F59E0B', '#EF4444', '#FFFFFF'][Math.floor(Math.random() * 4)],
        isExplosion: true,
        life: 1
      });
    }
  }

  function triggerCelebrationFireworks() {
    if (!sparksCtx) return;
    const canvas = sparksCtx.canvas;

    // 3 celebratory sky firework bursts
    const burstPositions = [
      { x: canvas.width * 0.28, y: canvas.height * 0.22 },
      { x: canvas.width * 0.72, y: canvas.height * 0.25 },
      { x: canvas.width * 0.50, y: canvas.height * 0.16 }
    ];

    burstPositions.forEach((pos, idx) => {
      introTimeouts.push(setTimeout(() => {
        if (!isIntroActive) return;
        for (let i = 0; i < 35; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4.5 + 1.5;
          sparkParticles.push({
            x: pos.x,
            y: pos.y,
            size: Math.random() * 3 + 1.2,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            opacity: 1,
            color: ['#FDE047', '#F59E0B', '#10B981', '#FF7D33'][Math.floor(Math.random() * 4)],
            isExplosion: true,
            life: 1
          });
        }
      }, idx * 450));
    });
  }

  function renderSparks(canvas) {
    if (!sparksCtx || !isIntroActive) return;

    sparksCtx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      const p = sparkParticles[i];

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.isExplosion) {
        p.speedY += 0.08; // gravity
        p.opacity -= 0.016;
        p.life -= 0.016;
      } else {
        // Continuous ambient ember rising
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
      }

      if (p.opacity <= 0 || p.life <= 0) {
        sparkParticles.splice(i, 1);
        continue;
      }

      sparksCtx.save();
      sparksCtx.globalAlpha = Math.max(0, p.opacity);
      sparksCtx.fillStyle = p.color;
      sparksCtx.shadowBlur = 8;
      sparksCtx.shadowColor = p.color;
      sparksCtx.beginPath();
      sparksCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      sparksCtx.fill();
      sparksCtx.restore();
    }

    sparksAnimId = requestAnimationFrame(() => renderSparks(canvas));
  }

})();

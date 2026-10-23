/**
 * Comprehensive Automated Verification for:
 * VIJAYADASHAMI CARNIVAL — ANIMATED WELCOME INTRO + FESTIVE MELA UI
 */

const path = require('path');
const { chromium } = require('playwright');
const assert = require('node:assert');

const FRONTEND_URL = 'http://localhost:3000';

async function runMelaVerification() {
  console.log('================================================================');
  console.log('VIJAYADASHAMI CARNIVAL: WELCOME INTRO & MELA UI VERIFICATION');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  
  // ---------------------------------------------------------------------------
  // TEST SUITE 1: FULL ANIMATED WELCOME INTRO SEQUENCE (Standard Motion)
  // ---------------------------------------------------------------------------
  console.log('[TEST 1] First-time visit: Welcome Intro Overlay Display...');
  const context1 = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page1 = await context1.newPage();
  
  await page1.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });

  // 1. Check Welcome Overlay is visible
  const overlay = page1.locator('#welcomeIntroOverlay');
  await overlay.waitFor({ state: 'visible', timeout: 3000 });
  const isOverlayVisible = await overlay.isVisible();
  console.log('  ✓ Welcome overlay is visible on initial load:', isOverlayVisible);
  assert.strictEqual(isOverlayVisible, true, 'Overlay must be visible initially');

  // 2. Check 10-Headed Ravana Effigy
  console.log('\n[TEST 2] Verifying 10 Heads of Ravana Effigy...');
  const heads = page1.locator('#tenHeadsCrescentGroup .ravana-head');
  const headsCount = await heads.count();
  console.log(`  ✓ Found ${headsCount} distinct heads in #tenHeadsCrescentGroup`);
  assert.strictEqual(headsCount, 10, 'Ravana effigy must feature exactly 10 heads');

  for (let i = 1; i <= 10; i++) {
    const head = page1.locator(`#ravanaHead${i}`);
    const count = await head.count();
    assert.strictEqual(count, 1, `Head #ravanaHead${i} must be identifiable`);
  }
  console.log('  ✓ All 10 heads (ravanaHead1 through ravanaHead10) individually identifiable.');

  // 3. Verify Ceremonial Arrow Element
  console.log('\n[TEST 3] Verifying Ceremonial Arrow & Impact Flame Elements...');
  const arrow = page1.locator('#ceremonialArrowGroup');
  const arrowCount = await arrow.count();
  assert.strictEqual(arrowCount, 1, 'Ceremonial arrow must be present');
  console.log('  ✓ Ceremonial arrow present in scene');

  const flash = page1.locator('#impactFlashGroup');
  const flashCount = await flash.count();
  assert.strictEqual(flashCount, 1, 'Impact flash burst present');
  console.log('  ✓ Impact flash group present');

  const flames = page1.locator('#effigyFlamesGroup');
  const flamesCount = await flames.count();
  assert.strictEqual(flamesCount, 1, 'Effigy flames group present');
  console.log('  ✓ Symbolic celebration flames present');

  const canvas = page1.locator('#melaSparksCanvas');
  const canvasCount = await canvas.count();
  assert.strictEqual(canvasCount, 1, 'Sparks and ember canvas present');
  console.log('  ✓ Canvas sparks emitter present');

  // 4. Verify Welcome Message Card Content
  console.log('\n[TEST 4] Verifying Welcome Message and Supporting Text...');
  const welcomeTitle = await page1.locator('.welcome-main-title').innerText();
  console.log('  Title text:', welcomeTitle);
  assert.ok(welcomeTitle.includes('Welcome to Vijayadashami Carnival'), 'Main title must match requirement');

  const welcomeTagline = await page1.locator('.welcome-tagline').innerText();
  console.log('  Tagline text:', welcomeTagline);
  assert.ok(welcomeTagline.includes('Celebrate tradition, participation and the spirit of togetherness.'), 'Tagline must match requirement');

  // 5. Test "Enter Carnival" Transition
  console.log('\n[TEST 5] Testing "Enter Carnival" Button Transition...');
  const enterBtn = page1.locator('#btnEnterCarnival');
  await enterBtn.waitFor({ state: 'visible', timeout: 6000 });
  await enterBtn.click();

  // Overlay should hide with .intro-hidden
  await page1.waitForSelector('#welcomeIntroOverlay.intro-hidden', { state: 'attached', timeout: 3000 });
  console.log('  ✓ Enter Carnival button smoothly transitioned overlay into .intro-hidden');

  // Verify sessionStorage was set
  const sessionVal = await page1.evaluate(() => sessionStorage.getItem('srmu_carnival_intro_seen'));
  console.log('  ✓ sessionStorage srmu_carnival_intro_seen:', sessionVal);
  assert.strictEqual(sessionVal, 'true', 'sessionStorage must record intro seen');

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: IMMEDIATE SKIP INTRO & NO REPLAY ON RELOAD
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 6] Testing Immediate "Skip Intro" & Session Persistence...');
  const context2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page2 = await context2.newPage();
  await page2.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });

  // Immediate Skip Intro click within 500ms
  const skipBtn = page2.locator('#btnSkipIntro');
  await skipBtn.waitFor({ state: 'visible', timeout: 2000 });
  await skipBtn.click();
  await page2.waitForSelector('#welcomeIntroOverlay.intro-hidden', { state: 'attached', timeout: 2000 });
  console.log('  ✓ Immediate Skip Intro successfully hid overlay');

  // Reload page to verify it does not replay automatically
  console.log('  Reloading page to test sessionStorage persistence...');
  await page2.reload({ waitUntil: 'domcontentloaded' });
  const isHiddenAfterReload = await page2.evaluate(() => {
    const ov = document.getElementById('welcomeIntroOverlay');
    return ov && (ov.classList.contains('intro-hidden') || ov.style.display === 'none');
  });
  console.log('  ✓ Intro stays hidden upon page refresh in same session:', isHiddenAfterReload);
  assert.strictEqual(isHiddenAfterReload, true, 'Intro must not replay on normal reload in same session');

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: REPLAY INTRO FUNCTIONALITY
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 7] Testing Replay Intro from Homepage...');
  const replayNavBtn = page2.locator('#btnReplayIntroNav');
  await replayNavBtn.click();

  const isReplayActive = await page2.evaluate(() => {
    const ov = document.getElementById('welcomeIntroOverlay');
    return ov && !ov.classList.contains('intro-hidden') && ov.style.display !== 'none';
  });
  console.log('  ✓ Replay button restored welcome overlay:', isReplayActive);
  assert.strictEqual(isReplayActive, true, 'Replay button must show overlay again');

  // Dismiss via Escape key
  await page2.keyboard.press('Escape');
  await page2.waitForSelector('#welcomeIntroOverlay.intro-hidden', { state: 'attached', timeout: 2000 });
  console.log('  ✓ Escape key successfully dismissed replay overlay (Keyboard Accessibility)');

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: PREFERS-REDUCED-MOTION ACCESSIBILITY
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 8] Testing prefers-reduced-motion: reduce...');
  const contextReduced = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce'
  });
  const pageReduced = await contextReduced.newPage();
  await pageReduced.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });

  const hasReducedMotionHandled = await pageReduced.evaluate(() => {
    const overlay = document.getElementById('welcomeIntroOverlay');
    const isOverlayThere = !!overlay;
    // Under reduced motion, arrow and flash are disabled in CSS
    const arrow = document.getElementById('ceremonialArrowGroup');
    const arrowStyle = window.getComputedStyle(arrow);
    return isOverlayThere && (arrowStyle.display === 'none' || arrowStyle.opacity === '0');
  });
  console.log('  ✓ Reduced motion handled cleanly (heavy animations disabled):', hasReducedMotionHandled);
  assert.strictEqual(hasReducedMotionHandled, true, 'Reduced motion mode must disable complex arrow/flash motion');

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: MELA HOMEPAGE DECORATIONS & LAYOUT INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 9] Verifying Indian Mela Homepage Decorations...');
  // Bunting strip
  const bunting = page2.locator('.mela-bunting-strip');
  const buntingCount = await bunting.count();
  console.log(`  ✓ Found ${buntingCount} mela bunting strip (toran jhalar)`);
  assert.strictEqual(buntingCount, 1, 'Mela bunting strip must be present');

  // Hero arch frame
  const archFrame = page2.locator('.hero-mela-arch-frame');
  const archCount = await archFrame.count();
  console.log(`  ✓ Found ${archCount} hero entrance mela arch frame`);
  assert.strictEqual(archCount, 1, 'Hero arch frame must be present');

  // Section dividers
  const dividers = page2.locator('.mela-section-divider');
  const dividersCount = await dividers.count();
  console.log(`  ✓ Found ${dividersCount} festive mela section dividers`);
  assert.ok(dividersCount >= 6, 'Must have at least 6 festive section dividers');

  // Check no horizontal scrollbar (overflow-x = 0)
  const hasHorizontalScroll = await page2.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('  ✓ No unwanted horizontal page scrolling:', !hasHorizontalScroll);
  assert.strictEqual(hasHorizontalScroll, false, 'Decorations must not cause horizontal scrollbar');

  // ---------------------------------------------------------------------------
  // TEST SUITE 6: PRESERVED EVENT INFORMATION & WORKING FUNCTIONALITY
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 10] Verifying Homepage Content Preservation...');
  const heroHeading = await page2.locator('#heroHeading').innerText();
  console.log('  Hero Heading:', heroHeading);
  assert.ok(heroHeading.includes('Vijayadashami'), 'Hero must mention Vijayadashami');

  // Verify Date, Time, Venue, Deadline
  const pageText = await page2.locator('body').innerText();
  assert.ok(pageText.includes('Thursday, 29 October 2026'), 'Must preserve Event Date');
  assert.ok(pageText.includes('11:00 AM'), 'Must preserve Event Time');
  assert.ok(pageText.includes('SRMU Campus, B5'), 'Must preserve Event Venue');
  assert.ok(pageText.includes('Monday, 26 October 2026'), 'Must preserve Registration Deadline');
  assert.ok(pageText.includes('₹5 per selected game'), 'Must preserve ₹5 fee notice');
  assert.ok(pageText.includes('SRMU Vijayadashami Carnivals'), 'Must preserve WhatsApp group name');
  console.log('  ✓ All essential event facts intact (Date, Time, Venue, Deadline, Fee, WhatsApp)');

  // Verify all 6 games
  const gameCards = page2.locator('.game-card');
  const countGames = await gameCards.count();
  console.log(`  ✓ Confirmed ${countGames} active games present`);
  assert.strictEqual(countGames, 6, 'Must show exactly 6 active games');

  // ---------------------------------------------------------------------------
  // TEST SUITE 7: RESPONSIVE SCREENSHOT & VIEWPORT CHECKS
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 11] Checking Responsive Viewports (Mobile & Tablet)...');
  // Mobile Viewport (375x667)
  const mobilePage = await context2.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 667 });
  await mobilePage.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  const mobileHorizScroll = await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('  ✓ Mobile (375px) has no horizontal scroll:', !mobileHorizScroll);
  assert.strictEqual(mobileHorizScroll, false, 'Mobile must not horizontally overflow');

  // Tablet Viewport (768x1024)
  const tabletPage = await context2.newPage();
  await tabletPage.setViewportSize({ width: 768, height: 1024 });
  await tabletPage.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  const tabletHorizScroll = await tabletPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('  ✓ Tablet (768px) has no horizontal scroll:', !tabletHorizScroll);
  assert.strictEqual(tabletHorizScroll, false, 'Tablet must not horizontally overflow');

  await browser.close();
  console.log('\n================================================================');
  console.log('🎉 ALL 11 VERIFICATION TEST SUITES COMPLETED SUCCESSFULLY! 🎉');
  console.log('================================================================\n');
}

runMelaVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});

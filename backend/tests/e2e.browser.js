/**
 * Vijayadashami Carnival — Full End-to-End Browser Automation Test
 * Uses Playwright Chromium to verify real browser workflows:
 * 1. Homepage loading & navigation
 * 2. Games catalogue and rules modal
 * 3. Registration form validation & successful submission
 * 4. Admin login and dashboard access
 * 5. Organizer participation verification & certificate issuance
 * 6. Public QR certificate verification portal & PII privacy checks
 * 7. Certificate PDF download
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { chromium } = require('playwright');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Registration = require('../src/models/Registration');
const Certificate = require('../src/models/Certificate');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

async function runBrowserE2ETest() {
  console.log('================================================================');
  console.log('Vijayadashami Carnival — Full End-to-End Browser Automation');
  console.log('================================================================\n');

  console.log('1. Launching Playwright Chromium browser...');
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Handle all confirm / alert / prompt dialogs automatically
  page.on('dialog', async dialog => {
    console.log(`    [Browser Dialog (${dialog.type()})]:`, dialog.message().slice(0, 70));
    await dialog.accept();
  });

  let testRegId = null;
  let testCertId = null;
  let testVerifyToken = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: HOMEPAGE LOADING
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Loading Homepage (index.html)...');
    await page.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    const pageTitle = await page.title();
    console.log('  Page Title:', pageTitle);
    assert.ok(pageTitle.includes('Vijayadashami Carnival'), 'Title must match event');

    // Check navbar brand
    const brandText = await page.locator('.logo-title').first().innerText();
    assert.strictEqual(brandText, 'Vijayadashami Carnival');
    console.log('  Brand text verified:', brandText);

    // If welcome intro overlay is present on first visit, skip it to enter carnival
    const skipBtn = page.locator('#btnSkipIntro');
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  Dismissing welcome intro overlay to access homepage...');
      await skipBtn.click();
      await page.waitForSelector('#welcomeIntroOverlay.intro-hidden', { state: 'attached', timeout: 3000 }).catch(() => {});
    }

    // -------------------------------------------------------------------------
    // TEST 2: GAMES CATALOGUE & MODAL INTERACTION
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Verifying Games Catalogue & Rules Modal...');
    const gameCards = page.locator('.game-card');
    const gameCount = await gameCards.count();
    console.log(`  Found ${gameCount} game cards in catalogue`);
    assert.strictEqual(gameCount, 6, 'Must display all 6 confirmed games');

    // Click "Rules & Details" button on Lemon Race
    console.log('  Opening game rules modal for Lemon Race...');
    const detailsBtn = page.locator('.game-card button.btn-view-rules[data-game-id="lemon-race"]');
    await detailsBtn.click();

    // Verify modal opens
    const modal = page.locator('#gameDetailsModal');
    await modal.waitFor({ state: 'visible', timeout: 3000 });
    const modalTitle = await page.locator('#modalGameTitle').innerText();
    console.log('  Modal opened successfully with title:', modalTitle);
    assert.ok(modalTitle.toLowerCase().includes('lemon'), 'Modal title should mention Lemon');

    // Close modal
    console.log('  Closing modal...');
    await page.locator('#gameDetailsModal .modal-close-btn').click();
    await modal.waitFor({ state: 'hidden', timeout: 3000 });
    console.log('  Modal closed cleanly.');

    // -------------------------------------------------------------------------
    // TEST 3: REGISTRATION FORM VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing Registration Form Validation...');
    await page.locator('#registration').scrollIntoViewIfNeeded();

    // Try submitting without filling fields
    const reviewBtn = page.locator('#btnReviewRegistration');
    await reviewBtn.click();

    // Verify invalid class is added to required input
    const nameInput = page.locator('#regFullName');
    const isInvalidClass = await nameInput.evaluate(el => el.classList.contains('is-invalid'));
    console.log('  Empty form prevented progression, #regFullName marked invalid:', isInvalidClass);
    assert.strictEqual(isInvalidClass, true, 'Validation must flag empty name');

    // -------------------------------------------------------------------------
    // TEST 4: REGISTRATION SUBMISSION VIA UI
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Submitting Valid Student Registration...');
    const uniqueRoll = `2026E2E${Date.now().toString().slice(-4)}`;

    await page.locator('#regFullName').fill('Pooja Saxena');
    await page.locator('#regMobileNumber').fill('9876543219');
    await page.locator('#regRollNumber').fill(uniqueRoll);
    await page.locator('#regCourse').selectOption('B.Tech');
    await page.locator('#regBranch').selectOption('Computer Science & Engineering');
    await page.locator('#regYear').selectOption('2nd Year');

    // Select game (Musical Chairs)
    console.log('  Selecting Musical Chairs challenge...');
    const musicalChairsBox = page.locator('input.reg-game-checkbox-input[data-game-id="musical-chairs"]');
    await musicalChairsBox.check({ force: true });

    // Open review panel
    const reviewBtnEl = page.locator('#btnReviewRegistration');
    await reviewBtnEl.scrollIntoViewIfNeeded();
    await reviewBtnEl.click();
    const reviewPanel = page.locator('#registrationReviewPanel');
    await reviewPanel.waitFor({ state: 'visible', timeout: 4000 });
    console.log('  Review panel displayed.');

    // Click "Proceed to Registration Preview"
    const confirmDetailsBtn = page.locator('#btnConfirmDetails');
    await confirmDetailsBtn.scrollIntoViewIfNeeded();
    await confirmDetailsBtn.click();
    const confirmPanel = page.locator('#registrationConfirmPanel');
    await confirmPanel.waitFor({ state: 'visible', timeout: 4000 });
    console.log('  Confirmation preview displayed.');

    // Click Submit Official Registration
    console.log('  Submitting registration to server...');
    const submitBtn = page.locator('#btnSubmitRegistration');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Wait for submission success box
    const successBox = page.locator('#submissionSuccessBox');
    await successBox.waitFor({ state: 'visible', timeout: 8000 });

    testRegId = (await page.locator('#confirmedRegIdDisplay').innerText()).trim();
    console.log('  Official Registration ID generated:', testRegId);
    assert.ok(testRegId.startsWith('SRMU-2026-'), 'Registration ID format must be SRMU-2026-XXXXXX');

    // Verify Phase 7 Certificate Status notice is visible in confirmation box
    const certNotice = page.locator('#confirmedCertBadge');
    const noticeText = await certNotice.innerText();
    console.log('  Certificate status notice in confirmation box:', noticeText);
    assert.ok(noticeText.includes('Pending Event Attendance'), 'Must notify student that attendance verification is pending');

    // -------------------------------------------------------------------------
    // TEST 5: ADMIN LOGIN & ATTENDANCE VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Admin Login & Attendance Verification in Dashboard...');
    await page.goto(`${FRONTEND_URL}/admin/login.html`, { waitUntil: 'domcontentloaded' });

    await page.locator('#adminUsername').fill('admin');
    await page.locator('#adminPassword').fill('SrmuAdmin2026!Secure');
    await page.locator('#btnLoginSubmit').click();

    // Wait for dashboard redirect
    await page.waitForURL('**/admin/dashboard.html', { timeout: 6000 });
    console.log('  Logged into Organizer Dashboard successfully.');

    // Navigate to Certificates view
    console.log('  Opening Certificates & Verification section...');
    await page.locator('#navCertificates').click();
    await page.waitForSelector('#viewCertificates.active', { timeout: 4000 });

    // Search for the newly registered student
    await page.locator('#filterCertSearch').fill(testRegId);
    await page.waitForTimeout(600); // debounce

    const participantRow = page.locator('#certificatesTbody tr').filter({ hasText: testRegId });
    await participantRow.waitFor({ state: 'visible', timeout: 5000 });
    const rowText = await participantRow.innerText();
    console.log('  Found participant in dashboard roster (FULL):', JSON.stringify(rowText));
    assert.ok(rowText.includes(testRegId), 'Participant row must show registration ID');
    assert.ok(rowText.toLowerCase().includes('unverified'), 'Must initially show Unverified attendance');

    // Click "Verify" attendance button
    console.log('  Clicking "Verify" attendance button...');
    const verifyBtn = participantRow.locator('button.btn-verify');
    await verifyBtn.click();
    await page.waitForTimeout(1200);

    const updatedRow = page.locator('#certificatesTbody tr').filter({ hasText: testRegId });
    await updatedRow.waitFor({ state: 'visible', timeout: 5000 });
    const isVerifiedPillVisible = await updatedRow.locator('.status-verified').isVisible();
    console.log('  Status-verified pill visible in dashboard:', isVerifiedPillVisible);
    assert.strictEqual(isVerifiedPillVisible, true, 'Attendance must be marked as Verified');

    // -------------------------------------------------------------------------
    // TEST 6: CERTIFICATE ISSUANCE IN DASHBOARD
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Issuing Official Participation Certificate...');
    const issueBtn = updatedRow.locator('button.btn-issue-cert');
    await issueBtn.waitFor({ state: 'visible', timeout: 5000 });
    await issueBtn.click();
    await page.waitForTimeout(1500);

    // Refresh certificates search
    await page.locator('#filterCertSearch').fill(testRegId);
    await page.waitForTimeout(600);

    const certIssuedRow = page.locator('#certificatesTbody tr').filter({ hasText: testRegId });
    await certIssuedRow.waitFor({ state: 'visible', timeout: 5000 });
    const certRowText = await certIssuedRow.innerText();
    assert.ok(certRowText.includes('SRMU-CERT-2026-'), 'Row must now display generated Certificate ID');

    // Extract Certificate ID
    const match = certRowText.match(/SRMU-CERT-2026-[A-Z0-9]+/);
    testCertId = match ? match[0] : null;
    console.log('  Official Certificate ID Issued:', testCertId);
    assert.ok(testCertId);

    // Verify PDF download button is present in row
    const pdfBtn = certIssuedRow.locator('button.btn-cert-download');
    assert.strictEqual(await pdfBtn.isVisible(), true, 'PDF button must be visible');

    // -------------------------------------------------------------------------
    // TEST 7: PUBLIC QR VERIFICATION PORTAL
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Testing Public QR Certificate Verification Page...');
    // Retrieve cryptographic verification token directly from Certificate model
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    const certRecord = await Certificate.findOne({ certificateId: testCertId });
    testVerifyToken = certRecord.verificationToken;
    console.log('  Retrieved cryptographic verification token:', testVerifyToken?.slice(0, 16) + '...');

    // Open public verification page with token
    await page.goto(`${FRONTEND_URL}/verify.html?token=${testVerifyToken}`, { waitUntil: 'domcontentloaded' });

    // Wait for results
    await page.waitForSelector('#validCertDetails', { state: 'visible', timeout: 5000 });

    const bannerStatus = await page.locator('#statusBadgeTitle').innerText();
    const renderedName = await page.locator('#participantName').innerText();
    const renderedCertId = await page.locator('#metaCertId').innerText();
    const btnDownloadPdf = page.locator('#btnDownloadPdf');

    console.log('  Public Verification Status:', bannerStatus);
    console.log('  Participant Name rendered:', renderedName);
    console.log('  Certificate ID rendered:', renderedCertId);

    assert.ok(bannerStatus.includes('Valid') || bannerStatus.includes('Authentic'), 'Status must show valid');
    assert.strictEqual(renderedName, 'Pooja Saxena', 'Participant name must match registration');
    assert.strictEqual(renderedCertId, testCertId, 'Certificate ID must match');
    assert.strictEqual(await btnDownloadPdf.isVisible(), true, 'Download PDF button must be visible');

    // PRIVACY VERIFICATION: Confirm NO sensitive data is anywhere in page DOM
    const fullPageContent = await page.content();
    assert.ok(!fullPageContent.includes('9876543219'), 'Phone number must NOT be present in verification page');
    assert.ok(!fullPageContent.includes(uniqueRoll), 'Roll number must NOT be present in verification page');
    console.log('  Privacy Verified: Zero PII (mobile, roll) leaked on public verification page.');

    // -------------------------------------------------------------------------
    // TEST 8: PDF DOWNLOAD VIA LIVE BROWSER CONTEXT
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Verifying Certificate PDF Stream & Binary Structure...');
    const pdfResponse = await page.request.get(`${BACKEND_URL}/api/certificates/download/${testVerifyToken}`);
    assert.strictEqual(pdfResponse.status(), 200);
    assert.strictEqual(pdfResponse.headers()['content-type'], 'application/pdf');
    const pdfBuffer = await pdfResponse.body();
    console.log('  PDF downloaded successfully. Size:', pdfBuffer.length, 'bytes');
    assert.ok(pdfBuffer.length > 2000, 'PDF buffer must be non-empty');
    assert.strictEqual(pdfBuffer.slice(0, 5).toString('ascii'), '%PDF-', 'PDF must have valid %PDF- magic header');

    console.log('\n================================================================');
    console.log('ALL 8 END-TO-END BROWSER AUTOMATION TESTS PASSED CLEANLY! (100%)');
    console.log('================================================================');

  } finally {
    // Clean up only our test record from database so real registrations are preserved
    if (testRegId) {
      console.log(`\nCleaning up temporary test registration (${testRegId})...`);
      try {
        if (mongoose.connection.readyState === 0) {
          await connectDB();
        }
        await Registration.deleteOne({ registrationId: testRegId });
        if (testCertId) {
          await Certificate.deleteOne({ certificateId: testCertId });
        }
        await mongoose.disconnect();
        console.log('Temporary test records removed cleanly.');
      } catch (err) {
        console.warn('Note on cleanup:', err.message);
      }
    }
    await browser.close();
  }
}

runBrowserE2ETest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\nE2E BROWSER TEST FAILED:', err);
    process.exit(1);
  });

/**
 * Vijayadashami Carnival — SRMU B5
 * Phase 7 Verification Suite: QR Pass Camera Scanner & Simplified Clean Admin UX
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, failureDetails = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${failureDetails}`);
    failedTests++;
  }
}

function getHash(filePath) {
  const content = fs.readFileSync(path.join(__dirname, filePath));
  return crypto.createHash('sha256').update(content).digest('hex');
}

console.log('================================================================');
console.log('PHASE 7 VERIFICATION SUITE: QR PASS CAMERA SCANNER & CLEAN UX');
console.log('================================================================\n');

const dashboardHtml = fs.readFileSync(path.join(__dirname, 'admin/dashboard.html'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(__dirname, 'admin/js/dashboard.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, 'admin/css/admin.css'), 'utf8');

// 1. Offline Html5-Qrcode Library Presence & Integrity
const hasLibRoot = fs.existsSync(path.join(__dirname, 'admin/js/html5-qrcode.min.js'));
const hasLibBackend = fs.existsSync(path.join(__dirname, 'backend/public/admin/js/html5-qrcode.min.js'));
const hasLibPublic = fs.existsSync(path.join(__dirname, 'public/admin/js/html5-qrcode.min.js'));
const libSize = hasLibRoot ? fs.statSync(path.join(__dirname, 'admin/js/html5-qrcode.min.js')).size : 0;

assert(
  hasLibRoot && hasLibBackend && hasLibPublic && libSize > 100000,
  `Test 1: Offline Html5Qrcode library is present across all mirrors (${libSize} bytes)`
);

// 2. HTML Includes Scanner Script & Elements
const hasScriptTag = dashboardHtml.includes('<script src="js/html5-qrcode.min.js"></script>');
const hasTopbarScanBtn = dashboardHtml.includes('id="btnQuickScanPass"');
const hasSidebarScanNav = dashboardHtml.includes('id="navScanner"') && dashboardHtml.includes('data-view="scanner"');
const hasViewScanner = dashboardHtml.includes('id="viewScanner"');
const hasQrReaderView = dashboardHtml.includes('id="qrReaderView"');
const hasCamToggleBtn = dashboardHtml.includes('id="btnToggleCamera"');
const hasCamSelect = dashboardHtml.includes('id="cameraDeviceSelect"');
const hasManualInput = dashboardHtml.includes('id="manualPassIdInput"');
const hasVerifyManualBtn = dashboardHtml.includes('id="btnVerifyManualPass"');
const hasResultContainer = dashboardHtml.includes('id="scannerResultContainer"');

assert(
  hasScriptTag && hasTopbarScanBtn && hasSidebarScanNav && hasViewScanner &&
  hasQrReaderView && hasCamToggleBtn && hasCamSelect && hasManualInput &&
  hasVerifyManualBtn && hasResultContainer,
  'Test 2: dashboard.html includes scanner script, topbar shortcut, sidebar item, and viewfinder layout'
);

// 3. Overview Connected Quick Action Hub
const hasQuickHub = dashboardHtml.includes('overview-quick-hub');
const hasQuickScan = dashboardHtml.includes('id="btnQuickHubScan"');
const hasQuickPay = dashboardHtml.includes('id="btnQuickHubPayments"');
const hasQuickRegs = dashboardHtml.includes('id="btnQuickHubRegistrations"');
const hasQuickGame = dashboardHtml.includes('id="btnQuickHubGamewise"');

assert(
  hasQuickHub && hasQuickScan && hasQuickPay && hasQuickRegs && hasQuickGame,
  'Test 3: Overview includes 4 interconnected quick access action cards (Scanner, Payments, Registrations, Games)'
);

// 4. Dashboard JS Scanner State & Handlers
const jsHasInitScanner = dashboardJs.includes('async function initScanner()');
const jsHasStartCam = dashboardJs.includes('async function startCameraScanner()');
const jsHasStopCam = dashboardJs.includes('async function stopCameraScanner()');
const jsHasScanSuccess = dashboardJs.includes('function handleQrScanSuccess(');
const jsHasDisplayPass = dashboardJs.includes('async function fetchAndDisplayPass(');
const jsHasAudioSynth = dashboardJs.includes('function playScanSuccessTone()');
const jsHasAdmitStudent = dashboardJs.includes('window.admitScannedStudent =');
const jsHasApprovePayment = dashboardJs.includes('window.approveScannedPayment =');
const jsHasScannerView = dashboardJs.includes("scanner: 'viewScanner'");

assert(
  jsHasInitScanner && jsHasStartCam && jsHasStopCam && jsHasScanSuccess &&
  jsHasDisplayPass && jsHasAudioSynth && jsHasAdmitStudent && jsHasApprovePayment &&
  jsHasScannerView,
  'Test 4: dashboard.js implements full scanner lifecycle, camera toggle, audio synth beep, and instant admit/payment approval'
);

// 5. CSS Clean Theme Palette & Balanced Braces
const cssOpenBraces = (adminCss.match(/\{/g) || []).length;
const cssCloseBraces = (adminCss.match(/\}/g) || []).length;
const bracesBalanced = cssOpenBraces === cssCloseBraces;
const hasCleanSlate = adminCss.includes('--bg-darkest: #0B0F19;') && adminCss.includes('--bg-card: #182234;');
const hasScannerGrid = adminCss.includes('.scanner-grid-layout');
const hasViewfinder = adminCss.includes('.camera-viewfinder-wrapper');
const hasPassCard = adminCss.includes('.verified-pass-card');
const hasTopbarScanCss = adminCss.includes('.btn-topbar-scanner');

assert(
  bracesBalanced && hasCleanSlate && hasScannerGrid && hasViewfinder && hasPassCard && hasTopbarScanCss,
  `Test 5: admin.css has balanced braces (${cssOpenBraces}/${cssCloseBraces}), clean slate theme, and responsive scanner styles`
);

// 6. Triple Mirror SHA-256 Parity
const backendHtmlParity = getHash('admin/dashboard.html') === getHash('backend/public/admin/dashboard.html');
const backendCssParity = getHash('admin/css/admin.css') === getHash('backend/public/admin/css/admin.css');
const backendJsParity = getHash('admin/js/dashboard.js') === getHash('backend/public/admin/js/dashboard.js');
const viteHtmlParity = getHash('admin/dashboard.html') === getHash('public/admin/dashboard.html');
const viteCssParity = getHash('admin/css/admin.css') === getHash('public/admin/css/admin.css');
const viteJsParity = getHash('admin/js/dashboard.js') === getHash('public/admin/js/dashboard.js');

assert(
  backendHtmlParity && backendCssParity && backendJsParity && viteHtmlParity && viteCssParity && viteJsParity,
  'Test 6: 100% Triple-Mirror SHA-256 parity confirmed across admin/, backend/public/admin/, and public/admin/'
);

console.log('\n================================================================');
console.log(`PHASE 7 TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

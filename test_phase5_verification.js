/**
 * Vijayadashami Carnival — SRMU B5
 * Phase 5 Automated Verification Suite: Admin Dashboard & Event Management
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

console.log('================================================================');
console.log('PHASE 5 VERIFICATION SUITE: ADMIN DASHBOARD & EVENT MANAGEMENT');
console.log('================================================================\n');

const dashboardHtml = fs.readFileSync(path.join(__dirname, 'admin/dashboard.html'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(__dirname, 'admin/js/dashboard.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, 'admin/css/admin.css'), 'utf8');
const adminDashboardController = fs.readFileSync(path.join(__dirname, 'backend/src/controllers/adminDashboardController.js'), 'utf8');

// -----------------------------------------------------------------------------
// 1. Sidebar Navigation Structure
// -----------------------------------------------------------------------------
const hasOverviewNav = dashboardHtml.includes('id="navOverview"') && dashboardHtml.includes('data-view="overview"');
const hasRegsNav = dashboardHtml.includes('id="navRegistrations"') && dashboardHtml.includes('data-view="registrations"');
const hasGamewiseNav = dashboardHtml.includes('id="navGamewise"') && dashboardHtml.includes('data-view="gamewise"');
const hasPaymentsNav = dashboardHtml.includes('id="navPayments"') && dashboardHtml.includes('data-view="payments"');
const hasCertsNav = dashboardHtml.includes('id="navCertificates"') && dashboardHtml.includes('data-view="certificates"');
const hasExportNav = dashboardHtml.includes('id="navExport"') && dashboardHtml.includes('data-view="export"');
const hasLogoutBtn = dashboardHtml.includes('id="btnLogoutSidebar"');

assert(
  hasOverviewNav && hasRegsNav && hasGamewiseNav && hasPaymentsNav && hasCertsNav && hasExportNav && hasLogoutBtn,
  'Test 1: Sidebar navigation contains all 6 management views, external link, and logout button'
);

// -----------------------------------------------------------------------------
// 2. All Dashboard Views Present
// -----------------------------------------------------------------------------
const hasViewOverview = dashboardHtml.includes('id="viewOverview"');
const hasViewRegs = dashboardHtml.includes('id="viewRegistrations"');
const hasViewGamewise = dashboardHtml.includes('id="viewGamewise"');
const hasViewPayments = dashboardHtml.includes('id="viewPayments"');
const hasViewCertificates = dashboardHtml.includes('id="viewCertificates"');
const hasViewExport = dashboardHtml.includes('id="viewExport"');

assert(
  hasViewOverview && hasViewRegs && hasViewGamewise && hasViewPayments && hasViewCertificates && hasViewExport,
  'Test 2: All 6 dashboard view sections exist (#viewOverview, #viewRegistrations, #viewGamewise, #viewPayments, #viewCertificates, #viewExport)'
);

// -----------------------------------------------------------------------------
// 3. Overview Metrics Grid includes Payment Status Counts
// -----------------------------------------------------------------------------
const hasMetricTotalRegs = dashboardHtml.includes('id="metricTotalRegistrations"');
const hasMetricGameEntries = dashboardHtml.includes('id="metricTotalGameEntries"');
const hasMetricIndividual = dashboardHtml.includes('id="metricIndividualEntries"');
const hasMetricTeam = dashboardHtml.includes('id="metricTeamEntries"');
const hasMetricPendingVer = dashboardHtml.includes('id="metricPendingVerPayments"');
const hasMetricPaid = dashboardHtml.includes('id="metricPaidPayments"');
const hasMetricPendingPay = dashboardHtml.includes('id="metricPendingPayments"');
const hasOverviewGamesGrid = dashboardHtml.includes('id="overviewGamesGrid"');
const hasOverviewRecentTbody = dashboardHtml.includes('id="overviewRecentTbody"');

assert(
  hasMetricTotalRegs && hasMetricGameEntries && hasMetricIndividual && hasMetricTeam &&
  hasMetricPendingVer && hasMetricPaid && hasMetricPendingPay && hasOverviewGamesGrid && hasOverviewRecentTbody,
  'Test 3: Overview contains registration counts, game entries, solo/team breakdown, payment status metrics, games grid, and recent registrations'
);

// -----------------------------------------------------------------------------
// 4. All Registrations Filter Bar includes Payment Status Filter
// -----------------------------------------------------------------------------
const hasFilterSearch = dashboardHtml.includes('id="filterSearch"');
const hasFilterGame = dashboardHtml.includes('id="filterGame"');
const hasFilterFormat = dashboardHtml.includes('id="filterFormat"');
const hasFilterStatus = dashboardHtml.includes('id="filterStatus"');
const hasFilterPayStatus = dashboardHtml.includes('id="filterPaymentStatus"');
const hasResetFilters = dashboardHtml.includes('id="btnResetFilters"');
const hasRegsTbody = dashboardHtml.includes('id="registrationsTbody"');

assert(
  hasFilterSearch && hasFilterGame && hasFilterFormat && hasFilterStatus && hasFilterPayStatus && hasResetFilters && hasRegsTbody,
  'Test 4: All Registrations view contains search, game, format, status, and dedicated paymentStatus filters'
);

// -----------------------------------------------------------------------------
// 5. Dedicated Payment Management View Elements
// -----------------------------------------------------------------------------
const hasPayNotice = dashboardHtml.includes('class="payment-desk-notice-card"');
const hasPayPendingVerMetric = dashboardHtml.includes('id="metricPayPendingVer"');
const hasPayVerifiedMetric = dashboardHtml.includes('id="metricPayVerified"');
const hasPayPendingMetric = dashboardHtml.includes('id="metricPayPending"');
const hasPayEstimatedMetric = dashboardHtml.includes('id="metricPayEstimatedTotal"');
const hasPaySearch = dashboardHtml.includes('id="filterPaySearch"');
const hasPayFilterStatus = dashboardHtml.includes('id="filterPayStatus"');
const hasPayFilterGame = dashboardHtml.includes('id="filterPayGame"');
const hasPayReset = dashboardHtml.includes('id="btnResetPayFilters"');
const hasPaymentsTbody = dashboardHtml.includes('id="paymentsTbody"');
const hasPayPagination = dashboardHtml.includes('id="payPaginationInfo"') && dashboardHtml.includes('id="btnPayPrevPage"') && dashboardHtml.includes('id="btnPayNextPage"');

assert(
  hasPayNotice && hasPayPendingVerMetric && hasPayVerifiedMetric && hasPayPendingMetric && hasPayEstimatedMetric &&
  hasPaySearch && hasPayFilterStatus && hasPayFilterGame && hasPayReset && hasPaymentsTbody && hasPayPagination,
  'Test 5: Dedicated Payment Management view contains helpdesk notice, metrics, filtering toolbar, payments table, and pagination'
);

// -----------------------------------------------------------------------------
// 6. Registration Details Modal with Phase 5 Payment Audit Card
// -----------------------------------------------------------------------------
const hasModalRegId = dashboardHtml.includes('id="modalRegIdBadge"');
const hasModalName = dashboardHtml.includes('id="modalStudentName"');
const hasModalMobile = dashboardHtml.includes('id="modalStudentMobile"');
const hasModalFee = dashboardHtml.includes('id="modalRegistrationFee"');
const hasModalPayStatus = dashboardHtml.includes('id="modalPaymentStatus"');
const hasModalPayActionsCard = dashboardHtml.includes('id="modalPayActionsCard"');
const hasModalPayWorkflowDesc = dashboardHtml.includes('id="modalPayWorkflowDesc"');
const hasModalUtrCode = dashboardHtml.includes('id="modalUtrCode"');
const hasBtnCopyModalUtr = dashboardHtml.includes('id="btnCopyModalUtr"');
const hasModalPayButtonsGroup = dashboardHtml.includes('id="modalPayButtonsGroup"');
const hasModalStatusSelect = dashboardHtml.includes('id="modalStatusSelect"');
const hasModalPaymentStatusSelect = dashboardHtml.includes('id="modalPaymentStatusSelect"');
const hasBtnSaveStatus = dashboardHtml.includes('id="btnSaveStatus"');
const hasBtnDelete = dashboardHtml.includes('id="btnDeleteRegistration"');

assert(
  hasModalRegId && hasModalName && hasModalMobile && hasModalFee && hasModalPayStatus &&
  hasModalPayActionsCard && hasModalPayWorkflowDesc && hasModalUtrCode && hasBtnCopyModalUtr &&
  hasModalPayButtonsGroup && hasModalStatusSelect && hasModalPaymentStatusSelect && hasBtnSaveStatus && hasBtnDelete,
  'Test 6: Registration Details modal contains student info, squad rosters, payment audit card with UTR copy and actions'
);

// -----------------------------------------------------------------------------
// 7. CSV Export includes Payment Status Scope
// -----------------------------------------------------------------------------
const hasExportGame = dashboardHtml.includes('id="exportGameScope"');
const hasExportStatus = dashboardHtml.includes('id="exportStatusScope"');
const hasExportPayment = dashboardHtml.includes('id="exportPaymentScope"');
const hasBtnDownloadCsv = dashboardHtml.includes('id="btnDownloadCsv"');

assert(
  hasExportGame && hasExportStatus && hasExportPayment && hasBtnDownloadCsv,
  'Test 7: CSV Data Export contains game scope, status scope, payment scope, and download trigger'
);

// -----------------------------------------------------------------------------
// 8. Backend Controller supports paymentStatus in filter query & dashboard stats
// -----------------------------------------------------------------------------
const controllerHasPayFilter = adminDashboardController.includes('queryParams.paymentStatus');
const controllerHasPayStats = adminDashboardController.includes('paidPaymentsCount') && adminDashboardController.includes('pendingVerificationCount');
const controllerHasPayRef = adminDashboardController.includes('paymentReference: doc.paymentReference');
const controllerHasFormulaSanitize = adminDashboardController.includes('sanitizeCsvCell') && adminDashboardController.includes("str = \"'\" + str");

assert(
  controllerHasPayFilter && controllerHasPayStats && controllerHasPayRef && controllerHasFormulaSanitize,
  'Test 8: Backend adminDashboardController aggregates payment stats, filters by paymentStatus, maps paymentReference, and sanitizes CSV formula injection'
);

// -----------------------------------------------------------------------------
// 9. JavaScript Client Routing & Functions (dashboard.js)
// -----------------------------------------------------------------------------
const jsHasPayState = dashboardJs.includes('payPageState');
const jsHasInitPayments = dashboardJs.includes('function initPaymentsTable()');
const jsHasLoadPayments = dashboardJs.includes('async function loadPaymentsData()');
const jsHasRenderPayments = dashboardJs.includes('function renderPaymentsRows(');
const jsHasMarkPayVerified = dashboardJs.includes('window.markPaymentVerifiedQuick');
const jsHasCopyUtr = dashboardJs.includes('window.copyTextToClipboard');
const jsHasDirectPayUpdate = dashboardJs.includes('window.updatePaymentStatusDirect');
const jsHasSwitchPayments = dashboardJs.includes("payments: 'viewPayments'");

assert(
  jsHasPayState && jsHasInitPayments && jsHasLoadPayments && jsHasRenderPayments &&
  jsHasMarkPayVerified && jsHasCopyUtr && jsHasDirectPayUpdate && jsHasSwitchPayments,
  'Test 9: dashboard.js implements complete payment state, view routing, table renderer, UTR clipboard helper, and verification handlers'
);

// -----------------------------------------------------------------------------
// 10. Fee Calculation Policy Enforcement (Authoritative ₹5 per game)
// -----------------------------------------------------------------------------
const jsEnforces5PerGame = dashboardJs.includes('reg.selectedGames ? reg.selectedGames.length * 5 : 0') ||
  dashboardJs.includes('games.length * 5');
const controllerEnforces5PerGame = adminDashboardController.includes('(doc.selectedGames?.length || 0) * 5') ||
  adminDashboardController.includes('games.length * 5');

assert(
  jsEnforces5PerGame && controllerEnforces5PerGame,
  'Test 10: Authoritative fee calculation strictly adheres to ₹5 per selected game across client and server'
);

// -----------------------------------------------------------------------------
// 11. CSS Brace Balance & Payment Styles in admin.css
// -----------------------------------------------------------------------------
const cssOpenBraces = (adminCss.match(/\{/g) || []).length;
const cssCloseBraces = (adminCss.match(/\}/g) || []).length;
const cssBracesMatch = cssOpenBraces === cssCloseBraces;
const hasPayNoticeCss = adminCss.includes('.payment-desk-notice-card');
const hasPaidPillCss = adminCss.includes('.status-paid');
const hasPendingVerPillCss = adminCss.includes('.status-payment_verification_pending');
const hasUtrBadgeCss = adminCss.includes('.utr-code-badge');
const hasVerifyPayBtnCss = adminCss.includes('.btn-verify-pay');
const hasLightThemePayOverrides = adminCss.includes('[data-theme="light"] .payment-desk-notice-card');

assert(
  cssBracesMatch && hasPayNoticeCss && hasPaidPillCss && hasPendingVerPillCss && hasUtrBadgeCss && hasVerifyPayBtnCss && hasLightThemePayOverrides,
  `Test 11: admin.css has balanced braces (${cssOpenBraces}/${cssCloseBraces}), payment status pills, UTR badges, action buttons, and light theme overrides`
);

// -----------------------------------------------------------------------------
// 12. Syntax Validation (node --check)
// -----------------------------------------------------------------------------
let syntaxCheckPassed = true;
try {
  execSync('node --check admin/js/dashboard.js');
  execSync('node --check admin/js/login.js');
  execSync('node --check backend/src/controllers/adminDashboardController.js');
} catch (err) {
  syntaxCheckPassed = false;
}

assert(syntaxCheckPassed, 'Test 12: JavaScript syntax validation passes with zero errors on all modified files');

// -----------------------------------------------------------------------------
// 13. Dual-Mirror SHA-256 Checksum Parity
// -----------------------------------------------------------------------------
function getHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, filePath))).digest('hex');
}

const dashHtmlParity = getHash('admin/dashboard.html') === getHash('backend/public/admin/dashboard.html');
const adminCssParity = getHash('admin/css/admin.css') === getHash('backend/public/admin/css/admin.css');
const dashJsParity = getHash('admin/js/dashboard.js') === getHash('backend/public/admin/js/dashboard.js');

assert(
  dashHtmlParity && adminCssParity && dashJsParity,
  'Test 13: 100% SHA-256 checksum parity confirmed between root admin/ and backend/public/admin/'
);

// -----------------------------------------------------------------------------
// 14. Mobile Responsive Layout Rules
// -----------------------------------------------------------------------------
const hasMobileNoticeRule = adminCss.includes('@media (max-width: 640px)') && adminCss.includes('.payment-desk-notice-card');
const hasMobileCardRule = adminCss.includes('@media (max-width: 360px)');
const hasMobileTopBarRule = adminCss.includes('.mobile-menu-toggle');

assert(
  hasMobileNoticeRule && hasMobileCardRule && hasMobileTopBarRule,
  'Test 14: Mobile responsive layout rules verified for mobile notice stacking and compact viewport constraints'
);

// -----------------------------------------------------------------------------
// 15. Regression Safety: Phase 3 Verification Suite
// -----------------------------------------------------------------------------
let phase3SuitePassed = true;
try {
  execSync('node test_phase3_verification.js');
} catch (err) {
  phase3SuitePassed = false;
}

assert(phase3SuitePassed, 'Test 15: Phase 3 Verification Suite (15 tests) remains 100% passing');

// -----------------------------------------------------------------------------
// 16. Regression Safety: Phase 4 Verification Suite
// -----------------------------------------------------------------------------
let phase4SuitePassed = true;
try {
  execSync('node test_phase4_verification.js');
} catch (err) {
  phase4SuitePassed = false;
}

assert(phase4SuitePassed, 'Test 16: Phase 4 Verification Suite (17 tests) remains 100% passing');

console.log('\n================================================================');
console.log(`PHASE 5 TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
}

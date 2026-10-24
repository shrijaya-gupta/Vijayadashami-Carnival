/**
 * test_phase6_mobile_verification.js
 * Comprehensive automated verification for Phase 6 Mobile UX upgrades:
 * 1. Mobile Bottom Navigation Bar presence in dashboard.html
 * 2. Bottom Nav event listeners and view sync in dashboard.js
 * 3. Semantic data-label attributes on all 5 table row renderers
 * 4. Responsive table stacked cards and mobile bottom nav CSS
 * 5. 100% SHA-256 parity between admin/ and backend/public/admin/
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('================================================================');
console.log('PHASE 6 VERIFICATION SUITE: MOBILE UX & RESPONSIVE DATA CARDS');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedTests++;
  }
}

function getHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, filePath))).digest('hex');
}

// 1. Dashboard HTML mobile nav check
const dashHtml = fs.readFileSync(path.join(__dirname, 'admin/dashboard.html'), 'utf8');
assert(
  dashHtml.includes('id="mobileBottomNav"') &&
  dashHtml.includes('class="mobile-bottom-nav"') &&
  dashHtml.includes('data-view="overview"') &&
  dashHtml.includes('data-view="registrations"') &&
  dashHtml.includes('data-view="payments"') &&
  dashHtml.includes('data-view="gamewise"') &&
  dashHtml.includes('data-view="certificates"'),
  'Test 1: dashboard.html includes #mobileBottomNav with 5 quick-switch views'
);

// 2. Dashboard JS bottom nav interaction
const dashJs = fs.readFileSync(path.join(__dirname, 'admin/js/dashboard.js'), 'utf8');
assert(
  dashJs.includes('.bottom-nav-item[data-view]') &&
  dashJs.includes("btn.classList.toggle('active', btn.dataset.view === viewName)") &&
  dashJs.includes("document.querySelectorAll('.bottom-nav-item[data-view]').forEach"),
  'Test 2: dashboard.js wires bottom nav click listeners and syncs active state across tabs'
);

// 3. Semantic data-labels across all 5 table row renderers
const hasOverviewDataLabels = dashJs.includes('data-label="ID"') && dashJs.includes('data-label="Student"');
const hasRegsDataLabels = dashJs.includes('data-label="Fee"') && dashJs.includes('data-label="Payment"');
const hasGamewiseDataLabels = dashJs.includes('data-label="Format"') && dashJs.includes('data-label="Squad Details"');
const hasPaymentsDataLabels = dashJs.includes('data-label="UTR / Ref"');
const hasCertificatesDataLabels = dashJs.includes('data-label="Attendance"') && dashJs.includes('data-label="Certificate"');

assert(
  hasOverviewDataLabels && hasRegsDataLabels && hasGamewiseDataLabels && hasPaymentsDataLabels && hasCertificatesDataLabels,
  'Test 3: All 5 data table row renderers attach semantic data-label attributes for mobile card view'
);

// 4. CSS mobile bottom nav & stacked card transformations
const adminCss = fs.readFileSync(path.join(__dirname, 'admin/css/admin.css'), 'utf8');
const cssOpenBraces = (adminCss.match(/\{/g) || []).length;
const cssCloseBraces = (adminCss.match(/\}/g) || []).length;
const cssBalanced = cssOpenBraces === cssCloseBraces;

assert(
  cssBalanced &&
  adminCss.includes('.mobile-bottom-nav') &&
  adminCss.includes('.bottom-nav-item') &&
  adminCss.includes('@media (max-width: 768px)') &&
  adminCss.includes('.data-table thead') &&
  adminCss.includes('content: attr(data-label)') &&
  adminCss.includes('padding-bottom: 92px !important;'),
  `Test 4: admin.css has balanced braces (${cssOpenBraces}/${cssCloseBraces}) and stacked card rules with attr(data-label)`
);

// 5. Dual-Mirror SHA-256 Parity
const dashHtmlParity = getHash('admin/dashboard.html') === getHash('backend/public/admin/dashboard.html');
const adminCssParity = getHash('admin/css/admin.css') === getHash('backend/public/admin/css/admin.css');
const dashJsParity = getHash('admin/js/dashboard.js') === getHash('backend/public/admin/js/dashboard.js');

assert(
  dashHtmlParity && adminCssParity && dashJsParity,
  'Test 5: 100% SHA-256 checksum parity confirmed across all 3 files between admin/ and backend/public/admin/'
);

console.log('\n================================================================');
console.log(`PHASE 6 TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

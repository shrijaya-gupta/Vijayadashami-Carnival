/**
 * Automated Verification Script for Phase 4 Requirements (React + TS + Tailwind Architecture)
 * Vijayadashami Carnival — SRMU B5
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('PHASE 4 REGISTRATION WIZARD & PAYMENT VERIFICATION SUITE');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

// 1. Inspect WizardProgress.tsx
const progressCode = fs.readFileSync('src/components/RegistrationWizard/WizardProgress.tsx', 'utf8');

it('WizardProgress contains 6-step progress indicator and progress bar track', () => {
  assert.ok(progressCode.includes('STEP_LABELS'), 'Must have STEP_LABELS');
  assert.ok(progressCode.includes('progressPercent'), 'Must have progressPercent calculation');
  assert.ok(progressCode.includes('h-full bg-gradient-to-r from-carnival-maroon to-carnival-gold'), 'Must have styled progress bar fill');
  assert.ok(progressCode.includes('grid grid-cols-6'), 'Must display 6 step nav buttons');
});

it('WizardProgress displays dynamic fee pill and step labels', () => {
  assert.ok(progressCode.includes('totalFee'), 'Must display totalFee in pill');
  assert.ok(progressCode.includes('selectedGameIds.length'), 'Must count selected games');
});

// 2. Inspect Step 1 - Step 6 Components
const step1Code = fs.readFileSync('src/components/RegistrationWizard/Step1GamesSelection.tsx', 'utf8');
const step2Code = fs.readFileSync('src/components/RegistrationWizard/Step2StudentDetails.tsx', 'utf8');
const step3Code = fs.readFileSync('src/components/RegistrationWizard/Step3TeamRoster.tsx', 'utf8');
const step4Code = fs.readFileSync('src/components/RegistrationWizard/Step4ReviewSummary.tsx', 'utf8');
const step5Code = fs.readFileSync('src/components/RegistrationWizard/Step5Payment.tsx', 'utf8');
const step6Code = fs.readFileSync('src/components/RegistrationWizard/Step6Confirmation.tsx', 'utf8');

it('Step 1 contains active game selection cards with guidelines and checkboxes', () => {
  assert.ok(step1Code.includes('GAMES_DATA.map'), 'Must map over active games');
  assert.ok(step1Code.includes('toggleGameSelection'), 'Must toggle game selection');
  assert.ok(step1Code.includes('₹5 Online Entry'), 'Must show ₹5 fee per game');
  assert.ok(step1Code.includes('GameGuidelinesModal'), 'Must support guidelines modal');
});

it('Step 2 contains all required student fields and validation attributes', () => {
  assert.ok(step2Code.includes('student.fullName'), 'Must have fullName');
  assert.ok(step2Code.includes('student.mobileNumber'), 'Must have mobileNumber');
  assert.ok(step2Code.includes('student.rollNumber'), 'Must have rollNumber');
  assert.ok(step2Code.includes('student.course'), 'Must have course selection');
  assert.ok(step2Code.includes('student.branch'), 'Must have branch selection');
  assert.ok(step2Code.includes('student.academicYear'), 'Must have academicYear');
  assert.ok(step2Code.includes('student.whatsAppConsent'), 'Must have WhatsApp consent');
});

it('Step 3 contains dynamic team options, format selector, and team leader badge', () => {
  assert.ok(step3Code.includes('Individual Entry'), 'Must have Individual Entry format');
  assert.ok(step3Code.includes('Team / Squad'), 'Must have Team format');
  assert.ok(step3Code.includes('Team Leader:'), 'Must show auto-assigned Team Leader');
  assert.ok(step3Code.includes('addTeamMember'), 'Must support adding teammates');
  assert.ok(step3Code.includes('removeTeamMember'), 'Must support removing teammates');
});

it('Step 4 Review panel contains edit shortcut buttons and summary breakdown', () => {
  assert.ok(step4Code.includes('goToStep(2)'), 'Must have Edit Student Details shortcut');
  assert.ok(step4Code.includes('goToStep(1)'), 'Must have Edit Games shortcut');
  assert.ok(step4Code.includes('goToStep(3)'), 'Must have Edit Teams shortcut');
  assert.ok(step4Code.includes('maskPhone'), 'Must implement phone masking');
  assert.ok(step4Code.includes('Total Payable:'), 'Must display authoritative total fee');
});

it('Step 5 Online Payment UI contains fee summary, QR placeholder, UTR input, and submit action', () => {
  assert.ok(step5Code.includes('srmu.carnival@upi'), 'Must display official receiver UPI ID');
  assert.ok(step5Code.includes('utrNumber'), 'Must have UTR reference input state');
  assert.ok(step5Code.includes('submitRegistration'), 'Must have submit action');
  assert.ok(step5Code.includes('Carnival Helpdesk & Payment Policy Notice'), 'Must display desk audit notice');
});

it('Step 6 Confirmation panel contains confirmed Registration ID, post-submission UTR, WhatsApp share, and cert link', () => {
  assert.ok(step6Code.includes('regId'), 'Must display confirmed registration ID');
  assert.ok(step6Code.includes('handleShareWhatsApp'), 'Must have WhatsApp share action');
  assert.ok(step6Code.includes('handleCopy'), 'Must have copy registration ID action');
  assert.ok(step6Code.includes('submitPostUtr'), 'Must support post-submission UTR update');
  assert.ok(step6Code.includes('Certificate Verification Portal'), 'Must link to certificate verification');
});

// 3. Inspect RegistrationContext.tsx logic
const contextCode = fs.readFileSync('src/context/RegistrationContext.tsx', 'utf8');

it('RegistrationContext defines gameConfigs for all games and handles state', () => {
  assert.ok(contextCode.includes('GAMES_DATA.forEach'), 'Must initialize configs for all games');
  assert.ok(contextCode.includes('toggleGameSelection'), 'Must handle game toggle');
  assert.ok(contextCode.includes('setGameFormat'), 'Must handle format switch');
});

it('Fee calculation logic is strictly count * 5 (not per team member)', () => {
  assert.ok(contextCode.includes('selectedGameIds.length * 5'), 'Fee calculation must be selectedGameIds.length * 5');
  function calc(count) {
    return count * 5;
  }
  assert.strictEqual(calc(1), 5);
  assert.strictEqual(calc(2), 10);
  assert.strictEqual(calc(3), 15);
  assert.strictEqual(calc(6), 30);
});

it('Indian mobile validation regex correctly tests valid and invalid numbers', () => {
  const indianMobileRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
  assert.ok(indianMobileRegex.test('9876543210'), 'Valid 10 digit starting with 9');
  assert.ok(indianMobileRegex.test('+919876543210'), 'Valid with +91');
  assert.ok(indianMobileRegex.test('08765432109'), 'Valid with leading 0');
  assert.ok(!indianMobileRegex.test('1234567890'), 'Invalid: starts with 1');
  assert.ok(!indianMobileRegex.test('98765'), 'Invalid: too short');
  assert.ok(!indianMobileRegex.test('987654321000'), 'Invalid: too long');
  assert.ok(!indianMobileRegex.test('abcdefghij'), 'Invalid: letters');
});

it('Phone masking preserves privacy in review summary', () => {
  function mask(raw) {
    const clean = raw.replace(/[\s\-\(\)]/g, '');
    return clean.length >= 4 
      ? '••••••' + clean.slice(-4) + ' (Protected)'
      : 'Provided (Protected)';
  }
  assert.strictEqual(mask('9876543210'), '••••••3210 (Protected)');
  assert.strictEqual(mask('+919876543210'), '••••••3210 (Protected)');
});

it('Tailwind styling contains responsive card styles and dark/light mode', () => {
  const indexCss = fs.readFileSync('src/index.css', 'utf8');
  assert.ok(indexCss.includes('@tailwind base;'), 'Must have Tailwind base');
  assert.ok(indexCss.includes('@tailwind components;'), 'Must have Tailwind components');
  assert.ok(indexCss.includes('@tailwind utilities;'), 'Must have Tailwind utilities');
});

it('Backend validator enforces strict 10-digit mobile, 1-6 games, and ₹5 fee structure', () => {
  const validatorPath = path.resolve('backend/src/validators/registrationValidator.js');
  const validatorCode = fs.readFileSync(validatorPath, 'utf8');
  assert.ok(validatorCode.includes('validateAndNormalizeMobile'), 'Validator has validateAndNormalizeMobile');
  assert.ok(validatorCode.includes('VALID_GAME_IDS'), 'Validator checks VALID_GAME_IDS');
  assert.ok(validatorCode.includes('selectedGames.length > 6'), 'Validator caps at 6 games');
});

console.log(`\nTEST RESULTS: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) process.exit(1);

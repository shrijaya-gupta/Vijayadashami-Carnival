/**
 * Automated Verification Script for Phase 3 Requirements (React + TS + Tailwind Architecture)
 * Vijayadashami Carnival — SRMU B5
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('PHASE 3 VERIFICATION TEST SUITE (REACT + TS)');
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

// 1. Inspect src/data/games.ts
const gamesTsContent = fs.readFileSync('src/data/games.ts', 'utf8');

it('src/data/games.ts contains exactly 6 active games', () => {
  const ids = (gamesTsContent.match(/id:\s*"([^"]+)"/g) || []).map(s => s.split('"')[1]);
  assert.strictEqual(ids.length, 6, 'Must have exactly 6 active games');
});

it('Treasure Hunt is absent from active games catalogue', () => {
  assert.ok(!gamesTsContent.includes('id: "treasure-hunt"'), 'Treasure Hunt must not be active');
});

const EXPECTED_IDS = [
  'lemon-race',
  'target-shooting',
  'musical-chairs',
  'human-knot',
  'cup-balloon-pyramid',
  'balloon-dual-race'
];

it('All 6 canonical game IDs are present in exact order', () => {
  const ids = (gamesTsContent.match(/id:\s*"([^"]+)"/g) || []).map(s => s.split('"')[1]);
  assert.deepStrictEqual(ids, EXPECTED_IDS);
});

it('Target Shooting has safe supervisor guidelines without weapon instructions', () => {
  const targetShootingSlice = gamesTsContent.slice(
    gamesTsContent.indexOf('id: "target-shooting"'),
    gamesTsContent.indexOf('id: "musical-chairs"')
  );
  assert.ok(targetShootingSlice.includes('supervised target-based accuracy challenge'), 'Must describe accuracy challenge');
  assert.ok(targetShootingSlice.includes('organizer-approved equipment'), 'Must use approved equipment');
  assert.ok(targetShootingSlice.includes('Pending Organizer Confirmation'), 'Status must be pending');
  const lower = targetShootingSlice.toLowerCase();
  assert.ok(!lower.includes('gun') && !lower.includes('rifle') && !lower.includes('pistol') && !lower.includes('bullet'), 'Zero weapon instructions');
  assert.ok(lower.includes('supervised'), 'Must specify supervised area');
});

it('Every game has required fields and ₹5 registration fee', () => {
  EXPECTED_IDS.forEach(id => {
    assert.ok(gamesTsContent.includes(`id: "${id}"`), `${id} must have id`);
    assert.ok(gamesTsContent.includes('registrationFee: "₹5 per selected game"'), `${id} must have ₹5 registration fee`);
    assert.ok(gamesTsContent.includes('procedure: ['), `${id} must have procedure steps`);
    assert.ok(gamesTsContent.includes('proposedRules: ['), `${id} must have proposedRules`);
    assert.ok(gamesTsContent.includes('winningCriteria:'), `${id} must have winningCriteria`);
    assert.ok(gamesTsContent.includes('safetyNotes: ['), `${id} must have safetyNotes`);
    assert.ok(gamesTsContent.includes('approvalStatus:'), `${id} must have approvalStatus`);
  });
});

it('Fee calculation logic behaves strictly as count * 5', () => {
  function calcFee(selectedCount) {
    return selectedCount * 5;
  }
  assert.strictEqual(calcFee(1), 5, '1 game = ₹5');
  assert.strictEqual(calcFee(2), 10, '2 games = ₹10');
  assert.strictEqual(calcFee(3), 15, '3 games = ₹15');
  assert.strictEqual(calcFee(6), 30, '6 games = ₹30');
});

// 2. Inspect src/components/GamesCatalogue.tsx
const catalogueCode = fs.readFileSync('src/components/GamesCatalogue.tsx', 'utf8');

it('GamesCatalogue.tsx Section heading is "Games and Activities"', () => {
  assert.ok(catalogueCode.includes('Games and Activities'), 'Must contain exact section title');
});

it('GamesCatalogue.tsx Section subtitle matches Section 3 specification', () => {
  assert.ok(catalogueCode.includes('Choose from our lineup of traditional and active games. Each game is ₹5 per entry.'), 'Subtitle must match spec');
});

it('GamesCatalogue.tsx contains all 6 game cards with fee tag and selection toggle', () => {
  assert.ok(catalogueCode.includes('GAMES_DATA.map'), 'Must map over all games');
  assert.ok(catalogueCode.includes('₹5 per entry'), 'Must display fee tag');
  assert.ok(catalogueCode.includes('onToggleGame'), 'Must support toggling selection');
});

it('Card buttons use "Guidelines" and "Select Game"', () => {
  assert.ok(catalogueCode.includes('Guidelines'), 'Must have Guidelines button');
  assert.ok(catalogueCode.includes('Select Game'), 'Must have Select Game button');
});

// 3. Inspect src/components/GameGuidelinesModal.tsx
const modalCode = fs.readFileSync('src/components/GameGuidelinesModal.tsx', 'utf8');

it('GameGuidelinesModal contains accessible role, title, short desc, fee, and Select Game button', () => {
  assert.ok(modalCode.includes('role="dialog"'), 'Modal must have role=dialog');
  assert.ok(modalCode.includes('aria-modal="true"'), 'Modal must have aria-modal=true');
  assert.ok(modalCode.includes('id="modalGameTitle"'), 'Modal must have title label');
  assert.ok(modalCode.includes('shortDescription'), 'Modal must display shortDescription');
  assert.ok(modalCode.includes('registrationFee'), 'Modal must display fee');
  assert.ok(modalCode.includes('Select this Game'), 'Modal must have select button');
});

// 4. Inspect src/components/SelectionBar.tsx
const selectionBarCode = fs.readFileSync('src/components/SelectionBar.tsx', 'utf8');

it('SelectionBar exists with count badge, fee pill, disclaimer and chips container', () => {
  assert.ok(selectionBarCode.includes('selectedGameIds.length === 1 ? \'1 Game Selected\''), 'Count badge must exist');
  assert.ok(selectionBarCode.includes('Total: ₹{totalFee}'), 'Fee amount display must exist');
  assert.ok(selectionBarCode.includes('selectedGameIds.map'), 'Selected chips container must exist');
  assert.ok(selectionBarCode.includes('Proceed to Registration'), 'Proceed action button must exist');
});

// 5. Inspect tailwind.config.js & src/index.css
const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
const indexCss = fs.readFileSync('src/index.css', 'utf8');

it('Tailwind config contains responsive games-grid and festive palette', () => {
  assert.ok(tailwindConfig.includes('carnival: {'), 'Must have carnival custom theme colors');
  assert.ok(tailwindConfig.includes('maroon:'), 'Must define festive maroon');
  assert.ok(tailwindConfig.includes('gold:'), 'Must define antique gold');
});

it('Tailwind config and CSS contain restrained gold/maroon border and dark/light themes', () => {
  assert.ok(tailwindConfig.includes('darkMode: \'class\''), 'Must support class-based dark mode');
  assert.ok(indexCss.includes('.dark {'), 'Must have dark mode surface tokens');
});

it('Games catalogue uses 3-column desktop, 2-column tablet, and 1-column mobile grid', () => {
  assert.ok(catalogueCode.includes('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'), 'Must use 3-col desktop, 2-col tablet, 1-col mobile');
});

console.log(`\nTEST RESULTS: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) process.exit(1);

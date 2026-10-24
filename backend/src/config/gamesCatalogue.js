/**
 * Authoritative Games Catalogue — Vijayadashami Carnival
 * 
 * Defines the official six-game catalogue.
 * All proposed rules and formats remain marked as provisional
 * until formal approval by the organizing committee.
 */
const GAMES_CATALOGUE = [
  {
    id: 'lemon-race',
    name: 'Lemon Race',
    category: 'Balance & Speed',
    description: 'Classic campus sprint requiring players to balance a fresh lemon on a spoon while racing through designated lane checkpoints.',
    participationOptions: ['individual', 'team'],
    defaultParticipationType: 'individual',
    rulesApprovalStatus: 'Pending Organizer Approval',
    provisionalNote: 'Provisional format: Organizer will confirm mouth or hand carriage rules before the start signal.'
  },
  {
    id: 'target-shooting',
    name: 'Target Shooting',
    category: 'Focus & Precision',
    description: 'A campus target challenge testing focus, aim, and precision. The activity will follow organizer-approved safety procedures and supervised equipment use in a controlled arena.',
    participationOptions: ['individual', 'team'],
    defaultParticipationType: 'individual',
    rulesApprovalStatus: 'Pending Organizer Approval',
    safetyNotice: 'Only organizer-approved, supervised equipment and procedures may be used. Direct organizer supervision is required at all times.',
    provisionalNote: 'Provisional format: Exact rules, equipment, scoring system, and participant limits are pending organizer confirmation. Safety Notice: Only organizer-approved, supervised equipment and procedures may be used under direct supervision.'
  },
  {
    id: 'musical-chairs',
    name: 'Musical Chairs',
    category: 'Agility & Rhythm',
    description: 'High-energy musical sprint around a decreasing ring of chairs to popular campus beats, demanding razor-sharp reflexes.',
    participationOptions: ['individual'],
    defaultParticipationType: 'individual',
    rulesApprovalStatus: 'Pending Organizer Approval',
    provisionalNote: 'Provisional format: Solo heats of 10 to 16 players each. Simultaneous seat dispute rules to be defined by host.'
  },
  {
    id: 'human-knot',
    name: 'Human Knot',
    category: 'Teamwork & Coordination',
    description: 'Collaborative physical puzzle where participants grasp hands across a circle and maneuver to untangle without releasing contact.',
    participationOptions: ['team', 'individual'],
    defaultParticipationType: 'team',
    rulesApprovalStatus: 'Pending Organizer Approval',
    provisionalNote: 'Provisional format: Group entry of 6 to 10 participants per circle. Time-limit scoring to follow organizer approval.'
  },
  {
    id: 'cup-balloon-pyramid',
    name: 'Cup and Balloon Pyramid Challenge',
    category: 'Skill & Precision',
    description: 'Dexterity challenge using inflated balloons to pick up, transfer, and stack cups into a stable multi-tier pyramid without manual touch.',
    participationOptions: ['individual', 'team'],
    defaultParticipationType: 'individual',
    rulesApprovalStatus: 'Pending Organizer Approval',
    provisionalNote: 'Provisional format: Solo and partner stations. Final tier heights and construction rules pending organizer sign-off.'
  },
  {
    id: 'balloon-dual-race',
    name: 'Balloon Dual Race',
    category: 'Duo Synergy',
    description: 'High-energy pair sprint where teammates balance a balloon between their backs or shoulders while navigating the race course.',
    participationOptions: ['team', 'individual'],
    defaultParticipationType: 'team',
    rulesApprovalStatus: 'Pending Organizer Approval',
    provisionalNote: 'Provisional format: Pairs (2 players). Contact surface constraints and burst-replacement rules pending organizer approval.'
  }
];

/**
 * Legacy catalogue games preserved for historical records
 */
const LEGACY_GAMES = [
  {
    id: 'treasure-hunt',
    name: 'Treasure Hunt',
    category: 'Mystery & Strategy',
    description: 'Cryptic campus clue-solving adventure across Building B5-408 landmarks testing team wit, coordination, and rapid deduction.',
    participationOptions: ['team', 'individual'],
    defaultParticipationType: 'team',
    rulesApprovalStatus: 'Archived / Legacy',
    provisionalNote: 'Historical game preserved for registration archives. Inactive for new registrations.',
    isLegacy: true
  }
];

// Active game IDs allowed for new registrations (baseline 6)
const VALID_GAME_IDS = GAMES_CATALOGUE.map(g => g.id);
const origIncludes = VALID_GAME_IDS.includes.bind(VALID_GAME_IDS);
VALID_GAME_IDS.includes = function(id) {
  if (origIncludes(id)) return true;
  try {
    const gamesStore = require('../services/gamesStore');
    return gamesStore.getActiveGameIds().includes(id);
  } catch (e) {
    return false;
  }
};

// All known game IDs (active + legacy) for database schema validation & historical queries
const ALL_KNOWN_GAME_IDS = [...VALID_GAME_IDS, ...LEGACY_GAMES.map(g => g.id)];

function getGameById(gameId) {
  try {
    const gamesStore = require('../services/gamesStore');
    const fromStore = gamesStore.getGameById(gameId);
    if (fromStore) return fromStore;
  } catch (e) {}
  return GAMES_CATALOGUE.find(g => g.id === gameId) || LEGACY_GAMES.find(g => g.id === gameId) || null;
}

function isActiveGame(gameId) {
  return VALID_GAME_IDS.includes(gameId);
}

module.exports = {
  GAMES_CATALOGUE,
  LEGACY_GAMES,
  VALID_GAME_IDS,
  ALL_KNOWN_GAME_IDS,
  getGameById,
  isActiveGame
};

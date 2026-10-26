const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'gamesStore.json');

// Canonical default games
const DEFAULT_GAMES = [
  {
    id: 'lemon-race',
    name: 'Lemon Race',
    category: 'Balance & Speed',
    participationType: 'Individual',
    shortDescription: 'Balance a lemon on a spoon and reach the finish line.',
    description: 'Classic campus sprint requiring players to balance a fresh lemon on a spoon while racing through designated lane checkpoints.',
    objective: 'Complete the course while maintaining the approved lemon-and-spoon setup.',
    approvalStatus: 'Approved & Active',
    registrationFee: 'Included with All-Access Pass',
    feeAmount: 0,
    suggestedTeamSize: 'Individual (1 player per track lane)',
    suggestedDuration: 'Provisional: 3 to 5 minutes per heat',
    procedure: [
      'Begin behind the designated starting line in your assigned lane.',
      'Carry the lemon and spoon according to the organizer\'s instructions.',
      'Navigate the sprint course towards the finish line without holding or steadying the lemon by hand.',
      'Complete the course while maintaining the approved lemon-and-spoon setup.'
    ],
    proposedRules: [
      'Begin behind the designated starting line.',
      'Carry the lemon and spoon according to the organizer\'s instructions.',
      'Avoid pushing, blocking or interfering with other participants.',
      'If the lemon falls, retrieve it and resume from the drop point.'
    ],
    materials: 'Spoons, lemons, start/finish line markers, and official stopwatches.',
    winningCriteria: 'Completion of the course according to the approved rules.',
    safetyNotes: [
      'Sprint course must be clear, flat, and free of slick surfaces or debris.',
      'Participants must wear appropriate closed-toe footwear.',
      'Maintain safe separation distance between lanes to prevent accidental collisions.'
    ],
    iconName: 'Timer',
    isActive: true,
    isLegacy: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'target-shooting',
    name: 'Target Shooting',
    category: 'Focus & Precision',
    participationType: 'Individual / Supervised Challenge',
    shortDescription: 'Take part in a supervised target-based accuracy challenge.',
    description: 'A campus target challenge testing focus, aim, and precision. The activity will follow organizer-approved safety procedures and supervised equipment use in a controlled arena.',
    objective: 'Hit the designated target using organizer-approved equipment.',
    approvalStatus: 'Approved & Active',
    registrationFee: 'Included with All-Access Pass',
    feeAmount: 0,
    suggestedTeamSize: 'Individual / Supervised',
    suggestedDuration: 'Provisional: 2 to 4 minutes per participant attempt',
    procedure: [
      'Report to the designated supervised target station under direct official guidance.',
      'Receive approved attempt limits and target rotation instructions from the range supervisor.',
      'Execute your challenge attempt strictly within the supervised area.',
      'Step back behind the safety perimeter immediately once your turn concludes.'
    ],
    proposedRules: [
      'Follow the event organizer\'s instructions at all times.',
      'Participate only in the designated supervised area.',
      'Use only the equipment and procedures approved for the event.',
      'Follow all safety boundaries and stop instructions immediately.',
      'Do not aim at people or use equipment outside the activity area.'
    ],
    materials: 'Organizer-approved precision target set, soft projectiles, scoring pads.',
    winningCriteria: 'Highest score based on target rings hit.',
    safetyNotes: [
      'Strict supervised range rules apply at all times.',
      'Participants and spectators must remain behind safety perimeter markings.'
    ],
    iconName: 'Target',
    isActive: true,
    isLegacy: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'musical-chairs',
    name: 'Musical Chairs',
    category: 'Agility & Rhythm',
    participationType: 'Individual',
    shortDescription: 'Circle the chairs while music plays and grab a seat when it stops.',
    description: 'High-energy musical sprint around a decreasing ring of chairs to popular campus beats, demanding razor-sharp reflexes.',
    objective: 'Secure a chair every time the music halts until the champion is crowned.',
    approvalStatus: 'Approved & Active',
    registrationFee: 'Included with All-Access Pass',
    feeAmount: 0,
    suggestedTeamSize: 'Individual (Solo entry)',
    suggestedDuration: 'Provisional: 10 to 15 minutes per round heat',
    procedure: [
      'Assemble around the perimeter of the arranged chair circle.',
      'Circle the chairs continuously in one direction while music plays.',
      'Claim an unoccupied chair immediately as the audio track pauses.',
      'The single player left without a seat is gracefully eliminated for that heat.'
    ],
    proposedRules: [
      'Move clockwise around the ring at a steady pace without lingering.',
      'Keep hands off chair backs until the audio pauses completely.',
      'No pushing, shoving, or pulling chairs out from other contestants.',
      'Organizing referee decision on contested seat ties is final.'
    ],
    materials: 'Sturdy armless chairs, sound system, and whistle.',
    winningCriteria: 'Last remaining participant seated in the final chair duel.',
    safetyNotes: [
      'Ensure clear non-skid floor surface free of bags or loose wires.',
      'Space chairs safely to avoid pinching fingers.'
    ],
    iconName: 'Music',
    isActive: true,
    isLegacy: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'human-knot',
    name: 'Human Knot',
    category: 'Teamwork & Coordination',
    participationType: 'Team / Group',
    shortDescription: 'Work together as a squad to untangle your human circle without breaking grip.',
    description: 'Collaborative physical puzzle where participants grasp hands across a circle and maneuver to untangle without releasing contact.',
    objective: 'Untangle the entire cluster into a clean unbroken circle within the time limit.',
    approvalStatus: 'Approved & Active',
    registrationFee: 'Included with All-Access Pass',
    feeAmount: 0,
    suggestedTeamSize: 'Team / Group (6 to 10 players)',
    suggestedDuration: 'Provisional: 5 to 8 minutes per squad attempt',
    procedure: [
      'Form a tight standing circle facing towards the center.',
      'Reach across with both hands to grab hands of two different opposite teammates.',
      'Communicate, step over, duck under, and rotate to unravel the tangle.',
      'Conclude when all squad members stand in a continuous open circle.'
    ],
    proposedRules: [
      'Never release handholds; grips may pivot and adjust, but fingers must stay connected.',
      'Work calmly without forceful pulling or jerky movements.',
      'Time penalty applies if a hand connection is broken.'
    ],
    materials: 'Open floor arena, official stopwatch, team bandanas.',
    winningCriteria: 'Shortest time to completely untangle into an unbroken circle.',
    safetyNotes: [
      'Maintain gentle motion to prevent wrist or shoulder strain.',
      'Clear perimeter of 3 meters around each active team circle.'
    ],
    iconName: 'Users',
    isActive: true,
    isLegacy: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cup-balloon-pyramid',
    name: 'Cup and Balloon Pyramid Challenge',
    category: 'Skill & Precision',
    participationType: 'Individual or Team (Provisional)',
    shortDescription: 'Use an inflating balloon to lift, transfer, and stack cups into a stable pyramid.',
    description: 'Dexterity challenge using inflated balloons to pick up, transfer, and stack cups into a stable multi-tier pyramid without manual touch.',
    objective: 'Build a complete 6-cup or 10-cup pyramid and disassemble it cleanly using only balloons.',
    approvalStatus: 'Approved & Active',
    registrationFee: 'Included with All-Access Pass',
    feeAmount: 0,
    suggestedTeamSize: 'Individual or Pair (1-2 players)',
    suggestedDuration: 'Provisional: 3 to 5 minutes per attempt',
    procedure: [
      'Place empty challenge cups rim-up at the base station.',
      'Insert an uninflated balloon inside a cup and blow into it to grip the cup walls.',
      'Lift the gripped cup by the balloon neck and transfer it onto the building platform.',
      'Repeat to assemble a 4-tier or 3-tier pyramid without using bare hands.'
    ],
    proposedRules: [
      'Hands may only touch the balloon neck, never the plastic cups directly.',
      'If a cup falls off the table, participant must re-grip it using the balloon.',
      'The pyramid must stand unsupported for 5 seconds upon completion.'
    ],
    materials: 'Paper/plastic cups, latex balloons, flat wooden game tables.',
    winningCriteria: 'Fastest successful pyramid assembly without cup collapses.',
    safetyNotes: [
      'Use sanitized individual balloons for each contestant.',
      'Careful handling of popped balloon pieces.'
    ],
    iconName: 'Layers',
    isActive: true,
    isLegacy: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'balloon-dual-race',
    name: 'Balloon Dual Race',
    category: 'Duo Synergy',
    participationType: 'Pairs / Duo (2 Players)',
    shortDescription: 'Navigate the sprint track in pairs balancing a balloon between you without hands.',
    description: 'High-energy pair sprint where teammates balance a balloon between their backs or shoulders while navigating the race course.',
    objective: 'Cross the finish line in tandem keeping the balloon held firmly between partners.',
    approvalStatus: 'Approved & Active',
    registrationFee: 'Included with All-Access Pass',
    feeAmount: 0,
    suggestedTeamSize: 'Pairs / Duo (2 players)',
    suggestedDuration: 'Provisional: 2 to 4 minutes per heat',
    procedure: [
      'Pair up back-to-back or hip-to-hip at the sprint starting line.',
      'Position the inflated balloon between partners without holding with hands.',
      'Coordinate steps to race along your designated track lane to the turn-around marker and back.',
      'Cross the finish threshold with the balloon still intact and in position.'
    ],
    proposedRules: [
      'Hands and arms must remain folded across chest or behind head.',
      'If the balloon drops, pair must stop, retrieve it, reposition at that exact spot, and resume.',
      'If balloon bursts, pair takes a fresh balloon from referee station with a 5-second hold.'
    ],
    materials: 'High-grade 12-inch balloons, lane cones, whistle, stopwatches.',
    winningCriteria: 'First duo to cleanly cross the finish line without rules infractions.',
    safetyNotes: [
      'Ensure wide sprint lanes with at least 1.5 meters clearance between pairs.',
      'Dry, non-slippery indoor or turf surface.'
    ],
    iconName: 'Zap',
    isActive: true,
    isLegacy: false,
    createdAt: new Date().toISOString()
  }
];

const { supabase } = require('../config/supabase');

class GamesStore {
  constructor() {
    this._memoryCache = null;
    this._ensureStoreFile();
    this._initSupabaseSync().catch(err => {
      console.warn('[GamesStore] Background Supabase sync warning:', err.message);
    });
  }

  async _initSupabaseSync() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: true });
      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          // Seed defaults into Supabase
          for (const g of DEFAULT_GAMES) {
            await this._insertGameToSupabase(g);
          }
          this._memoryCache = [...DEFAULT_GAMES];
        } else {
          this._memoryCache = data.map(r => this._mapSupabaseRow(r));
        }
        this._write(this._memoryCache);
      }
    } catch (e) {
      console.warn('[GamesStore] Initial Supabase sync warning:', e.message);
    }
  }

  _mapSupabaseRow(row) {
    let extra = {};
    if (row.description && typeof row.description === 'string' && row.description.startsWith('{')) {
      try {
        extra = JSON.parse(row.description);
      } catch (e) {}
    }
    const def = DEFAULT_GAMES.find(g => g.id === row.id) || {};
    return {
      ...def,
      id: row.id,
      name: row.name || def.name || 'Carnival Game',
      category: row.category || def.category || 'Fun & Challenge',
      feeAmount: 0,
      fee: 0,
      registrationFee: 'Included with All-Access Pass',
      isActive: row.is_active !== false,
      shortDescription: extra.shortDescription || (typeof row.description === 'string' && !row.description.startsWith('{') ? row.description : '') || def.shortDescription || '',
      description: extra.fullDescription || extra.description || (typeof row.description === 'string' && !row.description.startsWith('{') ? row.description : '') || def.description || '',
      objective: extra.objective || def.objective || 'Complete the event challenge to win awards.',
      participationType: extra.participationType || extra.suggestedTeamSize || def.participationType || 'Individual',
      suggestedTeamSize: extra.suggestedTeamSize || extra.participationType || def.suggestedTeamSize || 'Individual',
      suggestedDuration: extra.suggestedDuration || def.suggestedDuration || '3 to 5 minutes',
      procedure: (Array.isArray(extra.procedure) && extra.procedure.length > 0) ? extra.procedure : (def.procedure || ['Report to arena coordinator.']),
      proposedRules: (Array.isArray(extra.proposedRules) && extra.proposedRules.length > 0) ? extra.proposedRules : (def.proposedRules || ['Fair play rules apply.']),
      materials: extra.materials || def.materials || 'Supplied at arena.',
      winningCriteria: extra.winningCriteria || def.winningCriteria || 'Highest score or completion speed.',
      safetyNotes: (Array.isArray(extra.safetyNotes) && extra.safetyNotes.length > 0) ? extra.safetyNotes : (def.safetyNotes || ['Follow supervisor instructions.']),
      iconName: extra.iconName || def.iconName || 'Gamepad2',
      createdAt: row.created_at || def.createdAt || new Date().toISOString(),
      updatedAt: row.created_at || new Date().toISOString()
    };
  }

  async _insertGameToSupabase(game) {
    if (!supabase) return;
    try {
      const extra = {
        shortDescription: game.shortDescription || game.description,
        fullDescription: game.description || game.shortDescription,
        objective: game.objective,
        participationType: game.participationType,
        suggestedTeamSize: game.suggestedTeamSize,
        suggestedDuration: game.suggestedDuration,
        procedure: game.procedure,
        proposedRules: game.proposedRules,
        materials: game.materials,
        winningCriteria: game.winningCriteria,
        safetyNotes: game.safetyNotes,
        iconName: game.iconName
      };
      const row = {
        id: game.id,
        name: game.name,
        category: game.category,
        fee_amount: 0,
        is_active: game.isActive !== false,
        description: JSON.stringify(extra)
      };
      await supabase.from('games').upsert([row]);
    } catch (e) {
      console.warn('[GamesStore] Supabase insert warning:', e.message);
    }
  }

  _ensureStoreFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(STORE_FILE)) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_GAMES, null, 2), 'utf8');
      }
    } catch (e) {
      // Non-fatal if running in read-only environment like Vercel
    }
  }

  _read() {
    if (Array.isArray(this._memoryCache) && this._memoryCache.length > 0) {
      return this._memoryCache;
    }
    try {
      this._ensureStoreFile();
      if (fs.existsSync(STORE_FILE)) {
        const content = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          this._memoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    this._memoryCache = DEFAULT_GAMES;
    return DEFAULT_GAMES;
  }

  _write(games) {
    this._memoryCache = games;
    try {
      this._ensureStoreFile();
      fs.writeFileSync(STORE_FILE, JSON.stringify(games, null, 2), 'utf8');
    } catch (e) {
      // Ignored on read-only environments (e.g. Vercel)
    }
    return true;
  }

  async getAllGamesAsync({ includeInactive = false } = {}) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          this._memoryCache = data.map(r => this._mapSupabaseRow(r));
          this._write(this._memoryCache);
        }
      } catch (e) {
        console.warn('[GamesStore] getAllGamesAsync error:', e.message);
      }
    }
    const games = this._read();
    if (includeInactive) return games;
    return games.filter(g => g.isActive !== false);
  }

  getAllGames({ includeInactive = false } = {}) {
    const games = this._read();
    if (includeInactive) return games;
    return games.filter(g => g.isActive !== false);
  }

  getGameById(id) {
    const games = this._read();
    return games.find(g => g.id === id) || null;
  }

  getActiveGameIds() {
    return this.getAllGames().map(g => g.id);
  }

  addGame(gameData) {
    const games = [...this._read()];
    let slug = gameData.id ? String(gameData.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : '';
    if (!slug) {
      slug = String(gameData.name || 'new-game')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    let uniqueId = slug;
    let counter = 1;
    while (games.some(g => g.id === uniqueId)) {
      uniqueId = `${slug}-${counter}`;
      counter++;
    }

    const newGame = {
      id: uniqueId,
      name: (gameData.name || 'New Carnival Game').trim(),
      category: (gameData.category || 'Fun & Challenge').trim(),
      participationType: (gameData.participationType || 'Individual').trim(),
      shortDescription: (gameData.shortDescription || gameData.description || 'Carnival activity').trim(),
      description: (gameData.description || gameData.shortDescription || 'Carnival activity').trim(),
      objective: (gameData.objective || 'Complete the event challenge to win prizes.').trim(),
      approvalStatus: gameData.approvalStatus || 'Approved & Active',
      registrationFee: 'Included with All-Access Pass',
      feeAmount: 0,
      suggestedTeamSize: gameData.suggestedTeamSize || 'Individual',
      suggestedDuration: gameData.suggestedDuration || '5 to 10 minutes',
      procedure: Array.isArray(gameData.procedure) ? gameData.procedure : (
        typeof gameData.procedure === 'string' ? gameData.procedure.split('\n').filter(Boolean) : []
      ),
      proposedRules: Array.isArray(gameData.proposedRules) ? gameData.proposedRules : (
        typeof gameData.proposedRules === 'string' ? gameData.proposedRules.split('\n').filter(Boolean) : []
      ),
      materials: gameData.materials || 'Event materials provided at the venue.',
      winningCriteria: gameData.winningCriteria || 'Highest score or fastest completion.',
      safetyNotes: Array.isArray(gameData.safetyNotes) ? gameData.safetyNotes : (
        typeof gameData.safetyNotes === 'string' ? gameData.safetyNotes.split('\n').filter(Boolean) : []
      ),
      iconName: gameData.iconName || 'Gamepad2',
      isActive: gameData.isActive !== false,
      isLegacy: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    games.push(newGame);
    this._write(games);
    // Background async sync with Supabase
    this._insertGameToSupabase(newGame).catch(err => {
      console.warn('[GamesStore] Async Supabase insert failed:', err.message);
    });
    return newGame;
  }

  async addGameAsync(gameData) {
    const game = this.addGame(gameData);
    await this._insertGameToSupabase(game);
    return game;
  }

  updateGame(id, updateData) {
    const games = [...this._read()];
    const index = games.findIndex(g => g.id === id);
    if (index === -1) return null;

    const existing = games[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };

    if (updateData.feeAmount !== undefined || updateData.fee !== undefined) {
      updated.feeAmount = 0;
      updated.fee = 0;
      updated.registrationFee = 'Included with All-Access Pass';
    }
    if (updateData.participationType) {
      updated.participationType = updateData.participationType.trim();
      updated.suggestedTeamSize = updateData.participationType.trim();
    }
    if (updateData.name) {
      updated.name = updateData.name.trim();
    }
    if (updateData.category) {
      updated.category = updateData.category.trim();
    }
    if (updateData.shortDescription) {
      updated.shortDescription = updateData.shortDescription.trim();
    }
    if (updateData.description) {
      updated.description = updateData.description.trim();
      if (!updated.objective) updated.objective = updateData.description.trim();
    }
    if (updateData.procedure && typeof updateData.procedure === 'string') {
      updated.procedure = updateData.procedure.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (updateData.proposedRules && typeof updateData.proposedRules === 'string') {
      updated.proposedRules = updateData.proposedRules.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (updateData.safetyNotes && typeof updateData.safetyNotes === 'string') {
      updated.safetyNotes = updateData.safetyNotes.split('\n').map(s => s.trim()).filter(Boolean);
    }

    games[index] = updated;
    this._write(games);
    // Background sync with Supabase
    this._insertGameToSupabase(updated).catch(err => {
      console.warn('[GamesStore] Async Supabase update failed:', err.message);
    });
    return updated;
  }

  async updateGameAsync(id, updateData) {
    const updated = this.updateGame(id, updateData);
    if (!updated) return null;
    await this._insertGameToSupabase(updated);
    return updated;
  }

  toggleGameStatus(id) {
    const games = [...this._read()];
    const game = games.find(g => g.id === id);
    if (!game) return null;

    game.isActive = !game.isActive;
    game.updatedAt = new Date().toISOString();
    this._write(games);
    if (supabase) {
      Promise.resolve(supabase.from('games').update({ is_active: game.isActive }).eq('id', id)).catch(err => {
        console.warn('[GamesStore] Async Supabase toggle status failed:', err.message);
      });
    }
    return game;
  }

  async toggleGameStatusAsync(id) {
    const games = [...this._read()];
    const game = games.find(g => g.id === id);
    if (!game) return null;

    game.isActive = !game.isActive;
    game.updatedAt = new Date().toISOString();
    this._write(games);
    if (supabase) {
      try {
        await supabase.from('games').update({ is_active: game.isActive }).eq('id', id);
      } catch (e) {
        console.warn('[GamesStore] Supabase toggle status error:', e.message);
      }
    }
    return game;
  }

  deleteGame(id) {
    const games = [...this._read()];
    const index = games.findIndex(g => g.id === id);
    if (index === -1) return false;

    games.splice(index, 1);
    this._write(games);
    if (supabase) {
      Promise.resolve(supabase.from('games').delete().eq('id', id)).catch(err => {
        console.warn('[GamesStore] Async Supabase delete failed:', err.message);
      });
    }
    return true;
  }

  async deleteGameAsync(id) {
    const games = [...this._read()];
    const index = games.findIndex(g => g.id === id);
    if (index === -1) return false;

    games.splice(index, 1);
    this._write(games);
    if (supabase) {
      try {
        await supabase.from('games').delete().eq('id', id);
      } catch (e) {
        console.warn('[GamesStore] Supabase delete error:', e.message);
      }
    }
    return true;
  }
}

const gamesStore = new GamesStore();
module.exports = gamesStore;

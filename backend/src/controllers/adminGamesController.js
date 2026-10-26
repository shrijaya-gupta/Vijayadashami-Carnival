const gamesStore = require('../services/gamesStore');

/**
 * GET /api/admin/games
 * Retrieves all games with full details for management
 */
async function getAdminGamesList(req, res) {
  try {
    const games = gamesStore.getAllGames({ includeInactive: true });
    return res.status(200).json({
      success: true,
      total: games.length,
      activeCount: games.filter(g => g.isActive !== false).length,
      games
    });
  } catch (err) {
    console.error('Error fetching admin games list:', err);
    return res.status(500).json({ success: false, error: 'Failed to load games list.' });
  }
}

/**
 * POST /api/admin/games
 * Creates a new carnival game
 */
async function createAdminGame(req, res) {
  try {
    const { 
      name, 
      category, 
      participationType, 
      description, 
      shortDescription, 
      feeAmount, 
      proposedRules, 
      procedure, 
      safetyNotes, 
      materials,
      suggestedDuration,
      suggestedTeamSize,
      objective,
      winningCriteria,
      iconName,
      isActive 
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Game title/name is required.' });
    }

    const created = gamesStore.addGame({
      name: name.trim(),
      category: (category && String(category).trim()) || 'Fun & Challenge',
      participationType: (participationType && String(participationType).trim()) || 'Individual',
      description: (description && String(description).trim()) || (shortDescription && String(shortDescription).trim()) || 'Exciting campus activity.',
      shortDescription: (shortDescription && String(shortDescription).trim()) || (description && String(description).trim()) || 'Exciting campus activity.',
      objective: (objective && String(objective).trim()) || (description && String(description).trim()) || 'Complete the challenge to win awards.',
      materials: (materials && String(materials).trim()) || 'Materials provided at arena station.',
      suggestedDuration: (suggestedDuration && String(suggestedDuration).trim()) || '3 to 5 minutes',
      suggestedTeamSize: (suggestedTeamSize && String(suggestedTeamSize).trim()) || (participationType && String(participationType).trim()) || 'Individual',
      winningCriteria: (winningCriteria && String(winningCriteria).trim()) || 'Highest score or completion time.',
      iconName: iconName || 'Gamepad2',
      feeAmount: Number(feeAmount) >= 0 ? Number(feeAmount) : 0,
      registrationFee: 'Included with All-Access Pass',
      proposedRules: proposedRules || [],
      procedure: procedure || [],
      safetyNotes: safetyNotes || [],
      isActive: isActive !== false
    });

    return res.status(201).json({
      success: true,
      message: `Game "${created.name}" created successfully.`,
      game: created
    });
  } catch (err) {
    console.error('Error creating new game:', err);
    return res.status(500).json({ success: false, error: 'Failed to create game.' });
  }
}

/**
 * PUT /api/admin/games/:id
 * Updates an existing carnival game
 */
async function updateAdminGame(req, res) {
  try {
    const gameId = req.params.id;
    const existing = gamesStore.getGameById(gameId);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Game with ID '${gameId}' not found.` });
    }

    const updated = gamesStore.updateGame(gameId, req.body);
    return res.status(200).json({
      success: true,
      message: `Game "${updated.name}" updated successfully.`,
      game: updated
    });
  } catch (err) {
    console.error('Error updating game:', err);
    return res.status(500).json({ success: false, error: 'Failed to update game.' });
  }
}

/**
 * PATCH /api/admin/games/:id/toggle
 * Toggles active status of a game
 */
async function toggleAdminGameStatus(req, res) {
  try {
    const gameId = req.params.id;
    const toggled = gamesStore.toggleGameStatus(gameId);
    if (!toggled) {
      return res.status(404).json({ success: false, error: `Game with ID '${gameId}' not found.` });
    }

    return res.status(200).json({
      success: true,
      message: `Game "${toggled.name}" is now ${toggled.isActive ? 'Active' : 'Hidden / Inactive'}.`,
      isActive: toggled.isActive,
      game: toggled
    });
  } catch (err) {
    console.error('Error toggling game status:', err);
    return res.status(500).json({ success: false, error: 'Failed to toggle game status.' });
  }
}

/**
 * DELETE /api/admin/games/:id
 * Deletes a carnival game
 */
async function deleteAdminGame(req, res) {
  try {
    const gameId = req.params.id;
    const existing = gamesStore.getGameById(gameId);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Game with ID '${gameId}' not found.` });
    }

    const deleted = gamesStore.deleteGame(gameId);
    if (!deleted) {
      return res.status(500).json({ success: false, error: 'Failed to delete game.' });
    }

    return res.status(200).json({
      success: true,
      message: `Game "${existing.name}" removed from catalogue.`
    });
  } catch (err) {
    console.error('Error deleting game:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete game.' });
  }
}

module.exports = {
  getAdminGamesList,
  createAdminGame,
  updateAdminGame,
  toggleAdminGameStatus,
  deleteAdminGame
};

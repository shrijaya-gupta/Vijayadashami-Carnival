const express = require('express');
const { GAMES_CATALOGUE } = require('../config/gamesCatalogue');

const router = express.Router();

const gamesStore = require('../services/gamesStore');

/**
 * GET /api/games
 * Returns active games from the authoritative catalogue or dynamic store
 */
router.get('/', (req, res) => {
  const includeInactive = req.query.all === 'true';
  const games = gamesStore.getAllGames({ includeInactive });
  res.status(200).json({
    success: true,
    total: games.length,
    eventName: 'Vijayadashami Carnival',
    date: 'Thursday, 29 October 2026',
    time: '11:00 AM',
    venue: 'SRMU Campus, B5-408',
    games: games
  });
});

module.exports = router;

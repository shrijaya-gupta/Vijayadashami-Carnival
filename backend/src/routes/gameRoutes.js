const express = require('express');
const { GAMES_CATALOGUE } = require('../config/gamesCatalogue');

const router = express.Router();

/**
 * GET /api/games
 * Returns the six games from the authoritative catalogue
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    total: GAMES_CATALOGUE.length,
    eventName: 'Vijayadashami Carnival',
    date: 'Thursday, 29 October 2026',
    time: '11:00 AM',
    venue: 'SRMU Campus, B5-408',
    games: GAMES_CATALOGUE
  });
});

module.exports = router;

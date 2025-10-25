const express = require('express');
const { param, query, validationResult } = require('express-validator');
const Score = require('../models/Score');

const router = express.Router();

router.get(
  '/:gameId',
  [
    param('gameId').trim().isString(),
    query('page').optional().toInt().isInt({ min: 1 }),
    query('limit').optional().toInt().isInt({ min: 1, max: 50 }),
    query('sort').optional().isIn(['asc', 'desc'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    try {
      const scores = await Score.find({ gameId })
        .sort({ score: sortDirection, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'username profilePicture');

      const total = await Score.countDocuments({ gameId });
      const results = scores.map((entry) => ({
        id: entry._id,
        score: entry.score,
        createdAt: entry.createdAt,
        user: entry.user
      }));

      return res.json({
        results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit))
        }
      });
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

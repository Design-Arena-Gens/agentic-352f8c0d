const express = require('express');
const { body, validationResult, param } = require('express-validator');
const auth = require('../middleware/auth');
const Score = require('../models/Score');
const User = require('../models/User');
const streams = require('../utils/streamManager');

const router = express.Router();

router.post(
  '/:gameId',
  auth,
  [
    param('gameId').trim().isString().isLength({ min: 1, max: 32 }),
    body('score').isInt({ min: 0 }).withMessage('Score must be a positive integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId } = req.params;
    const { score } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const scoreEntry = new Score({ user: user._id, gameId, score });
      await scoreEntry.save();

      user.updateBestScore(gameId, score);
      await user.save();

      streams.broadcast(gameId, {
        gameId,
        score,
        user: {
          id: user._id,
          username: user.username,
          profilePicture: user.profilePicture
        }
      });

      return res.status(201).json({ message: 'Score recorded' });
    } catch (error) {
      console.error('Score submission error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

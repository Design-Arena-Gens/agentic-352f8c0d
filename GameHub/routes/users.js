const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put(
  '/profile',
  auth,
  upload.single('profilePicture'),
  [body('username').optional().trim().isLength({ min: 3, max: 32 }).withMessage('Username must be between 3 and 32 characters')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.body.username) {
        user.username = req.body.username;
      }

      if (req.file) {
        const { mimetype, buffer } = req.file;
        if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mimetype)) {
          return res.status(400).json({ message: 'Invalid image format' });
        }
        user.profilePicture = {
          data: buffer.toString('base64'),
          contentType: mimetype
        };
      }

      await user.save();
      const safeUser = user.toObject();
      delete safeUser.passwordHash;
      return res.json(safeUser);
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/password',
  auth,
  [
    body('currentPassword').isLength({ min: 6 }).withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      return res.json({ message: 'Password updated' });
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

const mongoose = require('mongoose');

const BestScoreSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    profilePicture: {
      data: String,
      contentType: String
    },
    bestScores: {
      type: [BestScoreSchema],
      default: []
    }
  },
  { timestamps: true }
);

UserSchema.methods.updateBestScore = function updateBestScore(gameId, score) {
  const existing = this.bestScores.find((entry) => entry.gameId === gameId);
  if (!existing) {
    this.bestScores.push({ gameId, score });
  } else if (score > existing.score) {
    existing.score = score;
  }
};

module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    gameId: {
      type: String,
      required: true,
      index: true
    },
    score: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

ScoreSchema.index({ gameId: 1, score: -1 });

module.exports = mongoose.model('Score', ScoreSchema);

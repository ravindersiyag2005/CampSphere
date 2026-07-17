const mongoose = require('mongoose');

const blockedWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, unique: true, lowercase: true, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockedWord', blockedWordSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, unique: true, trim: true },

    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    reputationScore: { type: Number, default: 50 },
    contributionPoints: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: '' },
    avatarColor: { type: String, default: '#6C5CE7' },
    avatarUrl: { type: String, default: '' },
    lastCheckedPhotoholic: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

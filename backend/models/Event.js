const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    location: { type: String, required: true },
    eventDateTime: { type: Date, required: true },
    category: {
      type: String,
      enum: ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'other'],
      default: 'other',
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index -> MongoDB auto-deletes the document once expiresAt passes
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Event', eventSchema);

const mongoose = require('mongoose');

const travelPostSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['need-companion', 'sharing-ride'], required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    travelMode: {
      type: String,
      enum: ['train', 'bus', 'flight', 'cab', 'shared-auto', 'own-car'],
      required: true,
    },
    travelDateTime: { type: Date, required: true },
    seatsAvailable: { type: Number, default: 0 },
    maxPeople: { type: Number, default: 1 },
    peopleJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    costSharing: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['open', 'full', 'completed'], default: 'open' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

travelPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TravelPost', travelPostSchema);

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    foodSpotId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodSpot', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ foodSpotId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

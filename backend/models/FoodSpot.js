const mongoose = require('mongoose');

const foodSpotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    locationType: { type: String, enum: ['campus-foodcourt', 'city'], required: true },
    location: { type: String, required: true },
    dishName: { type: String, required: true },
    priceRange: { type: String, enum: ['₹', '₹₹', '₹₹₹'], default: '₹' },
    tags: [{ type: String }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodSpot', foodSpotSchema);

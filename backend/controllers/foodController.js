const FoodSpot = require('../models/FoodSpot');
const Review = require('../models/Review');

exports.list = async (req, res) => {
  const { locationType, tag, search } = req.query;
  const filter = {};
  if (locationType) filter.locationType = locationType;
  if (tag) filter.tags = tag;
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { dishName: new RegExp(search, 'i') },
    { location: new RegExp(search, 'i') },
  ];
  const spots = await FoodSpot.find(filter)
    .populate('postedBy', 'name collegeId avatarColor')
    .sort({ avgRating: -1, createdAt: -1 });
  res.json(spots);
};

exports.create = async (req, res) => {
  try {
    const { name, locationType, location, dishName, priceRange, tags, imageUrl } = req.body;
    if (!name || !locationType || !location || !dishName) {
      return res.status(400).json({ message: 'Name, location type, location and dish are required' });
    }
    const spot = await FoodSpot.create({
      name,
      locationType,
      location,
      dishName,
      priceRange,
      imageUrl,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []),
      postedBy: req.user._id,
    });
    const populated = await spot.populate('postedBy', 'name collegeId avatarColor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add food spot', error: err.message });
  }
};

exports.upvote = async (req, res) => {
  const spot = await FoodSpot.findById(req.params.id);
  if (!spot) return res.status(404).json({ message: 'Food spot not found' });
  const idx = spot.upvotes.findIndex((u) => u.toString() === req.user._id.toString());
  if (idx === -1) spot.upvotes.push(req.user._id);
  else spot.upvotes.splice(idx, 1);
  await spot.save();
  res.json({ upvotes: spot.upvotes.length, upvoted: idx === -1 });
};

exports.review = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const spot = await FoodSpot.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: 'Food spot not found' });

    await Review.findOneAndUpdate(
      { foodSpotId: spot._id, userId: req.user._id },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const reviews = await Review.find({ foodSpotId: spot._id });
    spot.ratingCount = reviews.length;
    spot.avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await spot.save();

    res.json({ avgRating: spot.avgRating, ratingCount: spot.ratingCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit review', error: err.message });
  }
};

exports.reviews = async (req, res) => {
  const reviews = await Review.find({ foodSpotId: req.params.id }).populate('userId', 'name avatarColor');
  res.json(reviews);
};

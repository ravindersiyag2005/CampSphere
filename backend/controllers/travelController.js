const TravelPost = require('../models/TravelPost');

exports.list = async (req, res) => {
  const { type, toLocation } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (toLocation) filter.toLocation = new RegExp(toLocation, 'i');
  const posts = await TravelPost.find(filter)
    .populate('postedBy', 'name collegeId avatarColor')
    .populate('peopleJoined', 'name avatarColor')
    .sort({ travelDateTime: 1 });
  res.json(posts);
};

exports.create = async (req, res) => {
  try {
    const {
      type, fromLocation, toLocation, travelMode, travelDateTime,
      seatsAvailable, maxPeople, costSharing, notes,
    } = req.body;
    if (!fromLocation || !toLocation || !travelMode || !travelDateTime) {
      return res.status(400).json({ message: 'From, To, mode and date/time are required' });
    }
    const expiresAt = new Date(new Date(travelDateTime).getTime() + 12 * 60 * 60 * 1000); // +12hrs buffer
    const post = await TravelPost.create({
      postedBy: req.user._id,
      type,
      fromLocation,
      toLocation,
      travelMode,
      travelDateTime,
      seatsAvailable: seatsAvailable || 0,
      maxPeople: maxPeople || 1,
      costSharing,
      notes,
      expiresAt,
    });
    const populated = await post.populate('postedBy', 'name collegeId avatarColor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create travel post', error: err.message });
  }
};

exports.join = async (req, res) => {
  try {
    const post = await TravelPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const already = post.peopleJoined.some((u) => u.toString() === req.user._id.toString());
    if (already) {
      post.peopleJoined = post.peopleJoined.filter((u) => u.toString() !== req.user._id.toString());
      post.status = 'open';
    } else {
      if (post.maxPeople && post.peopleJoined.length >= post.maxPeople) {
        return res.status(400).json({ message: 'This trip is already full' });
      }
      post.peopleJoined.push(req.user._id);
      if (post.maxPeople && post.peopleJoined.length >= post.maxPeople) post.status = 'full';
    }
    await post.save();
    const populated = await post.populate('peopleJoined', 'name avatarColor');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to join trip', error: err.message });
  }
};

exports.remove = async (req, res) => {
  const post = await TravelPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await post.deleteOne();
  res.json({ message: 'Travel post removed' });
};

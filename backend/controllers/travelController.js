const TravelPost = require('../models/TravelPost');

exports.list = async (req, res) => {
  const { type, toLocation } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (toLocation) filter.toLocation = new RegExp(toLocation, 'i');
  const posts = await TravelPost.find(filter)
    .populate('postedBy', 'name collegeId avatarColor')
    .populate('peopleJoined', 'name avatarColor')
    .populate('requestedUsers', 'name avatarColor')
    .populate('declinedUsers', 'name avatarColor')
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
    
    const userIdStr = req.user._id.toString();
    const alreadyJoined = post.peopleJoined.some(u => u.toString() === userIdStr);
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You are already in this trip' });
    }

    const alreadyRequested = post.requestedUsers.some(u => u.toString() === userIdStr);
    
    if (alreadyRequested) {
      post.requestedUsers = post.requestedUsers.filter(u => u.toString() !== userIdStr);
    } else {
      if (post.maxPeople && post.peopleJoined.length >= post.maxPeople) {
        return res.status(400).json({ message: 'This trip is already full' });
      }
      post.requestedUsers.push(req.user._id);
      if (post.declinedUsers) {
        post.declinedUsers = post.declinedUsers.filter(u => u.toString() !== userIdStr);
      }
    }
    
    await post.save();
    const populated = await TravelPost.findById(post._id)
      .populate('peopleJoined', 'name avatarColor')
      .populate('requestedUsers', 'name avatarColor')
      .populate('declinedUsers', 'name avatarColor');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle join request', error: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const post = await TravelPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (post.maxPeople && post.peopleJoined.length >= post.maxPeople) {
      return res.status(400).json({ message: 'This trip is already full' });
    }

    const userIdStr = req.params.userId;
    post.requestedUsers = post.requestedUsers.filter(u => u.toString() !== userIdStr);
    if (!post.peopleJoined.some(u => u.toString() === userIdStr)) {
      post.peopleJoined.push(userIdStr);
    }
    
    if (post.maxPeople && post.peopleJoined.length >= post.maxPeople) {
      post.status = 'full';
    }
    
    await post.save();
    const populated = await TravelPost.findById(post._id)
      .populate('peopleJoined', 'name avatarColor')
      .populate('requestedUsers', 'name avatarColor')
      .populate('declinedUsers', 'name avatarColor');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to accept request', error: err.message });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const post = await TravelPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const userIdStr = req.params.userId;
    post.requestedUsers = post.requestedUsers.filter(u => u.toString() !== userIdStr);
    
    if (!post.declinedUsers) post.declinedUsers = [];
    if (!post.declinedUsers.some(u => u.toString() === userIdStr)) {
      post.declinedUsers.push(userIdStr);
    }
    
    await post.save();
    const populated = await TravelPost.findById(post._id)
      .populate('peopleJoined', 'name avatarColor')
      .populate('requestedUsers', 'name avatarColor')
      .populate('declinedUsers', 'name avatarColor');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to decline request', error: err.message });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const post = await TravelPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const userIdStr = req.params.userId;
    post.peopleJoined = post.peopleJoined.filter(u => u.toString() !== userIdStr);
    post.status = 'open';
    
    await post.save();
    const populated = await TravelPost.findById(post._id)
      .populate('peopleJoined', 'name avatarColor')
      .populate('requestedUsers', 'name avatarColor')
      .populate('declinedUsers', 'name avatarColor');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove participant', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.postedBy = req.user._id;
    }
    const post = await TravelPost.findOneAndDelete(query);
    if (!post) {
      // It either doesn't exist, or the user doesn't have permission
      return res.status(404).json({ message: 'Post not found or you are not authorized to delete it' });
    }
    res.json({ message: 'Travel post removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove travel post', error: err.message });
  }
};

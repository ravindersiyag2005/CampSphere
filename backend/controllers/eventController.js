const Event = require('../models/Event');

exports.list = async (req, res) => {
  const { category } = req.query;
  const filter = {};
  if (category) filter.category = category;
  const events = await Event.find(filter)
    .populate('organizer', 'name collegeId avatarColor')
    .sort({ eventDateTime: 1 });
  res.json(events);
};

exports.create = async (req, res) => {
  try {
    const { title, description, location, eventDateTime, category } = req.body;
    if (!title || !location || !eventDateTime) {
      return res.status(400).json({ message: 'Title, location and date/time are required' });
    }
    const expiresAt = new Date(new Date(eventDateTime).getTime() + 6 * 60 * 60 * 1000); // +6hrs buffer
    const event = await Event.create({
      title,
      description,
      location,
      eventDateTime,
      category,
      organizer: req.user._id,
      expiresAt,
    });
    const populated = await event.populate('organizer', 'name collegeId avatarColor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

exports.toggleInterest = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const idx = event.interestedUsers.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx === -1) event.interestedUsers.push(req.user._id);
    else event.interestedUsers.splice(idx, 1);
    await event.save();
    res.json({ interestedCount: event.interestedUsers.length, interested: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update interest', error: err.message });
  }
};

exports.remove = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await event.deleteOne();
  res.json({ message: 'Event removed' });
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const AVATAR_COLORS = ['#6C5CE7', '#00B8A9', '#FF6B5B', '#FFC857', '#2EC4B6', '#F94892', '#4361EE'];

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  collegeId: user.collegeId,
  email: user.email,
  role: user.role,
  reputationScore: user.reputationScore,
  contributionPoints: user.contributionPoints,
  avatarColor: user.avatarColor,
  avatarUrl: user.avatarUrl,
});

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    let { name, collegeId, email, password } = req.body;
    if (!name || !collegeId || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!email || !email.trim()) {
      email = `${collegeId.toLowerCase().trim()}@campushub.edu`;
    }
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { collegeId }] });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email or college ID already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const user = await User.create({ name, collegeId, email: email.toLowerCase(), password: hashed, avatarColor });
    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginId = (email || '').toLowerCase().trim();
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeLoginId = escapeRegex(loginId);
    
    const user = await User.findOne({
      $or: [
        { email: loginId },
        { collegeId: { $regex: new RegExp('^' + safeLoginId + '$', 'i') } }
      ]
    });
    
    if (!user) {
      // Dummy compare to prevent timing attacks
      await bcrypt.compare(password || '', '$2a$10$dummyDummyDummyDummyDummyDummyDummyDummyDummyDummyD');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by an admin.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken(user._id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatarColor } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (avatarColor) user.avatarColor = avatarColor;

    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// @route PUT /api/auth/password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update password', error: err.message });
  }
};

// @route POST /api/auth/avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update avatar', error: err.message });
  }
};

// @route GET /api/auth/search
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    
    // Search by collegeId
    const users = await User.find({
      collegeId: { $regex: query, $options: 'i' },
      _id: { $ne: req.user._id } // exclude self
    })
    .select('name collegeId avatarColor')
    .limit(5);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

// @route GET /api/auth/unread-photoholic
exports.checkUnreadPhotoholic = async (req, res) => {
  try {
    const Post = require('../models/Post');
    const user = await User.findById(req.user._id);
    const count = await Post.countDocuments({
      isPrivate: true,
      sharedWith: user.collegeId,
      createdAt: { $gt: user.lastCheckedPhotoholic }
    });
    res.json({ hasUnread: count > 0 });
  } catch (err) {
    res.status(500).json({ message: 'Check unread failed', error: err.message });
  }
};

// @route POST /api/auth/mark-photoholic-seen
exports.markPhotoholicSeen = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastCheckedPhotoholic: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Mark seen failed', error: err.message });
  }
};

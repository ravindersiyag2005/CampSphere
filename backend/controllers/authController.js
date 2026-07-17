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
});

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, collegeId, email, password } = req.body;
    if (!name || !collegeId || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
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
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
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

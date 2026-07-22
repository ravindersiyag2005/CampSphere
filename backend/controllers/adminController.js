const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const Conversation = require('../models/Conversation');
const BlockedWord = require('../models/BlockedWord');
const Report = require('../models/Report');

// @route GET /api/admin/stats
exports.stats = async (req, res) => {
  const [totalUsers, blockedUsers, totalRooms, openReports, totalMessages] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ isBlocked: true }),
    ChatRoom.countDocuments(),
    Report.countDocuments({ status: 'open' }),
    Message.countDocuments(),
  ]);
  res.json({ totalUsers, blockedUsers, totalRooms, openReports, totalMessages });
};

// @route GET /api/admin/users
exports.listUsers = async (req, res) => {
  const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
  res.json(users);
};

// @route PATCH /api/admin/users/:id/block  { blocked: true/false, reason }
exports.setBlocked = async (req, res) => {
  const { blocked, reason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: !!blocked, blockedReason: blocked ? (reason || 'Violation of community guidelines') : '' },
    { new: true }
  ).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// @route GET /api/admin/chat/rooms/:roomId/messages
// Admin sees REAL identity behind every message (alias-masking bypass for admins)
exports.roomMessagesWithIdentity = async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId })
    .populate('senderId', 'name collegeId')
    .sort({ createdAt: 1 })
    .limit(500);
  res.json(messages);
};

// @route GET /api/admin/chat/conversations
exports.allConversations = async (req, res) => {
  const convos = await Conversation.find()
    .populate('participants', 'name collegeId')
    .sort({ lastMessageAt: -1 });
  res.json(convos);
};

// @route GET /api/admin/chat/conversations/:id/messages
exports.conversationMessagesWithIdentity = async (req, res) => {
  const messages = await Message.find({ conversationId: req.params.id })
    .populate('senderId', 'name collegeId')
    .sort({ createdAt: 1 });
  res.json(messages);
};

// @route GET /api/admin/reports
exports.listReports = async (req, res) => {
  const reports = await Report.find()
    .populate('reportedUser', 'name collegeId')
    .populate('reportedBy', 'name collegeId')
    .populate('messageId')
    .sort({ createdAt: -1 });
  res.json(reports);
};

// @route PATCH /api/admin/reports/:id  { status }
exports.updateReport = async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
};

// @route PATCH /api/admin/messages/:id/hide  { hidden }
exports.setMessageHidden = async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { hidden: !!req.body.hidden, hiddenReason: req.body.hidden ? 'Hidden by admin' : '' },
    { new: true }
  );
  if (!message) return res.status(404).json({ message: 'Message not found' });
  res.json(message);
};

// @route GET /api/admin/blocked-words
exports.listBlockedWords = async (req, res) => {
  const words = await BlockedWord.find().sort({ word: 1 });
  res.json(words);
};

// @route POST /api/admin/blocked-words { word }
exports.addBlockedWord = async (req, res) => {
  try {
    const word = (req.body.word || '').trim().toLowerCase();
    if (!word) return res.status(400).json({ message: 'Word is required' });
    const created = await BlockedWord.create({ word, addedBy: req.user._id });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Word already blocked' });
    res.status(500).json({ message: 'Failed to add word', error: err.message });
  }
};

// @route DELETE /api/admin/blocked-words/:id
exports.removeBlockedWord = async (req, res) => {
  await BlockedWord.findByIdAndDelete(req.params.id);
  res.json({ message: 'Word removed from blocklist' });
};

// @route DELETE /api/admin/rooms/:id
exports.removeRoom = async (req, res) => {
  await ChatRoom.findByIdAndDelete(req.params.id);
  await Message.deleteMany({ roomId: req.params.id });
  res.json({ message: 'Room removed' });
};

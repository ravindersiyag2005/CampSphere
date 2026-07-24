const ChatRoom = require('../models/ChatRoom');
const RoomAlias = require('../models/RoomAlias');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Report = require('../models/Report');
const { generateAlias } = require('../utils/aliasGenerator');

const AVATAR_COLORS = ['#6C5CE7', '#00B8A9', '#FF6B5B', '#FFC857', '#2EC4B6', '#F94892', '#4361EE'];

async function getOrCreateAlias(userId, roomId) {
  let alias = await RoomAlias.findOne({ userId, roomId });
  if (alias) return alias;

  const user = await User.findById(userId);
  const aliasName = generateAlias();
  const avatarColor = (user && user.avatarColor) ? user.avatarColor : AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  alias = await RoomAlias.findOneAndUpdate(
    { userId, roomId },
    { $setOnInsert: {
        userId,
        roomId,
        alias: aliasName,
        avatarColor,
    }},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return alias;
}

// @route GET /api/chat/rooms
exports.listRooms = async (req, res) => {
  const rooms = await ChatRoom.find().sort({ createdAt: -1 });
  res.json(rooms);
};

// @route GET /api/chat/rooms/:roomId
exports.getRoom = async (req, res) => {
  const room = await ChatRoom.findById(req.params.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
};

// @route POST /api/chat/rooms
exports.createRoom = async (req, res) => {
  const { name, subject, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Room name is required' });
  const room = await ChatRoom.create({ name, subject, description, createdBy: req.user._id });
  res.status(201).json(room);
};

// @route GET /api/chat/rooms/:roomId/alias
exports.getMyAlias = async (req, res) => {
  const alias = await getOrCreateAlias(req.user._id, req.params.roomId);
  res.json({ alias: alias.alias, avatarColor: alias.avatarColor });
};

// @route GET /api/chat/rooms/:roomId/messages
exports.getRoomMessages = async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId, hidden: false })
    .sort({ createdAt: 1 })
    .limit(200);
  // strip senderId before sending to students (frontend also hides it, this is belt-and-suspenders)
  const safe = messages.map((m) => ({
    _id: m._id,
    senderAlias: m.senderAlias,
    text: m.text,
    createdAt: m.createdAt,
    mine: m.senderId.toString() === req.user._id.toString(),
  }));
  res.json(safe);
};

// @route POST /api/chat/rooms/:roomId/dm  { targetAlias }
// Resolve alias -> real user server-side, start/find an anonymous 1:1 conversation
exports.startDMFromAlias = async (req, res) => {
  try {
    const { targetAlias } = req.body;
    const roomId = req.params.roomId;
    const targetAliasDoc = await RoomAlias.findOne({ roomId, alias: targetAlias });
    if (!targetAliasDoc) return res.status(404).json({ message: 'That user could not be found in this room' });
    if (targetAliasDoc.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't message yourself" });
    }

    let convo = await Conversation.findOne({
      originRoomId: roomId,
      participants: { $all: [req.user._id, targetAliasDoc.userId], $size: 2 },
    });

    if (!convo) {
      const myAlias = await getOrCreateAlias(req.user._id, roomId);
      convo = await Conversation.create({
        participants: [req.user._id, targetAliasDoc.userId],
        originRoomId: roomId,
        aliases: [
          { userId: req.user._id, alias: myAlias.alias },
          { userId: targetAliasDoc.userId, alias: targetAliasDoc.alias },
        ],
      });
    }
    res.status(201).json({ conversationId: convo._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start conversation', error: err.message });
  }
};

// @route GET /api/chat/conversations
exports.listMyConversations = async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 });
  const shaped = convos.map((c) => {
    const mine = c.aliases.find((a) => a.userId.toString() === req.user._id.toString());
    const other = c.aliases.find((a) => a.userId.toString() !== req.user._id.toString());
    return {
      _id: c._id,
      myAlias: mine ? mine.alias : 'You',
      otherAlias: other ? other.alias : 'Anonymous',
      lastMessageAt: c.lastMessageAt,
      hasUnread: c.unreadBy.includes(req.user._id),
    };
  });
  res.json(shaped);
};

// @route GET /api/chat/conversations/:id/messages
exports.getConversationMessages = async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: 'Not part of this conversation' });
  }
  
  if (convo.unreadBy.includes(req.user._id)) {
    convo.unreadBy = convo.unreadBy.filter(id => id.toString() !== req.user._id.toString());
    await convo.save();
  }

  const messages = await Message.find({ conversationId: req.params.id, hidden: false }).sort({ createdAt: 1 });
  const safe = messages.map((m) => ({
    _id: m._id,
    senderAlias: m.senderAlias,
    text: m.text,
    createdAt: m.createdAt,
    mine: m.senderId.toString() === req.user._id.toString(),
  }));
  res.json(safe);
};

// @route POST /api/chat/messages/:id/report
exports.reportMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    const already = message.reportedBy.some((u) => u.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'You already reported this message' });

    message.reportedBy.push(req.user._id);
    message.reportCount += 1;

    await Report.create({
      messageId: message._id,
      reportedUser: message.senderId,
      reportedBy: req.user._id,
      reason: req.body.reason || 'inappropriate',
    });

    if (message.reportCount >= 3) {
      message.hidden = true;
      message.hiddenReason = 'Auto-hidden after 3 reports, pending admin review';
    }
    await message.save();
    res.json({ message: 'Message reported', hidden: message.hidden });
  } catch (err) {
    res.status(500).json({ message: 'Failed to report message', error: err.message });
  }
};

// @route GET /api/chat/unread-dms
exports.checkUnreadDMs = async (req, res) => {
  try {
    const unreadCount = await Conversation.countDocuments({
      participants: req.user._id,
      unreadBy: req.user._id
    });
    res.json({ hasUnread: unreadCount > 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check unread', error: err.message });
  }
};

// @route POST /api/chat/upload
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = req.file.path;
    const type = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    res.json({
      fileUrl,
      fileType: type,
      fileName: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// @route GET /api/chat/aliases
exports.listUserAliases = async (req, res) => {
  try {
    const aliases = await RoomAlias.find({ userId: req.user._id })
      .populate('roomId', 'name')
      .sort({ createdAt: -1 });
    res.json(aliases);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve room aliases', error: err.message });
  }
};

// @route PUT /api/chat/rooms/:roomId/alias
exports.updateRoomAlias = async (req, res) => {
  try {
    const { alias } = req.body;
    const { roomId } = req.params;
    if (!alias || !alias.trim()) {
      return res.status(400).json({ message: 'Alias cannot be empty' });
    }

    // Verify alias uniqueness inside this room:
    const conflict = await RoomAlias.findOne({
      roomId,
      userId: { $ne: req.user._id },
      alias: { $regex: new RegExp('^' + alias.trim() + '$', 'i') }
    });
    if (conflict) {
      return res.status(409).json({ message: 'This alias is already taken by another student in this room.' });
    }

    const doc = await RoomAlias.findOneAndUpdate(
      { userId: req.user._id, roomId },
      { alias: alias.trim() },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update room alias', error: err.message });
  }
};

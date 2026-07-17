const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RoomAlias = require('../models/RoomAlias');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const BlockedWord = require('../models/BlockedWord');
const { generateAlias } = require('../utils/aliasGenerator');
const { containsBlockedWord } = require('../utils/wordFilter');

const AVATAR_COLORS = ['#6C5CE7', '#00B8A9', '#FF6B5B', '#FFC857', '#2EC4B6', '#F94892', '#4361EE'];

// simple in-memory rate limiter: max 8 messages / 10s per user
const rateMap = new Map();
function isRateLimited(userId) {
  const now = Date.now();
  const windowMs = 10000;
  const max = 8;
  const arr = (rateMap.get(userId) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  rateMap.set(userId, arr);
  return arr.length > max;
}

async function getOrCreateAlias(userId, roomId) {
  const alias = await RoomAlias.findOneAndUpdate(
    { userId, roomId },
    { $setOnInsert: {
        userId,
        roomId,
        alias: generateAlias(),
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    }},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return alias;
}

function initChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      if (user.isBlocked) return next(new Error('Account blocked'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    // join a personal room so admin / DMs can target this exact user
    socket.join(`user:${socket.user._id}`);

    socket.on('joinRoom', async ({ roomId }) => {
      try {
        socket.join(`room:${roomId}`);
        const alias = await getOrCreateAlias(socket.user._id, roomId);
        socket.emit('yourAlias', { alias: alias.alias, avatarColor: alias.avatarColor });
      } catch (err) {
        socket.emit('errorMessage', { message: 'Could not join room' });
      }
    });

    socket.on('sendMessage', async ({ roomId, text }) => {
      try {
        if (!text || !text.trim()) return;
        if (isRateLimited(socket.user._id.toString())) {
          return socket.emit('errorMessage', { message: 'You are sending messages too fast. Slow down.' });
        }
        const blockedWords = (await BlockedWord.find()).map((w) => w.word);
        const check = containsBlockedWord(text, blockedWords);
        if (check.blocked) {
          return socket.emit('errorMessage', { message: 'Your message contains a blocked word and was not sent.' });
        }
        const alias = await getOrCreateAlias(socket.user._id, roomId);
        const message = await Message.create({
          roomId,
          senderId: socket.user._id,
          senderAlias: alias.alias,
          text: text.trim(),
        });
        io.to(`room:${roomId}`).emit('newMessage', {
          _id: message._id,
          roomId,
          senderAlias: alias.alias,
          avatarColor: alias.avatarColor,
          text: message.text,
          createdAt: message.createdAt,
        });
        // also broadcast full detail (with real identity) to admins watching the monitor
        io.to('admins').emit('adminNewMessage', {
          _id: message._id,
          roomId,
          senderAlias: alias.alias,
          senderRealName: socket.user.name,
          senderCollegeId: socket.user.collegeId,
          senderId: socket.user._id,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('errorMessage', { message: 'Failed to send message' });
      }
    });

    socket.on('joinConversation', ({ conversationId }) => {
      socket.join(`convo:${conversationId}`);
    });

    socket.on('sendDM', async ({ conversationId, text, clientId }) => {
      try {
        if (!text || !text.trim()) return;
        if (isRateLimited(socket.user._id.toString())) {
          return socket.emit('errorMessage', { message: 'You are sending messages too fast. Slow down.' });
        }
        const blockedWords = (await BlockedWord.find()).map((w) => w.word);
        const check = containsBlockedWord(text, blockedWords);
        if (check.blocked) {
          return socket.emit('errorMessage', { message: 'Your message contains a blocked word and was not sent.' });
        }
        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.participants.some((p) => p.toString() === socket.user._id.toString())) {
          return socket.emit('errorMessage', { message: 'Not part of this conversation' });
        }
        const mine = convo.aliases.find((a) => a.userId.toString() === socket.user._id.toString());
        const message = await Message.create({
          conversationId,
          senderId: socket.user._id,
          senderAlias: mine ? mine.alias : 'Anonymous',
          text: text.trim(),
        });
        const otherParticipant = convo.participants.find((p) => p.toString() !== socket.user._id.toString());
        if (otherParticipant && !convo.unreadBy.includes(otherParticipant)) {
          convo.unreadBy.push(otherParticipant);
        }
        convo.lastMessageAt = new Date();
        await convo.save();

        io.to(`convo:${conversationId}`).emit('newDM', {
          _id: message._id,
          conversationId,
          senderAlias: message.senderAlias,
          text: message.text,
          createdAt: message.createdAt,
          clientId,
        });
        if (otherParticipant) {
          io.to(`user:${otherParticipant}`).emit('dmNotification', { conversationId });
        }
        io.to('admins').emit('adminNewMessage', {
          _id: message._id,
          conversationId,
          senderAlias: message.senderAlias,
          senderRealName: socket.user.name,
          senderCollegeId: socket.user.collegeId,
          senderId: socket.user._id,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('errorMessage', { message: 'Failed to send message' });
      }
    });

    // admins join a dedicated room to receive full-visibility broadcasts
    socket.on('adminSubscribe', () => {
      if (socket.user.role === 'admin') socket.join('admins');
    });

    socket.on('disconnect', () => {
      rateMap.delete(socket.user._id.toString());
    });
  });
}

module.exports = initChatSocket;

const mongoose = require('mongoose');

// Anonymous 1:1 DM thread, usually started from a group message ("Message privately")
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    originRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
    // per-participant alias just for this conversation
    aliases: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        alias: String,
      },
    ],
    lastMessageAt: { type: Date, default: Date.now },
    unreadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);

const mongoose = require('mongoose');

// Per-user-per-room anonymous identity. Consistent within a room,
// different across rooms, so other students can't correlate identity.
const roomAliasSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    alias: { type: String, required: true },
    avatarColor: { type: String, default: '#6C5CE7' },
  },
  { timestamps: true }
);

roomAliasSchema.index({ userId: 1, roomId: 1 }, { unique: true });

module.exports = mongoose.model('RoomAlias', roomAliasSchema);

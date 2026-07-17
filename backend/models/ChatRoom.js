const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, default: 'General' },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', default: null },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // real id, never sent to other students
    senderAlias: { type: String, required: true }, // what other students see
    text: { type: String, default: '' },
    attachmentUrl: { type: String, default: null },
    attachmentType: { type: String, enum: ['image', 'pdf', 'none'], default: 'none' },
    fileName: { type: String, default: '' },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportCount: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    hiddenReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);

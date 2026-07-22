const mongoose = require('mongoose');

// Shared schema for Notes AND PYQ (differentiated by `type`)
const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: String, required: true },
    type: { type: String, enum: ['notes', 'pyq'], required: true },
    examType: { type: String, enum: ['mid-sem', 'end-sem', 'quiz', 'other'], default: undefined },
    year: { type: Number },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    downloadCount: { type: Number, default: 0 },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String }],
    isPrivate: { type: Boolean, default: false },
    sharedWith: [{ type: String }],
  },
  { timestamps: true }
);

resourceSchema.index({ subject: 'text', title: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);

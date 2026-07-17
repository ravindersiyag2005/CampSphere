const Resource = require('../models/Resource');
const User = require('../models/User');
const path = require('path');

// @route GET /api/resources?type=notes|pyq&subject=&semester=&search=
exports.list = async (req, res) => {
  try {
    const { type, subject, semester, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (semester) filter.semester = semester;
    if (search) filter.$text = { $search: search };

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name collegeId avatarColor')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resources', error: err.message });
  }
};

// @route GET /api/resources/subjects
exports.subjects = async (req, res) => {
  const subjects = await Resource.distinct('subject');
  res.json(subjects);
};

// @route POST /api/resources (multipart form: file + fields)
exports.create = async (req, res) => {
  try {
    const { title, subject, semester, type, examType, year, tags } = req.body;
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const resource = await Resource.create({
      title,
      subject,
      semester,
      type,
      examType: type === 'pyq' ? examType : undefined,
      year: type === 'pyq' && year ? Number(year) : undefined,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
    await User.findByIdAndUpdate(req.user._id, { $inc: { contributionPoints: 5 } });
    const populated = await resource.populate('uploadedBy', 'name collegeId avatarColor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// @route POST /api/resources/:id/upvote
exports.upvote = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    const idx = resource.upvotes.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx === -1) resource.upvotes.push(req.user._id);
    else resource.upvotes.splice(idx, 1);
    await resource.save();
    res.json({ upvotes: resource.upvotes.length, upvoted: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upvote', error: err.message });
  }
};

// @route GET /api/resources/:id/download
exports.download = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    resource.downloadCount += 1;
    await resource.save();
    const filePath = path.join(__dirname, '..', resource.fileUrl);
    res.download(filePath, resource.fileName || 'file');
  } catch (err) {
    res.status(500).json({ message: 'Download failed', error: err.message });
  }
};

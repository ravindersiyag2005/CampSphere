const Resource = require('../models/Resource');
const User = require('../models/User');
const path = require('path');

// @route GET /api/resources?type=notes|pyq&subject=&semester=&search=
exports.list = async (req, res) => {
  try {
    const { type, subject, semester, search, myPrivate } = req.query;
    let query = {};
    if (type) query.type = type;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (semester) query.semester = semester;
    if (search) query.$text = { $search: search };

    if (myPrivate === 'true') {
      query.isPrivate = true;
      query.uploadedBy = req.user._id;
    } else if (type === 'notes') {
      if (req.user.role !== 'admin') {
        query.$or = [
          { isPrivate: { $ne: true } },
          { uploadedBy: req.user._id },
          { sharedWith: req.user.collegeId }
        ];
      }
    } else if (type === 'pyq') {
      query.isPrivate = { $ne: true };
    }

    const resources = await Resource.find(query)
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
    const parsedTags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    
    let fileUrl = req.file.path;
    if (!fileUrl.startsWith('http')) {
      fileUrl = '/uploads/' + req.file.filename;
    }

    const resource = await Resource.create({
      title,
      subject,
      semester,
      type,
      examType: type === 'pyq' ? examType : undefined,
      year: type === 'pyq' && year ? Number(year) : undefined,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      tags: parsedTags,
      isPrivate: type === 'notes' ? (req.body.isPrivate === 'true' || req.body.isPrivate === true) : false,
      sharedWith: type === 'notes' && req.body.sharedWith ? req.body.sharedWith.split(',').map(id => id.trim()).filter(Boolean) : []
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
    const resource = await Resource.findById(req.params.id).populate('uploadedBy');
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    
    if (resource.isPrivate && req.user.role !== 'admin' && resource.uploadedBy._id.toString() !== req.user._id.toString() && !resource.sharedWith.includes(req.user.collegeId)) {
      return res.status(403).json({ message: 'Unauthorized to download this private resource' });
    }

    resource.downloadCount += 1;
    await resource.save();
    res.redirect(resource.fileUrl);
  } catch (err) {
    res.status(500).json({ message: 'Download failed', error: err.message });
  }
};

// @route PUT /api/resources/:id
exports.update = async (req, res) => {
  try {
    const { title, subject, semester, type, examType, year, tags, isPrivate, sharedWith } = req.body;
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user._id;
    }
    
    const resource = await Resource.findOne(query);
    if (!resource) return res.status(404).json({ message: 'Resource not found or unauthorized' });

    if (title) resource.title = title;
    if (subject) resource.subject = subject;
    if (semester) resource.semester = semester;
    if (type) resource.type = type;
    if (type === 'pyq' && examType) resource.examType = examType;
    if (type === 'pyq' && year) resource.year = Number(year);
    if (tags !== undefined) {
      resource.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }
    if (isPrivate !== undefined && resource.type === 'notes') {
      resource.isPrivate = (isPrivate === 'true' || isPrivate === true);
    }
    if (sharedWith !== undefined && resource.type === 'notes') {
      resource.sharedWith = Array.isArray(sharedWith) ? sharedWith : (sharedWith ? sharedWith.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    await resource.save();
    const populated = await resource.populate('uploadedBy', 'name collegeId avatarColor');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// @route DELETE /api/resources/:id
exports.remove = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user._id;
    }
    const resource = await Resource.findOneAndDelete(query);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found or unauthorized to delete it' });
    }
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
};

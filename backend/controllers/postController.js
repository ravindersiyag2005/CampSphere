const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { caption, isPrivate, sharedWith } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Photo is required' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const post = await Post.create({
      imageUrl,
      caption,
      uploadedBy: req.user._id,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      sharedWith: sharedWith ? sharedWith.split(',').map(id => id.trim()).filter(Boolean) : []
    });
    const populated = await Post.findById(post._id).populate('uploadedBy', 'name avatarColor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
};

exports.listPosts = async (req, res) => {
  try {
    let query = {};
    const { myPrivate } = req.query;

    if (myPrivate === 'true') {
      query.isPrivate = true;
      if (req.user.role !== 'admin') {
        query.$or = [
          { sharedWith: req.user.collegeId },
          { uploadedBy: req.user._id }
        ];
      }
    } else {
      query.isPrivate = { $ne: true };
    }

    const posts = await Post.find(query)
      .populate('uploadedBy', 'name avatarColor')
      .populate('comments.commentedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve posts', error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const userIdStr = req.user._id.toString();
    const index = post.likes.findIndex(id => id.toString() === userIdStr);
    
    if (index === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes = post.likes.filter(id => id.toString() !== userIdStr);
    }
    
    await post.save();
    res.json({ likesCount: post.likes.length, liked: index === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle like', error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const newComment = {
      text: text.trim(),
      commentedBy: req.user._id,
    };
    post.comments.push(newComment);
    await post.save();
    
    const populatedPost = await Post.findById(post._id).populate('comments.commentedBy', 'name');
    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    res.status(201).json(addedComment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user._id;
    }
    const post = await Post.findOneAndDelete(query);
    if (!post) {
      return res.status(404).json({ message: 'Post not found or you are not authorized to delete it' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post', error: err.message });
  }
};

const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/postController');

router.use(protect);

router.get('/', ctrl.listPosts);
router.post('/', upload.single('photo'), ctrl.createPost);
router.put('/:id/like', ctrl.toggleLike);
router.post('/:id/comments', ctrl.addComment);
router.delete('/:id', ctrl.deletePost);

module.exports = router;

const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/resourceController');

router.get('/subjects', protect, ctrl.subjects);
router.get('/', protect, ctrl.list);
router.post('/', protect, upload.single('file'), ctrl.create);
router.post('/:id/upvote', protect, ctrl.upvote);
router.get('/:id/download', protect, ctrl.download);

module.exports = router;

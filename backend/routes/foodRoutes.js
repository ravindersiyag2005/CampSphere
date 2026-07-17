const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/foodController');

router.get('/', protect, ctrl.list);
router.post('/', protect, ctrl.create);
router.post('/:id/upvote', protect, ctrl.upvote);
router.post('/:id/review', protect, ctrl.review);
router.get('/:id/reviews', protect, ctrl.reviews);

module.exports = router;

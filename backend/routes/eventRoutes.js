const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/eventController');

router.get('/', protect, ctrl.list);
router.post('/', protect, ctrl.create);
router.post('/:id/interest', protect, ctrl.toggleInterest);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;

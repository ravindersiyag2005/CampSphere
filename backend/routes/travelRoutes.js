const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/travelController');

router.get('/', protect, ctrl.list);
router.post('/', protect, ctrl.create);
router.post('/:id/join', protect, ctrl.join);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;

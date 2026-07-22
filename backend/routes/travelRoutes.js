const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/travelController');

router.get('/', protect, ctrl.list);
router.post('/', protect, ctrl.create);
router.post('/:id/join', protect, ctrl.join);
router.post('/:id/accept/:userId', protect, ctrl.acceptRequest);
router.post('/:id/decline/:userId', protect, ctrl.declineRequest);
router.post('/:id/remove-participant/:userId', protect, ctrl.removeParticipant);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;

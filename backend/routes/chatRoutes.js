const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/chatController');

router.get('/rooms', protect, ctrl.listRooms);
router.post('/rooms', protect, ctrl.createRoom);
router.get('/rooms/:roomId', protect, ctrl.getRoom);
router.get('/rooms/:roomId/alias', protect, ctrl.getMyAlias);
router.get('/rooms/:roomId/messages', protect, ctrl.getRoomMessages);
router.post('/rooms/:roomId/dm', protect, ctrl.startDMFromAlias);
router.get('/conversations', protect, ctrl.listMyConversations);
router.get('/unread-dms', protect, ctrl.checkUnreadDMs);
router.get('/conversations/:id/messages', protect, ctrl.getConversationMessages);
router.post('/messages/:id/report', protect, ctrl.reportMessage);

module.exports = router;

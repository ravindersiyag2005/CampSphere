const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
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
router.get('/aliases', protect, ctrl.listUserAliases);
router.put('/rooms/:roomId/alias', protect, ctrl.updateRoomAlias);
router.post('/messages/:id/report', protect, ctrl.reportMessage);
router.post('/upload', protect, upload.single('file'), ctrl.uploadAttachment);

module.exports = router;

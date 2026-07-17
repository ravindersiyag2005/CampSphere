const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/stats', ctrl.stats);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/block', ctrl.setBlocked);

router.get('/chat/rooms/:roomId/messages', ctrl.roomMessagesWithIdentity);
router.get('/chat/conversations', ctrl.allConversations);
router.get('/chat/conversations/:id/messages', ctrl.conversationMessagesWithIdentity);
router.patch('/messages/:id/hide', ctrl.setMessageHidden);
router.delete('/rooms/:id', ctrl.removeRoom);

router.get('/reports', ctrl.listReports);
router.patch('/reports/:id', ctrl.updateReport);

router.get('/blocked-words', ctrl.listBlockedWords);
router.post('/blocked-words', ctrl.addBlockedWord);
router.delete('/blocked-words/:id', ctrl.removeBlockedWord);

module.exports = router;

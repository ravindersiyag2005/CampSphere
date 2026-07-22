const router = require('express').Router();
const { register, login, getMe, updateProfile, updatePassword, updateAvatar, searchUsers, checkUnreadPhotoholic, markPhotoholicSeen } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/avatar', protect, upload.single('avatar'), updateAvatar);
router.get('/search', protect, searchUsers);
router.get('/unread-photoholic', protect, checkUnreadPhotoholic);
router.post('/mark-photoholic-seen', protect, markPhotoholicSeen);

module.exports = router;

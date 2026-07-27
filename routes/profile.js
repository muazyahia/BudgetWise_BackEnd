// مسارات الملف الشخصي

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePreferences,
  updateEmail,
  verifyEmailChange,
  updatePassword,
  uploadAvatar,
  deleteAccount,
  setRole
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// حماية جميع المسارات
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/role', setRole);
router.delete('/', deleteAccount);

router.put('/preferences', updatePreferences);
router.put('/email', updateEmail);
router.post('/verify-email-change', verifyEmailChange);
router.put('/password', updatePassword);

// معالجة رفع الصورة باستخدام multer
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;

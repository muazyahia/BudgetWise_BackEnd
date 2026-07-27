// مسارات المصادقة - تحدد جميع نقاط النهاية لعمليات التسجيل وتسجيل الدخول والتحقق وإعادة تعيين كلمة المرور والمصادقة عبر OAuth

const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  verifyPasswordOTP,
  resetPassword,
  getMe,
  facebookTokenLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const generateToken = require('../utils/generateToken');

// ==========================================
// مسارات المصادقة المحلية
// ==========================================

// مسار تسجيل مستخدم جديد
router.post('/register', register);

// مسار التحقق من رمز OTP
router.post('/verify-otp', verifyOTP);

// مسار إعادة إرسال رمز التحقق
router.post('/resend-otp', resendOTP);

// مسار تسجيل الدخول
router.post('/login', login);

// مسار طلب إعادة تعيين كلمة المرور (نسيان كلمة المرور)
router.post('/forgot-password', forgotPassword);

// مسار إعادة تعيين كلمة المرور بعد التحقق من OTP
router.post('/reset-password', resetPassword);

// مسار التحقق من OTP الخاص بنسيان كلمة المرور فقط (دون إتلافه)
router.post('/verify-password-otp', verifyPasswordOTP);

// مسار الحصول على بيانات المستخدم الحالي (محمي بالمصادقة)
router.get('/me', protect, getMe);

// ==========================================
// مسارات المصادقة عبر جوجل OAuth
// ==========================================

// مسار بدء عملية المصادقة عبر جوجل - يوجه المستخدم إلى صفحة تسجيل الدخول في جوجل
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// مسار إعادة التوجيه بعد المصادقة مع جوجل
// الخطوات:
// 1. استقبال رد جوجل بعد المصادقة
// 2. في حالة الفشل: إعادة التوجيه إلى صفحة تسجيل الدخول مع رسالة خطأ
// 3. في حالة النجاح: توليد رمز JWT وإعادة التوجيه إلى الواجهة الأمامية مع الرمز
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    // توليد رمز JWT وإعادة التوجيه إلى الواجهة الأمامية
    const token = generateToken(req.user._id, req.user.role);
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`
    );
  }
);

// ==========================================
// مسارات المصادقة عبر فيسبوك OAuth
// ==========================================

// مسار بدء عملية المصادقة عبر فيسبوك - يوجه المستخدم إلى صفحة تسجيل الدخول في فيسبوك
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

// مسار إعادة التوجيه بعد المصادقة مع فيسبوك
// الخطوات:
// 1. استقبال رد فيسبوك بعد المصادقة
// 2. في حالة الفشل: إعادة التوجيه مع رسالة خطأ
// 3. في حالة النجاح: توليد رمز JWT وإعادة التوجيه مع الرمز
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=facebook_auth_failed`,
  }),
  (req, res) => {
    // توليد رمز JWT وإعادة التوجيه إلى الواجهة الأمامية
    const token = generateToken(req.user._id, req.user.role);
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`
    );
  }
);

// مسار تسجيل الدخول بفيسبوك عن طريق Access Token (React)
router.post('/facebook/token', facebookTokenLogin);

module.exports = router;

// إعداد Passport - تهيئة استراتيجيات المصادقة عبر جوجل وفيسبوك باستخدام OAuth 2.0

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// ========================================
// تسلسل وفك تسلسل المستخدم للجلسة
// ========================================

// دالة تسلسل المستخدم - تخزين معرف المستخدم في الجلسة
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// دالة فك تسلسل المستخدم - استرجاع بيانات المستخدم من المعرف المخزن
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ========================================
// استراتيجية المصادقة عبر جوجل
// ========================================
// الخطوات:
// 1. إعداد معرف التطبيق والمفتاح السري ورابط إعادة التوجيه من متغيرات البيئة
// 2. عند نجاح المصادقة مع جوجل، استقبال بيانات الملف الشخصي
// 3. البحث عن مستخدم بنفس البريد الإلكتروني في قاعدة البيانات
// 4. إذا وُجد المستخدم: تسجيل الدخول مباشرة وتحديث معرف جوجل إذا لم يكن موجوداً
// 5. إذا لم يُوجد: إنشاء مستخدم جديد مع حالة التحقق true ومزود المصادقة google
// 6. إرجاع المستخدم مع رمز JWT
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // استخراج البريد الإلكتروني من ملف جوجل الشخصي
        const email = profile.emails[0].value.toLowerCase();

        // البحث عن مستخدم بنفس البريد الإلكتروني
        let user = await User.findOne({ email });

        if (user) {
          // المستخدم موجود: تحديث معرف جوجل إذا لم يكن مسجلاً
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
        } else {
          // المستخدم غير موجود: إنشاء حساب جديد
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            avatar: profile.photos[0] ? profile.photos[0].value : '',
            authProvider: 'google',
            isEmailVerified: true,
          });
        }

        // توليد رمز JWT وإرفاقه مع المستخدم
        const token = generateToken(user._id, user.role);
        user._token = token;

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// ========================================
// استراتيجية المصادقة عبر فيسبوك
// ========================================
// الخطوات:
// 1. إعداد معرف التطبيق والمفتاح السري ورابط إعادة التوجيه من متغيرات البيئة
// 2. طلب صلاحيات الوصول إلى البريد الإلكتروني
// 3. عند نجاح المصادقة، استقبال بيانات الملف الشخصي من فيسبوك
// 4. البحث عن مستخدم بنفس البريد الإلكتروني
// 5. إذا وُجد: تسجيل الدخول مباشرة وتحديث معرف فيسبوك
// 6. إذا لم يُوجد: إنشاء مستخدم جديد مع حالة التحقق true ومزود المصادقة facebook
// 7. إرجاع المستخدم مع رمز JWT
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'email', 'photos'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // استخراج البريد الإلكتروني من ملف فيسبوك الشخصي
        const email = profile.emails && profile.emails[0]
          ? profile.emails[0].value.toLowerCase()
          : `${profile.id}@facebook.com`;

        // البحث عن مستخدم بنفس البريد الإلكتروني
        let user = await User.findOne({ email });

        if (user) {
          // المستخدم موجود: تحديث معرف فيسبوك إذا لم يكن مسجلاً
          if (!user.facebookId) {
            user.facebookId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
        } else {
          // المستخدم غير موجود: إنشاء حساب جديد
          user = await User.create({
            name: profile.displayName,
            email,
            facebookId: profile.id,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            authProvider: 'facebook',
            isEmailVerified: true,
          });
        }

        // توليد رمز JWT وإرفاقه مع المستخدم
        const token = generateToken(user._id, user.role);
        user._token = token;

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;

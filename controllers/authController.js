// متحكم المصادقة - يحتوي على جميع دوال التسجيل وتسجيل الدخول والتحقق وإعادة تعيين كلمة المرور

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const axios = require('axios');

// ========================================
// 1. دالة تسجيل مستخدم جديد
// ========================================
// الخطوات:
// 1. استقبال البيانات من جسم الطلب: الاسم، البريد، كلمة المرور، تأكيد كلمة المرور
// 2. التحقق من وجود جميع الحقول المطلوبة
// 3. التحقق من تطابق كلمة المرور مع تأكيدها
// 4. التحقق من أن البريد الإلكتروني غير مسجل مسبقاً
// 5. تشفير كلمة المرور باستخدام bcryptjs مع 12 جولة تشفير
// 6. توليد رمز تحقق OTP وحساب وقت انتهاء صلاحيته
// 7. إنشاء المستخدم الجديد في قاعدة البيانات مع حالة عدم التحقق
// 8. إرسال رمز التحقق عبر البريد الإلكتروني
// 9. إرجاع رسالة نجاح تطلب التحقق من البريد الإلكتروني
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // التحقق من وجود جميع الحقول المطلوبة
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, and password confirmation',
        data: {},
      });
    }

    // التحقق من تطابق كلمة المرور مع تأكيدها
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation do not match',
        data: {},
      });
    }

    // التحقق من طول كلمة المرور (6 أحرف على الأقل)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        data: {},
      });
    }

    // التحقق من أن البريد الإلكتروني غير مسجل مسبقاً
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
        data: {},
      });
    }

    // تشفير كلمة المرور باستخدام bcryptjs مع 12 جولة تشفير
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // توليد رمز تحقق OTP وحساب وقت انتهاء صلاحيته
    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    // إنشاء المستخدم الجديد في قاعدة البيانات
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: false,
      otpCode,
      otpExpiry,
    });

    // إرسال رمز التحقق عبر البريد الإلكتروني
    try {
      await sendOTPEmail(user.email, otpCode, user.name);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError.message);
    }

    // إرجاع رسالة نجاح
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
      data: {
        userId: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      data: { error: error.message },
    });
  }
};

// ========================================
// 2. دالة التحقق من رمز OTP
// ========================================
// الخطوات:
// 1. استقبال البريد الإلكتروني ورمز التحقق من جسم الطلب
// 2. التحقق من وجود الحقول المطلوبة
// 3. البحث عن المستخدم في قاعدة البيانات باستخدام البريد الإلكتروني
// 4. التحقق من أن الرمز المدخل يطابق الرمز المخزن
// 5. التحقق من أن الرمز لم تنتهِ صلاحيته
// 6. تحديث حالة التحقق إلى true ومسح رمز OTP وصلاحيته
// 7. إرسال رسالة ترحيبية عبر البريد الإلكتروني
// 8. توليد رمز JWT وإرجاعه مع بيانات المستخدم
const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
        data: {},
      });
    }

    // البحث عن المستخدم باستخدام البريد الإلكتروني
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: {},
      });
    }

    // التحقق من أن الرمز المدخل يطابق الرمز المخزن
    if (user.otpCode !== otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        data: {},
      });
    }

    // التحقق من أن الرمز لم تنتهِ صلاحيته
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
        data: {},
      });
    }

    // تحديث حالة التحقق ومسح رمز OTP
    user.isEmailVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });

    // إرسال رسالة ترحيبية
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Error sending welcome message:', emailError.message);
    }

    // توليد رمز JWT وإرجاعه مع بيانات المستخدم
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
      data: { error: error.message },
    });
  }
};

// ========================================
// 3. دالة إعادة إرسال رمز التحقق OTP
// ========================================
// الخطوات:
// 1. استقبال البريد الإلكتروني من جسم الطلب
// 2. البحث عن المستخدم في قاعدة البيانات
// 3. التحقق من أن المستخدم لم يتم التحقق منه بالفعل
// 4. توليد رمز تحقق جديد وحساب وقت انتهاء الصلاحية
// 5. تحديث رمز التحقق وصلاحيته في قاعدة البيانات
// 6. إرسال الرمز الجديد عبر البريد الإلكتروني
// 7. إرجاع رسالة نجاح
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // التحقق من وجود البريد الإلكتروني
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        data: {},
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: {},
      });
    }

    // التحقق من أن المستخدم لم يتم التحقق منه بالفعل
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified',
        data: {},
      });
    }

    // توليد رمز تحقق جديد وتحديثه في قاعدة البيانات
    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // إرسال الرمز الجديد عبر البريد الإلكتروني
    try {
      await sendOTPEmail(user.email, otpCode, user.name);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while resending code',
      data: { error: error.message },
    });
  }
};

// ========================================
// 4. دالة تسجيل الدخول
// ========================================
// الخطوات:
// 1. استقبال البريد الإلكتروني وكلمة المرور من جسم الطلب
// 2. التحقق من وجود الحقول المطلوبة
// 3. البحث عن المستخدم مع تضمين حقل كلمة المرور
// 4. التحقق من وجود المستخدم
// 5. مقارنة كلمة المرور المدخلة مع المشفرة
// 6. التحقق من أن البريد الإلكتروني تم التحقق منه
// 7. توليد رمز JWT وإرجاعه مع بيانات المستخدم (بدون كلمة المرور)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: {},
      });
    }

    // البحث عن المستخدم مع تضمين كلمة المرور (لأنها مخفية بشكل افتراضي)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // التحقق من وجود المستخدم
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: {},
      });
    }

    // التحقق من أن المستخدم ليس مسجلاً عبر OAuth (لا يملك كلمة مرور)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: `This account is registered via ${user.authProvider}. Please login through it.`,
        data: {},
      });
    }

    // مقارنة كلمة المرور المدخلة مع المشفرة
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: {},
      });
    }

    // التحقق من أن البريد الإلكتروني تم التحقق منه
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        data: { email: user.email },
      });
    }

    // توليد رمز JWT وإرجاعه مع بيانات المستخدم
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          location: user.location,
          currency: user.currency,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      data: { error: error.message },
    });
  }
};

// ========================================
// 5. دالة نسيان كلمة المرور
// ========================================
// الخطوات:
// 1. استقبال البريد الإلكتروني من جسم الطلب
// 2. البحث عن المستخدم في قاعدة البيانات
// 3. التحقق من أن المستخدم مسجل محلياً (ليس عبر OAuth)
// 4. توليد رمز تحقق OTP جديد وتحديثه في قاعدة البيانات
// 5. إرسال الرمز عبر البريد الإلكتروني
// 6. إرجاع رسالة نجاح
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        data: {},
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account linked to this email',
        data: {},
      });
    }

    // توليد رمز تحقق جديد
    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // إرسال رمز التحقق عبر البريد الإلكتروني
    try {
      await sendOTPEmail(user.email, otpCode, user.name);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'A verification code has been sent to your email to reset your password',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: { error: error.message },
    });
  }
};

// ========================================
// 6. دالة إعادة تعيين كلمة المرور
// ========================================
// الخطوات:
// 1. استقبال البريد الإلكتروني ورمز التحقق وكلمة المرور الجديدة من جسم الطلب
// 2. التحقق من وجود جميع الحقول المطلوبة
// 3. البحث عن المستخدم في قاعدة البيانات
// 4. التحقق من صحة رمز OTP وعدم انتهاء صلاحيته
// 5. تشفير كلمة المرور الجديدة باستخدام bcryptjs مع 12 جولة
// 6. تحديث كلمة المرور ومسح رمز OTP وصلاحيته
// 7. إرجاع رسالة نجاح
const resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    // التحقق من وجود جميع الحقول المطلوبة
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required',
        data: {},
      });
    }

    // التحقق من طول كلمة المرور الجديدة
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
        data: {},
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: {},
      });
    }

    // التحقق من صحة رمز OTP
    if (user.otpCode !== otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        data: {},
      });
    }

    // التحقق من عدم انتهاء صلاحية رمز OTP
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
        data: {},
      });
    }

    // تشفير كلمة المرور الجديدة
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // تحديث كلمة المرور ومسح رمز OTP
    user.password = hashedPassword;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login.',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      data: { error: error.message },
    });
  }
};

// ========================================
// 6.5 دالة التحقق من رمز OTP الخاص بنسيان كلمة المرور (بدون مسحه)
// ========================================
const verifyPasswordOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.otpCode !== otpCode) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }
    res.status(200).json({ success: true, message: 'Verification code is valid' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// 7. دالة الحصول على بيانات المستخدم الحالي (محمية)
// ========================================
// الخطوات:
// 1. الحصول على معرف المستخدم من كائن الطلب (تم إرفاقه بواسطة وسيط المصادقة)
// 2. البحث عن المستخدم في قاعدة البيانات مع استبعاد كلمة المرور ورمز التحقق
// 3. إرجاع بيانات المستخدم
const getMe = async (req, res) => {
  try {
    // البحث عن المستخدم مع استبعاد الحقول الحساسة
    const user = await User.findById(req.user._id).select('-password -otpCode -otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      message: 'User data retrieved successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: { error: error.message },
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  verifyPasswordOTP,
  getMe,
};

// ========================================
// 8. دالة تسجيل الدخول بفيسبوك عن طريق Access Token
// ========================================
const facebookTokenLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;

    /* التحقق من الـ token مع فيسبوك */
    const fbResponse = await axios.get(
      `https://graph.facebook.com/${userID}?fields=id,name,email&access_token=${accessToken}`
    );

    const { id, name, email } = fbResponse.data;

    /* البحث عن اليوزر أو إنشاء واحد جديد */
    let user = await User.findOne({ 
      $or: [{ facebookId: id }, { email: email }] 
    });

    if (!user) {
      user = await User.create({
        name,
        email: email || `fb_${id}@budgetwise.com`,
        facebookId: id,
        authProvider: 'facebook',
        isEmailVerified: true,
      });
    } else {
      if (!user.facebookId) {
        user.facebookId = id;
        await user.save();
      }
    }

    const token = generateToken(user._id, user.role);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Facebook login failed',
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  verifyPasswordOTP,
  getMe,
  facebookTokenLogin,
};

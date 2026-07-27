// نموذج المستخدم - يمثل مجموعة المستخدمين في قاعدة البيانات
// العلاقات: المستخدم لديه ميزانية واحدة (Budget)، خطة واحدة نشطة (Plan)، عدة عناصر خطة (PlanItem)، عدة جلسات محادثة (ChatSession)، وعدة رسائل (ChatMessage)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // اسم المستخدم الكامل
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    // البريد الإلكتروني - يستخدم لتسجيل الدخول ويجب أن يكون فريداً
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // كلمة المرور المشفرة - اختيارية لأن مستخدمي OAuth لا يحتاجون كلمة مرور
    password: {
      type: String,
      default: null,
      select: false,
    },
    // رابط صورة الملف الشخصي
    avatar: {
      type: String,
      default: '',
    },
    // رقم الهاتف
    phone: {
      type: String,
      default: '',
    },
    // تاريخ الميلاد
    birthday: {
      type: Date,
      default: null,
    },
    // موقع المستخدم (المدينة والبلد)
    location: {
      type: String,
      default: 'Cairo, Egypt',
    },
    // العملة المفضلة للمستخدم
    currency: {
      type: String,
      default: 'EGP',
    },
    // مزود المصادقة - محلي أو عبر جوجل أو فيسبوك
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    // معرف حساب جوجل للمستخدمين المسجلين عبر جوجل
    googleId: {
      type: String,
      default: null,
    },
    // معرف حساب فيسبوك للمستخدمين المسجلين عبر فيسبوك
    facebookId: {
      type: String,
      default: null,
    },
    // هل تم التحقق من البريد الإلكتروني
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // رمز التحقق OTP المرسل عبر البريد الإلكتروني
    otpCode: {
      type: String,
      default: null,
    },
    // تاريخ انتهاء صلاحية رمز التحقق OTP
    otpExpiry: {
      type: Date,
      default: null,
    },
    // البريد الإلكتروني المعلق - يُستخدم مؤقتاً عند طلب تغيير البريد الإلكتروني حتى يتم التحقق منه
    pendingEmail: {
      type: String,
      default: null,
    },
    // هل الإشعارات مفعلة للمستخدم
    notifications: {
      type: Boolean,
      default: true,
    },
    // دور المستخدم
    role: {
      type: String,
      enum: ['pending', 'user', 'founder'],
      default: 'pending',
    },
    // بيانات خاصة بصاحب المؤسسة (الفاوندر)
    companyName: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      default: null,
    },
    companyAddress: {
      type: String,
      default: null,
    },
    // الصناعة المخصصة (عندما يختار الفاوندر "other")
    customIndustry: {
      type: String,
      default: null,
    },
  },
  {
    // إضافة حقلي createdAt و updatedAt تلقائياً
    timestamps: true,
  }
);

// دالة مقارنة كلمة المرور المدخلة مع كلمة المرور المشفرة المخزنة
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

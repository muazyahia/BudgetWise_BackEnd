// أداة توليد رمز JWT - تنشئ رمز مصادقة مشفر للمستخدم باستخدام مكتبة jsonwebtoken

const jwt = require('jsonwebtoken');

// دالة توليد رمز JWT باستخدام معرف المستخدم
// الخطوات:
// 1. استقبال معرف المستخدم كمعامل
// 2. استخدام jwt.sign لإنشاء رمز يحتوي على معرف المستخدم
// 3. استخدام المفتاح السري من متغيرات البيئة للتشفير
// 4. تحديد مدة صلاحية الرمز بـ 7 أيام
// 5. إرجاع الرمز المشفر
const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;

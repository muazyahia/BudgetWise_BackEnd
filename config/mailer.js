// ملف إعداد البريد الإلكتروني - يقوم بتهيئة خدمة إرسال البريد الإلكتروني عبر Nodemailer

const nodemailer = require('nodemailer');

// إنشاء ناقل البريد الإلكتروني باستخدام إعدادات SMTP من متغيرات البيئة
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // استخدام TLS
  auth: {
    user: process.env.SMTP_USER, // البريد الإلكتروني للمرسل
    pass: process.env.SMTP_PASS, // كلمة مرور التطبيق
  },
});

module.exports = transporter;

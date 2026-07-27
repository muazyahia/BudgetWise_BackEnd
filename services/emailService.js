// خدمة البريد الإلكتروني - تقوم بإرسال رسائل البريد الإلكتروني باستخدام Nodemailer مع إعدادات SMTP من متغيرات البيئة

const nodemailer = require('nodemailer');

// إنشاء ناقل البريد الإلكتروني باستخدام إعدادات SMTP
// الخطوات:
// 1. تحديد خادم SMTP ورقم المنفذ من متغيرات البيئة
// 2. تعطيل SSL واستخدام TLS بدلاً منه
// 3. تعيين بيانات المصادقة (البريد وكلمة المرور) من متغيرات البيئة
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// دالة إرسال رمز التحقق OTP عبر البريد الإلكتروني
// الخطوات:
// 1. استقبال البريد الإلكتروني ورمز التحقق واسم المستخدم
// 2. إنشاء قالب HTML جميل يحتوي على رمز التحقق بخط كبير
// 3. تحديد عنوان المرسل وعنوان المستلم وموضوع الرسالة
// 4. إرسال الرسالة عبر ناقل البريد الإلكتروني
// 5. إرجاع نتيجة الإرسال
const sendOTPEmail = async (email, otpCode, userName) => {
  const mailOptions = {
    from: `"BudgetWise" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔐 Your Verification Code - BudgetWise',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
          .body { padding: 40px 30px; text-align: center; }
          .greeting { font-size: 20px; color: #2d3748; margin-bottom: 16px; font-weight: 600; }
          .message { font-size: 15px; color: #718096; line-height: 1.8; margin-bottom: 32px; }
          .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; display: inline-block; margin: 0 auto 32px; }
          .otp-code { font-size: 42px; font-weight: 800; color: #ffffff; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace; }
          .timer { font-size: 13px; color: #e53e3e; background: #fff5f5; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px; }
          .footer { background: #f7fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 12px; color: #a0aec0; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BudgetWise</h1>
            <p>Manage your budget smartly</p>
          </div>
          <div class="body">
            <p class="greeting">Hello ${userName || ''}! 👋</p>
            <p class="message">We have received a request to verify your account. Use the following verification code to complete the process:</p>
            <div class="otp-box">
              <p class="otp-code">${otpCode}</p>
            </div>
            <p class="timer">⏱ This code is valid for 10 minutes only</p>
            <p class="message">If you did not request this code, you can safely ignore this message.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BudgetWise. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

// دالة إرسال رسالة ترحيبية بعد نجاح التحقق من البريد الإلكتروني
// الخطوات:
// 1. استقبال البريد الإلكتروني واسم المستخدم
// 2. إنشاء قالب HTML ترحيبي جميل
// 3. تحديد عنوان المرسل والمستلم والموضوع
// 4. إرسال الرسالة الترحيبية
// 5. إرجاع نتيجة الإرسال
const sendWelcomeEmail = async (email, userName) => {
  const mailOptions = {
    from: `"BudgetWise" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to BudgetWise!',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
          .body { padding: 40px 30px; text-align: center; }
          .emoji { font-size: 64px; margin-bottom: 20px; }
          .greeting { font-size: 22px; color: #2d3748; margin-bottom: 16px; font-weight: 600; }
          .message { font-size: 15px; color: #718096; line-height: 1.8; margin-bottom: 24px; }
          .features { text-align: right; padding: 0 20px; margin-bottom: 24px; }
          .feature { display: flex; align-items: center; padding: 10px 0; font-size: 14px; color: #4a5568; }
          .feature span { margin-left: 10px; font-size: 18px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; }
          .footer { background: #f7fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 12px; color: #a0aec0; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 BudgetWise</h1>
          </div>
          <div class="body">
            <p class="emoji">🎉</p>
            <p class="greeting">Hello ${userName}!</p>
            <p class="message">Your account has been verified successfully. We are glad you joined BudgetWise!</p>
            <p class="message">You can now enjoy all the application features:</p>
            <div class="features">
              <div class="feature"><span>📊</span> Easily manage your budget</div>
              <div class="feature"><span>🎯</span> Plan your daily activities</div>
              <div class="feature"><span>🤖</span> Smart assistant for financial advice</div>
              <div class="feature"><span>📈</span> Track your expenses moment by moment</div>
            </div>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Start Now</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BudgetWise. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendWelcomeEmail };

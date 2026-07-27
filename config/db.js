// ملف إعداد قاعدة البيانات - يقوم بالاتصال بقاعدة بيانات MongoDB

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// متغير لحفظ حالة الاتصال لتجنب فتح اتصالات جديدة مع كل طلب في Vercel Serverless
let cachedConnection = null;

// دالة الاتصال بقاعدة بيانات MongoDB
const connectDB = async () => {
  // إذا كان هناك اتصال مسبق، نستخدمه مباشرة
  if (cachedConnection) {
    logger.info('Using cached database connection');
    return cachedConnection;
  }

  try {
    // محاولة الاتصال بقاعدة البيانات باستخدام رابط الاتصال من متغيرات البيئة
    const conn = await mongoose.connect(process.env.MONGO_URI);
    cachedConnection = conn;
    logger.info(`Database is Connected ... ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // طباعة رسالة الخطأ في حالة فشل الاتصال
    logger.error(`Database connection error: ${error.message}`);
    // إنهاء العملية في حالة فشل الاتصال فقط إذا لم يكن على Vercel لمنع تعطل الفانكشنز
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;

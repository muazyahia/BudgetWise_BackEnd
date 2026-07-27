// نموذج رسالة المحادثة - يمثل مجموعة الرسائل داخل جلسات المحادثة في قاعدة البيانات
// العلاقات: كل رسالة تنتمي لجلسة محادثة واحدة (ChatSession) ولمستخدم واحد (User)

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    // معرف جلسة المحادثة التي تنتمي إليها الرسالة
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: [true, 'Session ID is required'],
    },
    // معرف المستخدم صاحب الرسالة
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // دور المرسل - مستخدم أو ذكاء اصطناعي
    role: {
      type: String,
      enum: ['user', 'ai'],
      required: [true, 'Sender role is required'],
    },
    // محتوى الرسالة النصي
    content: {
      type: String,
      default: '',
    },
    // المرفقات
    attachment: {
      type: String, // Base64 or URL
      default: null,
    },
    // سياق الرسالة - يحتوي على معلومات الميزانية والموقع وقت إرسال الرسالة
    context: {
      // مبلغ الميزانية الحالي
      budgetAmount: {
        type: Number,
        default: null,
      },
      // المبلغ المتبقي من الميزانية
      budgetRemaining: {
        type: Number,
        default: null,
      },
      // موقع المستخدم الحالي
      location: {
        type: String,
        default: null,
      },
    },
    // مصفوفة الأنشطة المقترحة (إن وجدت)
    recommendedActivities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }],
    // الطابع الزمني لإرسال الرسالة
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

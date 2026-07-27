// نموذج جلسة المحادثة - يمثل مجموعة جلسات المحادثة مع المساعد الذكي في قاعدة البيانات
// العلاقات: كل جلسة تنتمي لمستخدم واحد (User)، وتحتوي على عدة رسائل (ChatMessage)

const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    // معرف المستخدم صاحب الجلسة
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // عنوان جلسة المحادثة
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    // لقطة من مبلغ الميزانية وقت إنشاء الجلسة - لتوفير سياق مالي للمحادثة
    budgetSnapshot: {
      type: Number,
      default: null,
    },
    // هل تم تصدير المحادثة (مشاركتها أو حفظها خارجياً)
    isExported: {
      type: Boolean,
      default: false,
    },
  },
  {
    // إضافة حقلي createdAt و updatedAt تلقائياً
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);

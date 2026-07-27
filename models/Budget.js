// نموذج الميزانية - يمثل مجموعة الميزانيات في قاعدة البيانات
// العلاقات: كل ميزانية تنتمي لمستخدم واحد (User)، ويمكن أن ترتبط بخطة واحدة (Plan)

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    // معرف المستخدم صاحب الميزانية
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // المبلغ الإجمالي المخصص للميزانية
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    // الفترة الزمنية للميزانية - يومية أو أسبوعية أو شهرية أو لحدث معين
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'event'],
      required: [true, 'Budget period is required'],
    },
    // المبلغ الذي تم إنفاقه من الميزانية
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    // المبلغ المتبقي من الميزانية - يُحسب تلقائياً عبر وسيط ما قبل الحفظ
    remaining: {
      type: Number,
    },
    // العملة المستخدمة في الميزانية
    currency: {
      type: String,
      default: 'EGP',
    },
    // هل الميزانية نشطة حالياً
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // إضافة حقلي createdAt و updatedAt تلقائياً
    timestamps: true,
  }
);

// وسيط ما قبل الحفظ - حساب المبلغ المتبقي تلقائياً من الفرق بين المبلغ الإجمالي والمصروف
budgetSchema.pre('save', function (next) {
  this.remaining = this.amount - this.spent;
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);

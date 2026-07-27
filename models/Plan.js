// نموذج الخطة - يمثل مجموعة خطط الإنفاق في قاعدة البيانات
// العلاقات: كل خطة تنتمي لمستخدم واحد (User) مع خطة نشطة واحدة فقط لكل مستخدم، ويمكن ربطها بميزانية (Budget)، وتحتوي على عدة عناصر (PlanItem)

const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    // معرف المستخدم صاحب الخطة - فريد لضمان خطة نشطة واحدة لكل مستخدم
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    // معرف الميزانية المرتبطة بالخطة (اختياري)
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      default: null,
    },
    // المبلغ الإجمالي المخطط لإنفاقه في الخطة
    totalPlanned: {
      type: Number,
      default: 0,
    },
  },
  {
    // إضافة حقلي createdAt و updatedAt تلقائياً
    timestamps: true,
  }
);

module.exports = mongoose.model('Plan', planSchema);

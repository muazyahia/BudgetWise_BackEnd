// نموذج عنصر الخطة - يدعم الأنشطة من قاعدة البيانات والأنشطة المُدخلة يدوياً من الـ Frontend

const mongoose = require('mongoose');

const planItemSchema = new mongoose.Schema(
  {
    // معرف الخطة التي ينتمي إليها هذا العنصر
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan ID is required'],
    },
    // معرف المستخدم صاحب العنصر
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // معرف النشاط من قاعدة البيانات — اختياري (قد يكون null لو الأنشطة Hardcoded)
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
    },
    // معرف النشاط الخارجي (من Frontend) — عشان نتجنب تكرار نفس النشاط
    externalActivityId: {
      type: String,
      default: null,
    },
    // بيانات النشاط المخزنة مباشرة (لو مش موجود في DB)
    title: { type: String, required: [true, 'Title is required'] },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    location: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    // سعر النشاط في الخطة
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // حالة العنصر - مخطط أو منجز أو ملغى
    status: {
      type: String,
      enum: ['planned', 'done', 'cancelled'],
      default: 'planned',
    },
    // تاريخ إضافة العنصر إلى الخطة
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model('PlanItem', planItemSchema);

// نموذج النشاط - يمثل مجموعة الأنشطة الترفيهية والخدمات المتاحة في قاعدة البيانات
// العلاقات: النشاط يمكن أن يُضاف إلى عدة عناصر خطة (PlanItem) من قبل مستخدمين مختلفين

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    // عنوان النشاط
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
    },
    // الفاوندر (صاحب النشاط)
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // وصف تفصيلي للنشاط
    description: {
      type: String,
      default: '',
    },
    // تصنيف النشاط - طعام أو ترفيه أو تسوق أو أنشطة خارجية أو سفر أو أخرى
    category: {
      type: String,
      enum: [
        'technology', 
        'food', 
        'tourism', 
        'healthcare', 
        'education', 
        'retail', 
        'entertainment', 
        'sports', 
        'finance', 
        'manufacturing', 
        'other'
      ],
      default: 'other',
    },
    // تصنيف مخصص للنشاط (عند اختيار "other")
    customCategory: {
      type: String,
      default: null,
    },
    // سعر النشاط
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    views: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    // هل السعر للشخص الواحد أم إجمالي
    pricePerPerson: {
      type: Boolean,
      default: false,
    },
    // الموقع التفصيلي للنشاط (العنوان)
    location: {
      type: String,
      default: '',
    },
    // المدينة التي يتوفر فيها النشاط
    city: {
      type: String,
      default: 'Cairo',
    },
    // الصورة الرئيسية للنشاط
    image: {
      type: String,
      default: '',
    },
    // مصفوفة روابط الصور الخاصة بالنشاط
    images: {
      type: [String],
      default: [],
    },
    // أبرز مميزات النشاط
    highlights: {
      type: [String],
      default: [],
    },
    // أوقات التوفر والعمل
    availability: {
      type: String,
      default: '',
    },
    // المدة الزمنية المتوقعة للنشاط
    duration: {
      type: String,
      default: '',
    },
    // متوسط تقييم النشاط من 0 إلى 5
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    // عدد المراجعات والتقييمات
    reviewsCount: {
      type: Number,
      default: 0,
    },
    // هل النشاط مميز ويظهر في القسم المميز
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    // إضافة حقلي createdAt و updatedAt تلقائياً
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', activitySchema);

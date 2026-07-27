// مسارات الأنشطة

const express = require('express');
const router = express.Router();
const { 
  getAllActivities, 
  searchActivities, 
  getRecommended, 
  getActivityById, 
  seedActivities,
  createActivity,
  getMyActivities,
  updateActivity,
  deleteActivity,
  createReview,
  getActivityReviews
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const uploadActivity = require('../middleware/uploadActivity');

// مسار إدخال أنشطة تجريبية (بدون حماية لسهولة الاختبار)
router.post('/seed', seedActivities);

// حماية المسارات التالية
router.use(protect);

// مسار البحث في الأنشطة
router.get('/search', searchActivities);

// مسار جلب الأنشطة الموصى بها
router.get('/recommended', getRecommended);

// مسار جلب أنشطة الفاوندر
router.get('/my-posts', getMyActivities);

// مسار إنشاء نشاط جديد (للفاوندر)
router.post(
  '/',
  uploadActivity.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 3 }
  ]),
  createActivity
);

// مسار جلب جميع الأنشطة
router.get('/', getAllActivities);

// مسار جلب نشاط بالمعرف
router.get('/:id', getActivityById);

// مسار تعديل نشاط
router.put(
  '/:id',
  uploadActivity.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 3 }
  ]),
  updateActivity
);

// مسار حذف نشاط
router.delete('/:id', deleteActivity);

// مسارات التقييمات
router.post('/:id/reviews', createReview);
router.get('/:id/reviews', getActivityReviews);

module.exports = router;

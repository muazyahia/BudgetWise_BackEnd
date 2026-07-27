// مسارات الميزانية - تحدد نقاط النهاية لعمليات إدارة الميزانيات

const express = require('express');
const router = express.Router();
const { 
  createBudget, 
  getMyBudget, 
  updateBudget, 
  getBudgetStats, 
  getBudgetTips 
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

// حماية جميع المسارات - يجب تسجيل الدخول
router.use(protect);

// مسار جلب إحصائيات الميزانية
router.get('/stats', getBudgetStats);

// مسار جلب نصائح الميزانية
router.get('/tips', getBudgetTips);

// مسار جلب الميزانية الحالية للمستخدم
router.get('/me', getMyBudget);

// مسار إنشاء ميزانية جديدة
router.post('/', createBudget);

// مسار تحديث ميزانية بالمعرف
router.put('/:id', updateBudget);

module.exports = router;

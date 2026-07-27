// مسارات الخطط

const express = require('express');
const router = express.Router();
const { 
  getMyPlan, 
  addToPlan, 
  removeFromPlan, 
  getPlanSummary 
} = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

// حماية جميع المسارات
router.use(protect);

// مسار جلب ملخص الخطة
router.get('/summary', getPlanSummary);

// مسار جلب خطة المستخدم
router.get('/me', getMyPlan);

// مسار إضافة نشاط للخطة
router.post('/add', addToPlan);

// مسار حذف عنصر من الخطة
router.delete('/remove/:itemId', removeFromPlan);

module.exports = router;

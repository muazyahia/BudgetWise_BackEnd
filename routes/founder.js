const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getBusinessPlan, 
  updateBusinessPlan, 
  getCompanyBudget, 
  updateCompanyBudget 
} = require('../controllers/founderDataController');

router.use(protect);

router.get('/business-plan', getBusinessPlan);
router.put('/business-plan', updateBusinessPlan);

router.get('/company-budget', getCompanyBudget);
router.put('/company-budget', updateCompanyBudget);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  deleteNotification, 
  clearAllNotifications 
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.post('/read', markAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

module.exports = router;

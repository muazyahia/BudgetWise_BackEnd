// مسارات المحادثة

const express = require('express');
const router = express.Router();
const { 
  getSessions, 
  createSession, 
  getSessionMessages, 
  sendMessage, 
  deleteSession, 
  exportSession 
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// حماية جميع المسارات
router.use(protect);

router.get('/sessions', getSessions);
router.post('/sessions', createSession);

router.get('/sessions/:id', getSessionMessages);
router.post('/sessions/:id/message', sendMessage);
router.delete('/sessions/:id', deleteSession);
router.get('/sessions/:id/export', exportSession);

module.exports = router;

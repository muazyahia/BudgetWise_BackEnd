// متحكم المحادثة

const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Budget = require('../models/Budget');
const Activity = require('../models/Activity');
const { getAIResponse } = require('../services/aiService');

// 1. جلب جميع جلسات المحادثة للمستخدم
const getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    const sessionsWithCounts = await Promise.all(sessions.map(async (session) => {
      const messageCount = await ChatMessage.countDocuments({ sessionId: session._id });
      return { ...session.toObject(), messageCount };
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped = {
      Today: [],
      Yesterday: [],
      Older: []
    };

    sessionsWithCounts.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      if (sessionDate >= today) {
        grouped.Today.push(session);
      } else if (sessionDate >= yesterday) {
        grouped.Yesterday.push(session);
      } else {
        grouped.Older.push(session);
      }
    });

    res.json({
      success: true,
      message: 'Sessions retrieved',
      data: { sessions: sessionsWithCounts, grouped }
    });
  } catch (error) {
    next(error);
  }
};

// 2. إنشاء جلسة محادثة جديدة
const createSession = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ userId: req.user._id, isActive: true });
    const budgetSnapshot = budget ? budget.amount : null;

    const session = await ChatSession.create({
      userId: req.user._id,
      title: req.body.title || 'New Conversation',
      budgetSnapshot
    });

    res.status(201).json({
      success: true,
      message: 'Session created',
      data: { sessionId: session._id, session }
    });
  } catch (error) {
    next(error);
  }
};

// 3. جلب رسائل جلسة
const getSessionMessages = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    const messages = await ChatMessage.find({ sessionId: session._id })
      .populate('recommendedActivities')
      .sort({ timestamp: 1 });
      
    res.json({
      success: true,
      message: 'Messages retrieved',
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// 4. إرسال رسالة في الجلسة
const sendMessage = async (req, res, next) => {
  try {
    const { message, attachment, category, customBudget } = req.body;
    const sessionId = req.params.id;

    const session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    const budget = await Budget.findOne({ userId: req.user._id, isActive: true });
    
    // Determine the budget to use for recommendations
    const remainingBudget = budget ? (budget.amount - budget.spent) : null;
    const targetBudget = customBudget ? Number(customBudget) : remainingBudget;

    // Fetch activities based on target budget and category
    let activityQuery = {};
    if (targetBudget) {
      activityQuery.price = { $lte: targetBudget };
    }
    if (category) {
      activityQuery.category = category;
    }
    
    // Fetch up to 15 matching activities
    const availableActivities = await Activity.find(activityQuery).limit(15);

    const context = {
      budgetAmount: budget ? budget.amount : null,
      budgetRemaining: remainingBudget,
      location: null,
      availableActivities
    };

    // Fetch conversation history (last 6 messages) BEFORE saving the current one
    const recentMessages = await ChatMessage.find({ sessionId: session._id })
      .sort({ timestamp: -1 })
      .limit(6);
    
    const history = recentMessages.reverse().map(m => ({
      role: m.role,
      content: m.content
    }));

    const userMessageObj = await ChatMessage.create({
      sessionId: session._id,
      userId: req.user._id,
      role: 'user',
      content: message || '',
      attachment: attachment || null,
      context
    });

    const count = await ChatMessage.countDocuments({ sessionId: session._id });
    if (count === 1) {
      const firstWord = message.trim().split(/\s+/)[0];
      session.title = firstWord.substring(0, 30);
      await session.save();
    }

    const aiResponse = await getAIResponse(message, context, history);

    let aiMessage = await ChatMessage.create({
      sessionId: session._id,
      userId: req.user._id,
      role: 'ai',
      content: aiResponse.reply || '',
      recommendedActivities: aiResponse.recommendedActivities || [],
      context
    });

    // Populate the recommended activities so the frontend gets full card details
    aiMessage = await aiMessage.populate('recommendedActivities');

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { userMessage: userMessageObj, aiMessage }
    });
  } catch (error) {
    next(error);
  }
};

// 5. حذف جلسة
const deleteSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    await ChatMessage.deleteMany({ sessionId: session._id });
    await ChatSession.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Session deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// 6. تصدير جلسة
const exportSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    const messages = await ChatMessage.find({ sessionId: session._id }).sort({ timestamp: 1 });
    
    session.isExported = true;
    await session.save();

    res.json({
      success: true,
      message: 'Session exported',
      data: { session, messages }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  createSession,
  getSessionMessages,
  sendMessage,
  deleteSession,
  exportSession
};

// متحكم الخطط — مُصلح ومحسّن

const Plan = require('../models/Plan');
const PlanItem = require('../models/PlanItem');
const Budget = require('../models/Budget');
const Activity = require('../models/Activity');
const { calculateRemaining, calculatePercentage, getBudgetStatus } = require('../utils/budgetCalculator');
const { getIO } = require('../utils/socket');

/* ─────────────────────────────────────────────
   Helper: يجيب أو يُنشئ الخطة الخاصة باليوزر
───────────────────────────────────────────── */
const getOrCreatePlan = async (userId) => {
  let plan = await Plan.findOne({ userId });
  if (!plan) {
    plan = await Plan.create({ userId, totalPlanned: 0 });
  }
  return plan;
};

/* ─────────────────────────────────────────────
   Helper: يجيب الميزانية النشطة (أو null)
───────────────────────────────────────────── */
const getActiveBudget = async (userId) => {
  return await Budget.findOne({ userId, isActive: true });
};

/* ══════════════════════════════════════════════
   1. GET /api/plan/me — جلب خطة المستخدم
══════════════════════════════════════════════ */
const getMyPlan = async (req, res, next) => {
  try {
    const plan = await getOrCreatePlan(req.user._id);
    const budget = await getActiveBudget(req.user._id);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // جلب عناصر الخطة (بدون populate لأن activityId اختياري الآن)
    const items = await PlanItem.find({ planId: plan._id })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await PlanItem.countDocuments({ planId: plan._id });

    // حساب ملخص الميزانية
    let budgetSummary = null;
    if (budget) {
      const remaining = calculateRemaining(budget.amount, budget.spent);
      const percentage = calculatePercentage(budget.spent, budget.amount);
      budgetSummary = {
        totalBudget: budget.amount,
        spent: budget.spent,
        totalPlanned: plan.totalPlanned,
        remaining,
        percentage,
        budgetId: budget._id
      };
    }

    // تسوية بيانات كل عنصر للـ Frontend
    const normalizedItems = items.map(item => ({
      _id: item._id,
      id: item._id,
      title: item.title,
      description: item.description,
      image: item.image,
      img: item.image,
      images: item.images,
      location: item.location,
      cost: item.price,
      price: item.price,
      rating: item.rating,
      status: item.status,
      addedAt: item.addedAt,
      externalActivityId: item.externalActivityId,
    }));

    res.json({
      success: true,
      message: 'Plan retrieved',
      data: normalizedItems,
      budgetSummary,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════
   2. POST /api/plan/add — إضافة نشاط للخطة
══════════════════════════════════════════════ */
const addToPlan = async (req, res, next) => {
  try {
    const { activityId, title, description, cost, location, image, images, rating } = req.body;

    // التحقق من وجود العنوان والسعر
    if (!title) {
      res.status(400);
      throw new Error('Activity title is required');
    }
    const price = Number(cost) || 0;

    // جلب أو إنشاء الخطة
    const plan = await getOrCreatePlan(req.user._id);

    // التحقق من التكرار بالـ externalActivityId
    const externalId = activityId ? String(activityId) : null;
    if (externalId) {
      const existing = await PlanItem.findOne({ planId: plan._id, externalActivityId: externalId });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Activity is already in your plan',
        });
      }
    }

    // جلب الميزانية
    const budget = await getActiveBudget(req.user._id);

    // المنع إذا لم تكن هناك ميزانية محددة
    if (!budget) {
      return res.status(400).json({
        success: false,
        message: 'You must set a budget before adding activities to your plan.',
      });
    }

    // المنع إذا تجاوز السعر الميزانية المتبقية
    const remaining = calculateRemaining(budget.amount, budget.spent);
    if (price > remaining) {
      return res.status(400).json({
        success: false,
        message: `Cannot add activity. Price (${price} EGP) exceeds your remaining budget (${remaining} EGP).`,
      });
    }

    let warning = null;

    // إنشاء عنصر الخطة
    const item = await PlanItem.create({
      planId: plan._id,
      userId: req.user._id,
      externalActivityId: externalId,
      title,
      description: description || '',
      image: image || '',
      images: images || [],
      location: location || '',
      rating: Number(rating) || 0,
      price,
    });

    // تحديث إجمالي الخطة
    plan.totalPlanned += price;
    await plan.save();

    // تحديث الميزانية لو موجودة
    if (budget) {
      budget.spent += price;
      await budget.save();
    }

    // Update activity save count
    if (externalId) {
      const act = await Activity.findByIdAndUpdate(externalId, { $inc: { saves: 1 } });
      
      // Emit Real-Time Notification to Founder
      if (act && act.founder) {
        try {
          getIO().to(act.founder.toString()).emit('notification', {
            type: 'ACTIVITY_SAVED',
            message: `${req.user.name} added "${act.title}" to their plan!`,
            activityId: act._id,
            timestamp: new Date()
          });
        } catch (err) {
          const logger = require('../utils/logger');
          logger.error('Socket notification error:', err.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Added to plan successfully',
      data: {
        _id: item._id,
        id: item._id,
        title: item.title,
        description: item.description,
        image: item.image,
        img: item.image,
        images: item.images,
        location: item.location,
        cost: item.price,
        price: item.price,
        rating: item.rating,
        status: item.status,
        addedAt: item.addedAt,
        warning,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════
   3. DELETE /api/plan/remove/:itemId — حذف عنصر
══════════════════════════════════════════════ */
const removeFromPlan = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await PlanItem.findOne({ _id: itemId, userId: req.user._id });
    if (!item) {
      res.status(404);
      throw new Error('Plan item not found');
    }

    const plan = await Plan.findOne({ _id: item.planId });
    const budget = await getActiveBudget(req.user._id);

    if (plan) {
      plan.totalPlanned = Math.max(0, plan.totalPlanned - item.price);
      await plan.save();
    }

    if (budget) {
      budget.spent = Math.max(0, budget.spent - item.price);
      await budget.save();
    }

    // Decrement activity save count
    if (item.externalActivityId) {
      await Activity.findByIdAndUpdate(item.externalActivityId, { $inc: { saves: -1 } });
    }

    await PlanItem.findByIdAndDelete(itemId);

    res.json({
      success: true,
      message: 'Item removed from plan successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════
   4. GET /api/plan/summary — ملخص الخطة
══════════════════════════════════════════════ */
const getPlanSummary = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id });
    const budget = await getActiveBudget(req.user._id);

    const totalPlanned = plan ? plan.totalPlanned : 0;
    const itemsCount = plan ? await PlanItem.countDocuments({ planId: plan._id }) : 0;

    // لو مفيش ميزانية نرجع بيانات بدونها
    if (!budget) {
      return res.json({
        success: true,
        message: 'Plan summary retrieved (no active budget)',
        data: {
          totalBudget: 0,
          spent: totalPlanned,
          totalPlanned,
          remaining: 0,
          percentage: 0,
          status: 'safe',
          itemsCount,
          hasBudget: false,
        },
      });
    }

    const remaining = calculateRemaining(budget.amount, budget.spent);
    const percentage = calculatePercentage(budget.spent, budget.amount);
    const status = getBudgetStatus(percentage);

    res.json({
      success: true,
      message: 'Plan summary retrieved',
      data: {
        totalBudget: budget.amount,
        spent: budget.spent,
        totalPlanned,
        remaining,
        percentage,
        status,
        itemsCount,
        hasBudget: true,
        budgetId: budget._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPlan,
  addToPlan,
  removeFromPlan,
  getPlanSummary,
};

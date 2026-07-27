// متحكم الميزانية

const Budget = require('../models/Budget');
const PlanItem = require('../models/PlanItem');
const Activity = require('../models/Activity');
const { calculateRemaining, calculatePercentage, getBudgetStatus } = require('../utils/budgetCalculator');

// 1. إنشاء ميزانية جديدة
const createBudget = async (req, res, next) => {
  try {
    const { amount, period, currency } = req.body;
    
    await Budget.updateMany(
      { userId: req.user._id, isActive: true },
      { $set: { isActive: false } }
    );

    const Plan = require('../models/Plan');
    const userPlan = await Plan.findOne({ userId: req.user._id });
    const currentSpent = userPlan ? userPlan.totalPlanned : 0;

    if (amount < currentSpent) {
      return res.status(400).json({
        success: false,
        message: `Cannot set budget to ${amount} EGP because you already have ${currentSpent} EGP planned.`
      });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      amount,
      period,
      currency: currency || 'EGP',
      spent: currentSpent,
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Budget created', data: budget });
  } catch (error) {
    next(error);
  }
};

// 2. جلب ميزانية المستخدم الحالية
const getMyBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ userId: req.user._id, isActive: true });
    
    if (!budget) {
      return res.json({ success: true, message: 'No active budget', data: { hasBudget: false } });
    }

    const percentage = calculatePercentage(budget.spent, budget.amount);
    const remaining = calculateRemaining(budget.amount, budget.spent);
    const status = getBudgetStatus(percentage);

    res.json({
      success: true,
      message: 'Budget retrieved',
      data: {
        ...budget.toObject(),
        percentage,
        remaining,
        status,
        hasBudget: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. تحديث الميزانية
const updateBudget = async (req, res, next) => {
  try {
    const { amount, period } = req.body;
    
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });

    if (!budget) {
      res.status(404);
      throw new Error('Budget not found');
    }

    if (amount !== undefined) {
      if (amount < budget.spent) {
        return res.status(400).json({
          success: false,
          message: `Cannot update budget to ${amount} EGP because you already spent ${budget.spent} EGP.`
        });
      }
      budget.amount = amount;
    }
    if (period !== undefined) budget.period = period;
    
    await budget.save();

    res.json({ success: true, message: 'Budget updated', data: budget });
  } catch (error) {
    next(error);
  }
};

// 4. جلب إحصائيات الميزانية
const getBudgetStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    
    // Parse query params, fallback to current month/year if not provided
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const budget = await Budget.findOne({ userId: req.user._id, isActive: true });
    
    // Create date boundaries for the selected month
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    const queryFilter = { 
      userId: req.user._id,
      addedAt: { $gte: startOfMonth, $lte: endOfMonth }
    };

    const planItems = await PlanItem.find(queryFilter).populate('activityId');
    
    let totalSpent = 0;
    const categoryTotals = {};
    const chartDataMap = {};
    
    // Setup daily breakdown for the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayKey = `${monthName} ${i}`;
      chartDataMap[dayKey] = { spent: 0, budget: budget ? budget.amount : 0 };
    }

    planItems.forEach(item => {
      const category = item.activityId && item.activityId.category ? item.activityId.category : 'other';
      const price = item.price || 0;
      
      if (!categoryTotals[category]) categoryTotals[category] = 0;
      categoryTotals[category] += price;
      totalSpent += price;

      if (item.addedAt) {
        const itemDate = new Date(item.addedAt);
        const dayKey = `${itemDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${itemDate.getDate()}`;
        if (chartDataMap[dayKey]) {
          chartDataMap[dayKey].spent += price;
        }
      }
    });

    const categories = Object.keys(categoryTotals).map(category => {
      const spent = categoryTotals[category];
      return {
        category,
        spent,
        percentage: calculatePercentage(spent, totalSpent)
      };
    });

    const recentItems = await PlanItem.find(queryFilter)
      .sort({ addedAt: -1 })
      .limit(5)
      .populate('activityId');
      
    const recentExpenses = recentItems.map(item => ({
      id: item._id,
      title: item.title || (item.activityId ? item.activityId.title : 'Unknown Activity'),
      price: item.price,
      date: item.addedAt
    }));

    const chartData = Object.entries(chartDataMap).map(([name, val]) => ({
      name,
      spent: val.spent,
      budget: val.budget
    }));

    // Previous month comparison
    const startOfPrevMonth = new Date(selectedYear, selectedMonth - 2, 1);
    const endOfPrevMonth = new Date(selectedYear, selectedMonth - 1, 0, 23, 59, 59, 999);
    
    const prevItems = await PlanItem.find({
      userId: req.user._id,
      addedAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
    });
    
    const prevTotalSpent = prevItems.reduce((acc, item) => acc + (item.price || 0), 0);
    
    let percentageChange = 0;
    if (prevTotalSpent > 0) {
      percentageChange = Math.round(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100);
    } else if (totalSpent > 0) {
      percentageChange = 100;
    }

    const comparison = {
      lastMonthSpent: prevTotalSpent,
      percentageChange
    };

    res.json({
      success: true,
      message: 'Budget stats retrieved',
      data: {
        totalSpent,
        categories,
        recentExpenses,
        chartData,
        comparison
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. جلب نصائح الميزانية
const getBudgetTips = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ userId: req.user._id, isActive: true });
    
    let status = 'safe';
    if (budget) {
      const percentage = calculatePercentage(budget.spent, budget.amount);
      status = getBudgetStatus(percentage);
    }

    let tips = [];
    
    if (status === 'safe') {
      tips = [
        'tipSafe1',
        'tipSafe2',
        'tipSafe3'
      ];
    } else if (status === 'warning') {
      tips = [
        'tipWarning1',
        'tipWarning2',
        'tipWarning3'
      ];
    } else {
      tips = [
        'tipDanger1',
        'tipDanger2',
        'tipDanger3'
      ];
    }

    res.json({ success: true, message: 'Tips retrieved', data: { status, tips } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getMyBudget,
  updateBudget,
  getBudgetStats,
  getBudgetTips
};

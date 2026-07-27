// أداة حساب الميزانية - تحتوي على دوال مساعدة لحسابات الميزانية المختلفة

// دالة حساب المبلغ المتبقي من الميزانية
const calculateRemaining = (amount, spent) => {
  return amount - spent;
};

// دالة حساب نسبة الإنفاق من الميزانية
const calculatePercentage = (spent, amount) => {
  if (amount === 0) return 0;
  return Math.round((spent / amount) * 100);
};

// دالة تحديد حالة الميزانية بناءً على نسبة الإنفاق
const getBudgetStatus = (percentage) => {
  if (percentage < 70) return 'safe';
  if (percentage <= 90) return 'warning';
  return 'danger';
};

module.exports = {
  calculateRemaining,
  calculatePercentage,
  getBudgetStatus,
};

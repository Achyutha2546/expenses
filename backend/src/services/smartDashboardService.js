const Transaction = require('../models/transactionModel');
const Budget = require('../models/budgetModel');

/**
 * Helper to compute spending insights (same as analyticsController.getSpendingInsights)
 */
const computeInsights = async (userId) => {
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // current month total expense
  const currentMonthAgg = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: firstDayCurrentMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const current = currentMonthAgg[0]?.total || 0;

  // top category this month
  const topCategoryAgg = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: firstDayCurrentMonth } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ]);
  const topCategory = topCategoryAgg[0]?._id || 'General';

  // previous month total expense
  const prevMonthAgg = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: firstDayPrevMonth, $lte: lastDayPrevMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const previous = prevMonthAgg[0]?.total || 0;

  let changePercent = 0;
  let message = '';
  let trend = 'neutral';
  if (previous > 0) {
    changePercent = ((current - previous) / previous) * 100;
    if (changePercent > 10) {
      message = `Spending is up by ${Math.abs(changePercent).toFixed(0)}% MoM. ${topCategory} is your biggest expense.`;
      trend = 'up';
    } else if (changePercent < -10) {
      message = `Great! Spending is down ${Math.abs(changePercent).toFixed(0)}%. You're saving more this month!`;
      trend = 'down';
    } else {
      message = `Your spending is stable. ${topCategory} remains your primary expense at ₹${topCategoryAgg[0]?.total?.toLocaleString()}.`;
    }
  } else {
    message = current > 0 ? `${topCategory} is your top category so far. Keep tracking to see MoM trends!` : 'Start tracking to see your spending insights.';
  }

  return { currentMonthTotal: current, prevMonthTotal: previous, changePercent, message, trend, topCategory, topCategoryAmount: topCategoryAgg[0]?.total || 0 };
};

/**
 * Main smart dashboard payload
 */
const getSmartDashboard = async (userId) => {
  // Budget aggregation (same as budgetController)
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();

  const budget = await Budget.findOne({ userId, month: m, year: y });
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const spentAgg = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalSpent = spentAgg[0]?.total || 0;
  const limit = budget?.amount || 0;
  const percentUsed = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;
  const isOverBudget = totalSpent > limit && limit > 0;

  // Insights
  const insights = await computeInsights(userId);

  // Actionable messages
  const actions = [];
  if (percentUsed >= 80 && percentUsed < 100) actions.push('You are close to your budget limit');
  if (percentUsed >= 100) actions.push('You have exceeded your budget – consider cutting back');
  if (insights.topCategory?.toLowerCase() === 'food' && percentUsed >= 80) actions.push('Reduce food spending to stay within budget');

  return {
    budget: { amount: limit, totalSpent, remaining: Math.max(0, limit - totalSpent), percentUsed, isOverBudget },
    insights,
    actions,
  };
};

module.exports = { getSmartDashboard };

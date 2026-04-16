const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

/**
 * @desc    Get total expenses grouped by category
 * @route   GET /api/analytics/category-summary
 * @access  Private
 */
const getCategorySummary = async (req, res) => {
    try {
        const categorySummary = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    type: 'expense'
                }
            },
            {
                $group: {
                    _id: { $toLower: '$category' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            },
            {
                $project: {
                    category: '$_id',
                    totalAmount: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json(categorySummary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get monthly income vs expenses for the last 6 months
 * @route   GET /api/analytics/monthly-summary
 * @access  Private
 */
const getMonthlySummary = async (req, res) => {
    try {
        // Calculate the date 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySummary = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    totalIncome: 1,
                    totalExpense: 1,
                    _id: 0
                }
            }
        ]);

        res.json(monthlySummary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get spending insights (MoM comparison)
 * @route   GET /api/analytics/insights
 * @access  Private
 */
const getSpendingInsights = async (req, res) => {
    try {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthTotal = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    type: 'expense',
                    date: { $gte: firstDayCurrentMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const topCategoryData = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    type: 'expense',
                    date: { $gte: firstDayCurrentMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);

        const prevMonthTotal = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    type: 'expense',
                    date: { $gte: firstDayPrevMonth, $lte: lastDayPrevMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const current = currentMonthTotal[0]?.total || 0;
        const previous = prevMonthTotal[0]?.total || 0;
        const topCategory = topCategoryData[0]?._id || 'General';
        const topCategoryAmount = topCategoryData[0]?.total || 0;
        
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
                message = `Your spending is stable. ${topCategory} remains your primary expense at ₹${topCategoryAmount.toLocaleString()}.`;
                trend = 'neutral';
            }
        } else {
            message = current > 0 ? `${topCategory} is your top category so far. Keep tracking to see MoM trends!` : "Start tracking to see your spending insights.";
        }

        res.json({
            currentMonthTotal: current,
            prevMonthTotal: previous,
            changePercent,
            message,
            trend,
            topCategory,
            topCategoryAmount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategorySummary,
    getMonthlySummary,
    getSpendingInsights
};

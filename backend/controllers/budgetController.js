const Budget = require('../models/budgetModel');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');

/**
 * @desc    Get budget and current spending for a specific month/year
 * @route   GET /api/get-budget
 * @access  Private
 */
const getBudget = async (req, res) => {
    try {
        const { month, year } = req.query;
        // Default to current month/year if not provided (UTC)
        const now = new Date();
        const m = month ? parseInt(month) : now.getUTCMonth() + 1;
        const y = year ? parseInt(year) : now.getUTCFullYear();

        // 1. Get the budget limit
        const budget = await Budget.findOne({
            userId: req.user.uid,
            month: m,
            year: y
        });

        // 2. Calculate total expenses using aggregation
        const startDate = new Date(Date.UTC(y, m - 1, 1));
        const endDate = new Date(Date.UTC(y, m, 1));

        const totalSpentResult = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    type: 'expense',
                    date: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalSpent = totalSpentResult[0]?.total || 0;
        const limit = budget?.amount || 0;
        const percentUsed = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;
        
        // Fetch User to get balance
        const user = await User.findOne({ uid: req.user.uid });
        const userBalance = user?.balance || 0;

        res.json({
            amount: limit,
            month: m,
            year: y,
            totalSpent,
            remaining: Math.max(0, limit - totalSpent),
            percentUsed,
            isOverBudget: limit > 0 && totalSpent > limit,
            userBalance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Set or update budget for current month/year
 * @route   POST /api/set-budget
 * @access  Private
 */
const setBudget = async (req, res) => {
    try {
        const { amount, month, year } = req.body;
        
        // Default to current month/year (UTC) and validate amount
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Budget amount must be a positive number' });
        }
        const now = new Date();
        const m = month ? parseInt(month) : now.getUTCMonth() + 1;
        const y = year ? parseInt(year) : now.getUTCFullYear();

        // Upsert budget
        const budget = await Budget.findOneAndUpdate(
            { userId: req.user.uid, month: m, year: y },
            { amount },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBudget,
    setBudget
};

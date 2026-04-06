const Budget = require('../models/budgetModel');

/**
 * @desc    Get budget for a specific month/year
 * @route   GET /api/budget
 * @access  Private
 */
const getBudget = async (req, res) => {
    try {
        const { month, year } = req.query;
        // Default to current month/year if not provided
        const m = month ? parseInt(month) : new Date().getMonth() + 1;
        const y = year ? parseInt(year) : new Date().getFullYear();

        const budget = await Budget.findOne({
            userId: req.user.uid,
            month: m,
            year: y
        });

        res.json(budget || { amount: 0, month: m, year: y });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Set or update budget for current month/year
 * @route   POST /api/budget
 * @access  Private
 */
const setBudget = async (req, res) => {
    try {
        const { amount, month, year } = req.body;
        
        const m = month ? parseInt(month) : new Date().getMonth() + 1;
        const y = year ? parseInt(year) : new Date().getFullYear();

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

const SavingsGoal = require('../models/savingsGoalModel');

/**
 * @desc    Get all savings goals for the user
 * @route   GET /api/goals
 * @access  Private
 */
const getGoals = async (req, res) => {
    try {
        const goals = await SavingsGoal.find({ userId: req.user.uid })
            .sort({ isCompleted: 1, deadline: 1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Create a new savings goal
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = async (req, res) => {
    try {
        const { name, targetAmount, deadline, icon, color } = req.body;

        if (!name || !targetAmount || !deadline) {
            return res.status(400).json({ message: 'Name, target amount, and deadline are required.' });
        }

        const goal = await SavingsGoal.create({
            userId: req.user.uid,
            name,
            targetAmount,
            deadline: new Date(deadline),
            icon: icon || '🎯',
            color: color || '#6366f1'
        });

        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Add a contribution to a savings goal
 * @route   POST /api/goals/:id/contribute
 * @access  Private
 */
const addContribution = async (req, res) => {
    try {
        const { amount, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Contribution amount must be positive.' });
        }

        const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.uid });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found.' });
        }

        if (goal.isCompleted) {
            return res.status(400).json({ message: 'This goal is already completed.' });
        }

        goal.savedAmount += amount;
        goal.contributions.push({ amount, note: note || '' });

        // Check if goal is now complete
        if (goal.savedAmount >= goal.targetAmount) {
            goal.isCompleted = true;
            goal.completedAt = new Date();
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update a savings goal
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = async (req, res) => {
    try {
        const { name, targetAmount, deadline, icon, color } = req.body;

        const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.uid });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found.' });
        }

        if (name) goal.name = name;
        if (targetAmount) goal.targetAmount = targetAmount;
        if (deadline) goal.deadline = new Date(deadline);
        if (icon) goal.icon = icon;
        if (color) goal.color = color;

        // Re-check completion status if target changed
        if (goal.savedAmount >= goal.targetAmount && !goal.isCompleted) {
            goal.isCompleted = true;
            goal.completedAt = new Date();
        } else if (goal.savedAmount < goal.targetAmount && goal.isCompleted) {
            goal.isCompleted = false;
            goal.completedAt = null;
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete a savings goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
const deleteGoal = async (req, res) => {
    try {
        const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found.' });
        }
        res.json({ message: 'Goal deleted.', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGoals,
    createGoal,
    addContribution,
    updateGoal,
    deleteGoal
};

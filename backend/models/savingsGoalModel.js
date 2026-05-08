const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Goal name is required'],
        trim: true,
        maxlength: 50
    },
    targetAmount: {
        type: Number,
        required: [true, 'Target amount is required'],
        min: [1, 'Target must be at least ₹1']
    },
    savedAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    icon: {
        type: String,
        default: '🎯'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    // Track individual contributions for history
    contributions: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, default: '' }
    }]
}, { timestamps: true });

// Virtual: progress percentage
savingsGoalSchema.virtual('progress').get(function() {
    if (this.targetAmount === 0) return 100;
    return Math.min((this.savedAmount / this.targetAmount) * 100, 100);
});

// Virtual: days remaining
savingsGoalSchema.virtual('daysRemaining').get(function() {
    const now = new Date();
    const diff = this.deadline - now;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

// Virtual: required daily savings to hit goal
savingsGoalSchema.virtual('dailyTarget').get(function() {
    const remaining = this.targetAmount - this.savedAmount;
    if (remaining <= 0) return 0;
    const days = this.daysRemaining;
    if (days <= 0) return remaining;
    return Math.ceil(remaining / days);
});

// Ensure virtuals are included in JSON output
savingsGoalSchema.set('toJSON', { virtuals: true });
savingsGoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);

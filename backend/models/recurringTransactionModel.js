const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    source: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        enum: ['weekly', 'monthly'],
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    lastGeneratedDate: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: [true, 'Firebase UID is required'],
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    photoURL: {
        type: String,
        default: ''
    },
    balance: {
        type: Number,
        default: 0
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    fcmTokens: [{
        token: { type: String, required: true },
        device: { type: String, default: 'unknown' },
        createdAt: { type: Date, default: Date.now }
    }],
    notificationPrefs: {
        budgetWarning: { type: Boolean, default: true },
        budgetExceeded: { type: Boolean, default: true },
        dailyReminder: { type: Boolean, default: true },
        reminderTime: { type: String, default: '20:00' }
    },
    lastTransactionAt: {
        type: Date,
        default: null
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    },
    notifiedBudgetThresholds: {
        type: Map,
        of: Boolean,
        default: new Map()
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true, unique: true },
    lockType: { type: String, enum: ['pin', 'pattern'], required: true },
    pinHash: { type: String },
    pattern: { type: String }, // e.g. "0-2-4-6"
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    securityQuestion: { type: String },
    securityAnswerHash: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Lock', lockSchema);

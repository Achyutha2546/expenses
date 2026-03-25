const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Source',
        required: [true, 'Source (Account) is required']
    },
    toSourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Source',
        required: function () { return this.type === 'transfer'; }
    },
    purpose: {
        type: String,
        required: function () { return this.type === 'expense'; },
        trim: true
    },
    source: {
        type: String,
        required: function () { return this.type === 'income'; },
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);

const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addTransaction = async (req, res) => {
    const { type, amount, category, date, purpose, source, sourceId, toSourceId } = req.body;

    try {
        // For transfers, create TWO transactions so both source balances update correctly:
        // 1. An expense from the source (debit)
        // 2. An income to the destination (credit)
        if (type === 'transfer') {
            const transferId = new mongoose.Types.ObjectId();

            const [debit, credit] = await Promise.all([
                Transaction.create({
                    userId: req.user._id,
                    type: 'transfer',
                    amount,
                    date,
                    sourceId,
                    toSourceId,
                    transferId,
                    purpose: 'Transfer Out',
                }),
                Transaction.create({
                    userId: req.user._id,
                    type: 'transfer',
                    amount,
                    date,
                    sourceId: toSourceId,
                    toSourceId: sourceId,
                    transferId,
                    purpose: 'Transfer In',
                }),
            ]);

            return res.status(201).json({ debit, credit });
        }

        // Normal income/expense
        const transaction = await Transaction.create({
            userId: req.user._id,
            type,
            amount,
            category,
            date,
            purpose,
            source,
            sourceId,
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // If this is part of a transfer, delete both legs
        if (transaction.transferId) {
            await Transaction.deleteMany({ transferId: transaction.transferId });
        } else {
            await transaction.deleteOne();
        }

        res.json({ message: 'Transaction removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
};

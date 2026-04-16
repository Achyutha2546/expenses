const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

const getTransactions = async (req, res) => {
    try {
        const { startDate, endDate, category, type, search } = req.query;
        let query = { userId: req.user.uid };

        // Date Range Filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Category Filter
        if (category && category !== 'all') {
            query.category = { $regex: new RegExp(category, 'i') };
        }

        // Type Filter
        if (type && type !== 'all') {
            query.type = type;
        }

        // Search Query (matches purpose or source)
        if (search) {
            query.$or = [
                { purpose: { $regex: new RegExp(search, 'i') } },
                { source: { $regex: new RegExp(search, 'i') } }
            ];
        }

        const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).lean();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addTransaction = async (req, res) => {
    const { type, amount, category, date, purpose, source, sourceId, toSourceId } = req.body;

    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 1. Balance validation
        if (type === 'expense' && amount > user.balance) {
            return res.status(400).json({ success: false, message: 'Insufficient Funds' });
        }

        // For transfers, create TWO transactions so both source balances update correctly:
        if (type === 'transfer') {
            const transferId = new mongoose.Types.ObjectId();

            const [debit, credit] = await Promise.all([
                Transaction.create({
                    userId: req.user.uid,
                    type: 'transfer',
                    amount,
                    date,
                    sourceId,
                    toSourceId,
                    transferId,
                    purpose: 'Transfer Out',
                }),
                Transaction.create({
                    userId: req.user.uid,
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
            userId: req.user.uid,
            type,
            amount,
            category,
            date,
            purpose,
            source,
            sourceId,
        });

        // 2. Update balance
        if (type === 'income') {
            user.balance += Number(amount);
        } else if (type === 'expense') {
            user.balance -= Number(amount);
        }
        await user.save();

        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateTransaction = async (req, res) => {
    const { type, amount, category, date, purpose, source, sourceId, toSourceId } = req.body;

    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.userId !== req.user.uid) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const wasTransfer = transaction.type === 'transfer' && transaction.transferId;
        const isTransfer = type === 'transfer';

        // CASE 1: Transfer -> Transfer
        if (wasTransfer && isTransfer) {
            const transferId = transaction.transferId;

            // Update both legs
            const [debit, credit] = await Promise.all([
                Transaction.findOneAndUpdate(
                    { transferId, purpose: 'Transfer Out' },
                    { amount, date, sourceId, toSourceId },
                    { new: true }
                ),
                Transaction.findOneAndUpdate(
                    { transferId, purpose: 'Transfer In' },
                    { amount, date, sourceId: toSourceId, toSourceId: sourceId },
                    { new: true }
                )
            ]);

            return res.json(transaction.purpose === 'Transfer In' ? credit : debit);
        }

        // CASE 2: Transfer -> Something Else (Income/Expense)
        if (wasTransfer && !isTransfer) {
            const transferId = transaction.transferId;

            // Delete the other leg
            await Transaction.deleteMany({ transferId, _id: { $ne: transaction._id } });

            // Update current record to new type and remove transfer metadata
            const updated = await Transaction.findByIdAndUpdate(
                req.params.id,
                { type, amount, category, date, purpose, source, sourceId, $unset: { toSourceId: '', transferId: '' } },
                { new: true }
            );
            return res.json(updated);
        }

        // CASE 3: Something Else -> Transfer
        if (!wasTransfer && isTransfer) {
            const transferId = new mongoose.Types.ObjectId();

            // Update current record to be the "Transfer Out" leg
            const debit = await Transaction.findByIdAndUpdate(
                req.params.id,
                { type, amount, date, sourceId, toSourceId, transferId, purpose: 'Transfer Out', $unset: { category: '', source: '' } },
                { new: true }
            );

            // Create the "Transfer In" leg
            await Transaction.create({
                userId: req.user.uid,
                type: 'transfer',
                amount,
                date,
                sourceId: toSourceId,
                toSourceId: sourceId,
                transferId,
                purpose: 'Transfer In',
            });

            return res.json(debit);
        }

        // CASE 4: Normal Update (Income -> Income, Expense -> Income, etc.)
        const user = await User.findOne({ uid: req.user.uid });
        if (user) {
            let newBalance = user.balance;
            
            // Revert old transaction
            if (transaction.type === 'income') newBalance -= transaction.amount;
            else if (transaction.type === 'expense') newBalance += transaction.amount;
            
            // Apply new transaction
            if (type === 'income') newBalance += Number(amount);
            else if (type === 'expense') newBalance -= Number(amount);
            
            if (newBalance < 0) {
                return res.status(400).json({ success: false, message: 'Insufficient Funds: Update would result in negative balance' });
            }
            
            user.balance = newBalance;
            await user.save();
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

        if (transaction.userId !== req.user.uid) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // If this is part of a transfer, delete both legs
        if (transaction.transferId) {
            await Transaction.deleteMany({ transferId: transaction.transferId });
        } else {
            const user = await User.findOne({ uid: req.user.uid });
            if (user) {
                let newBalance = user.balance;
                if (transaction.type === 'income') newBalance -= transaction.amount;
                else if (transaction.type === 'expense') newBalance += transaction.amount;
                
                if (newBalance < 0) {
                    return res.status(400).json({ success: false, message: 'Cannot delete income: Insufficient Funds' });
                }
                
                user.balance = newBalance;
                await user.save();
            }
            await transaction.deleteOne();
        }

        res.json({ message: 'Transaction removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Export transactions to CSV
 * @route   GET /api/transactions/export
 * @access  Private
 */


const exportTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.uid })
            .sort({ date: -1 })
            .populate('sourceId', 'name');

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for export' });
        }

        const fields = [
            { label: 'Date', value: (row) => new Date(row.date).toLocaleDateString() },
            { label: 'Type', value: 'type' },
            { label: 'Amount (₹)', value: 'amount' },
            { label: 'Category', value: 'category' },
            { label: 'Source/Account', value: (row) => row.sourceId?.name || (row.type === 'income' ? (row.source || '') : 'N/A') },
            { label: 'Purpose/From', value: (row) => row.purpose || (row.type === 'income' ? (row.source || '') : '') }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(transactions);

        res.header('Content-Type', 'text/csv');
        res.attachment(`expenses_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions
};

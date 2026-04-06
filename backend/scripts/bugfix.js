const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Transaction = require('../models/transactionModel');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function bugfix() {
    try {
        await mongoose.connect(MONGODB_URI);
        const transactions = await Transaction.find().lean();
        const userIds = new Set();
        transactions.forEach(t => {
            const val = t.userId;
            const type = typeof val;
            const isObjId = mongoose.Types.ObjectId.isValid(val);
            userIds.add(`${val} | Type: ${type} | isObjId: ${isObjId}`);
        });

        console.log('--- ALL UNIQUE USER IDS IN TRANSACTIONS ---');
        userIds.forEach(id => console.log(id));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

bugfix();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function audit() {
    try {
        await mongoose.connect(MONGODB_URI);
        const users = await User.find();
        const userMap = users.reduce((map, u) => {
            map[u._id.toString()] = u.email;
            if (u.uid) map[u.uid] = u.email;
            return map;
        }, {});

        const transactions = await Transaction.find().lean();
        const stats = {};
        transactions.forEach(t => {
            const uidStr = t.userId ? t.userId.toString() : 'null';
            stats[uidStr] = (stats[uidStr] || 0) + 1;
        });

        console.log('--- TRANSACTION COUNTS BY userId ---');
        Object.entries(stats).forEach(([uid, count]) => {
            const email = userMap[uid] || 'UNKNOWN';
            console.log(`userId: ${uid}, count: ${count}, email: ${email}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

audit();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Source = require('../models/sourceModel');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const users = await User.find();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`_id: ${u._id}, uid: ${u.uid}, email: ${u.email}`));

        const transactions = await Transaction.find().limit(5);
        console.log('\n--- TRANSACTIONS (First 5) ---');
        transactions.forEach(t => console.log(`userId: ${t.userId}, amount: ${t.amount}, purpose: ${t.purpose}`));

        const sources = await Source.find().limit(5);
        console.log('\n--- SOURCES (First 5) ---');
        sources.forEach(s => console.log(`userId: ${s.userId}, name: ${s.name}`));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();

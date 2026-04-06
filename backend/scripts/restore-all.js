const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Transaction = require('../models/transactionModel');
const Source = require('../models/sourceModel');
const User = require('../models/userModel');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function restoreAll() {
    console.log('--- Brute Force Restoration Starting ---');
    try {
        await mongoose.connect(MONGODB_URI);
        
        // Find the only user we have
        const user = await User.findOne({ email: 'mani@gmail.com' });
        if (!user || !user.uid) {
            console.error('❌ User mani@gmail.com not found or has no Firebase UID!');
            return;
        }

        const newUid = user.uid;
        console.log(`Setting all records to userId: ${newUid}...`);

        const tResult = await Transaction.updateMany(
            { userId: { $ne: newUid } }, 
            { $set: { userId: newUid } }
        );
        console.log(`✅ ${tResult.modifiedCount} Transactions restored.`);

        const sResult = await Source.updateMany(
            { userId: { $ne: newUid } }, 
            { $set: { userId: newUid } }
        );
        console.log(`✅ ${sResult.modifiedCount} Sources restored.`);

        console.log('\n--- Restoration Complete ---');
    } catch (e) {
        console.error('❌ Brute force restoration failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

restoreAll();

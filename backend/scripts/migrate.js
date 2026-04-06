const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Source = require('../models/sourceModel');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function migrate() {
    console.log('--- Data Migration Starting ---');
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find all users that HAVE a Firebase UID
        const users = await User.find({ uid: { $exists: true } });
        console.log(`🔍 Found ${users.length} users with Firebase UIDs.`);

        for (const user of users) {
            console.log(`\n--- Migrating Data for: ${user.email} ---`);
            
            // 2. Update Transactions by mapping old ObjectId to new String UID
            // We search for both the ObjectId and any legacy string IDs
            const tResult = await Transaction.updateMany(
                { userId: user._id }, 
                { $set: { userId: user.uid } }
            );
            console.log(`✅ Transactions updated: ${tResult.modifiedCount}`);

            // 3. Update Sources
            const sResult = await Source.updateMany(
                { userId: user._id }, 
                { $set: { userId: user.uid } }
            );
            console.log(`✅ Sources updated: ${sResult.modifiedCount}`);
        }

        console.log('\n--- Migration Complete ---');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

migrate();

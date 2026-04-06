const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Transaction = require('../models/transactionModel');
const Source = require('../models/sourceModel');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function restore() {
    console.log('--- Final Data Restoration Starting ---');
    try {
        await mongoose.connect(MONGODB_URI);
        
        // The CORRECT orphaned ID found from bugfix.js
        const oldId = '698b3c095fe6f29d35d633bd';
        // Your current Firebase UID (mani@gmail.com)
        const newUid = 'H9qV3xmoxicHwqGjvsHHW1HymFJo2';

        console.log(`Mapping records belonging to ${oldId} to new Firebase UID ${newUid}...`);

        const query = { 
            $or: [
                { userId: oldId },
                { userId: new mongoose.Types.ObjectId(oldId) }
            ] 
        };

        const tResult = await Transaction.updateMany(
            query, 
            { $set: { userId: newUid } }
        );
        console.log(`✅ ${tResult.modifiedCount} Transactions restored.`);

        const sResult = await Source.updateMany(
            query, 
            { $set: { userId: newUid } }
        );
        console.log(`✅ ${sResult.modifiedCount} Sources restored.`);

        console.log('\n--- Restoration Complete ---');
    } catch (e) {
        console.error('❌ Restoration failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

restore();

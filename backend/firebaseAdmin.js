const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let serviceAccount;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Support for Render/Production via environment variable
        let saValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        // 1. Remove wrapping quotes if present
        if ((saValue.startsWith('"') && saValue.endsWith('"')) || 
            (saValue.startsWith("'") && saValue.endsWith("'"))) {
            saValue = saValue.slice(1, -1).trim();
        }

        // 2. Detect and decode Base64
        if (!saValue.startsWith('{') && !saValue.startsWith('[')) {
            try {
                const decoded = Buffer.from(saValue, 'base64').toString('utf8');
                if (decoded.trim().startsWith('{')) {
                    saValue = decoded.trim();
                }
            } catch (e) { /* Not base64, continue */ }
        }

        // 3. Parse the JSON
        try {
            serviceAccount = JSON.parse(saValue);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError.message);
            // Log first few chars to help identify the issue (safe part of Firebase JSON)
            console.error('   String starts with:', saValue.substring(0, 50).replace(/\n/g, '\\n') + '...');
            throw parseError;
        }

        // 5. Handle double-stringification
        if (typeof serviceAccount === 'string') {
            serviceAccount = JSON.parse(serviceAccount);
        }
    } else {
        // Fallback for local development
        const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
        serviceAccount = require(serviceAccountPath);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('⚠️  Firebase Admin SDK initialization failed.');
    console.error('   Error:', error.message);
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.error('   Check if FIREBASE_SERVICE_ACCOUNT environment variable is a valid JSON string.');
    } else {
        console.error('   Make sure serviceAccountKey.json exists in the backend/ directory.');
        console.error('   Download it from: Firebase Console → Project Settings → Service Accounts');
    }
    process.exit(1);
}

module.exports = admin;

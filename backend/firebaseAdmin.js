const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let serviceAccount;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Support for Render/Production via environment variable
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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

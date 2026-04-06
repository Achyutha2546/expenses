const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// You need to download the service account key from:
// Firebase Console → Project Settings → Service Accounts → Generate New Private Key
// Save the JSON file as backend/serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('⚠️  Firebase Admin SDK initialization failed.');
    console.error('   Make sure serviceAccountKey.json exists in the backend/ directory.');
    console.error('   Download it from: Firebase Console → Project Settings → Service Accounts');
    process.exit(1);
}

module.exports = admin;

const jwt = require('jsonwebtoken');
const admin = require('../firebaseAdmin');
const User = require('../models/userModel');

const generateToken = (uid) => {
    return jwt.sign({ uid }, process.env.JWT_SECRET || 'your_super_secret_key_here', {
        expiresIn: '30d',
    });
};

// Google Sign-In: verify Firebase ID token, upsert user in MongoDB, return JWT
const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: 'Firebase ID token is required' });
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        if (!email) {
            return res.status(400).json({ message: 'Email not available from Google account' });
        }

        // Find user by UID (preferred) OR Email
        let user = await User.findOne({ $or: [{ uid }, { email }] });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = await User.create({
                uid,
                email,
                name: name || email.split('@')[0],
                photoURL: picture || ''
            });
        } else {
            // Update user with UID if it was found via email (migration)
            // or just update standard profile fields
            user.uid = uid;
            user.email = email;
            user.name = name || user.name;
            user.photoURL = picture || user.photoURL;
            await user.save();
        }

        res.json({
            uid: user.uid,
            email: user.email,
            name: user.name,
            photoURL: user.photoURL,
            isNewUser,
            token: generateToken(user.uid),
        });
    } catch (error) {
        console.error('Google login error:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Firebase token expired. Please sign in again.' });
        }
        if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
            return res.status(401).json({ message: 'Invalid Firebase token.' });
        }
        res.status(500).json({ message: 'Authentication failed. Please try again.' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.uid });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const Transaction = require('../models/transactionModel');
        const Source = require('../models/sourceModel');

        // Delete all associated data
        await Transaction.deleteMany({ userId: req.user.uid });
        await Source.deleteMany({ userId: req.user.uid });

        // Delete the user from MongoDB
        await user.deleteOne();

        // Optionally delete the user from Firebase Auth as well
        try {
            await admin.auth().deleteUser(req.user.uid);
        } catch (fbError) {
            console.error('Failed to delete Firebase user (non-critical):', fbError);
        }

        res.json({ message: 'Account and all data permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { googleLogin, deleteAccount };

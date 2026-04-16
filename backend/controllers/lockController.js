const Lock = require('../models/lockModel');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/emailService');

const setLock = async (req, res) => {
    const { lockType, pin, pattern } = req.body;
    try {
        let lock = await Lock.findOne({ userId: req.user.uid });
        if (!lock) {
            lock = new Lock({ userId: req.user.uid });
        }
        
        lock.lockType = lockType;
        lock.failedAttempts = 0;
        lock.lockedUntil = null;

        if (lockType === 'pin') {
            if (!pin || pin.length < 4 || pin.length > 6) {
                return res.status(400).json({ message: 'Invalid PIN length' });
            }
            const salt = await bcrypt.genSalt(10);
            lock.pinHash = await bcrypt.hash(pin, salt);
            lock.pattern = undefined;
        } else if (lockType === 'pattern') {
            if (!pattern || pattern.length < 3) {
                return res.status(400).json({ message: 'Invalid pattern' });
            }
            lock.pattern = pattern;
            lock.pinHash = undefined;
        }

        await lock.save();
        res.status(200).json({ message: 'Lock updated successfully', lockType, pinHash: lock.pinHash, pattern: lock.pattern });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyLock = async (req, res) => {
    const { pin, pattern } = req.body;
    try {
        const lock = await Lock.findOne({ userId: req.user.uid });
        if (!lock) {
            return res.status(200).json({ success: true, message: 'No lock configured' });
        }

        if (lock.lockedUntil && new Date() < lock.lockedUntil) {
            const remaining = Math.ceil((lock.lockedUntil - new Date()) / 1000);
            return res.status(403).json({ success: false, message: `Too many failed attempts. Try again in ${remaining}s.`, locked: true });
        }

        let isValid = false;
        if (lock.lockType === 'pin' && pin) {
            isValid = await bcrypt.compare(pin, lock.pinHash);
        } else if (lock.lockType === 'pattern' && pattern) {
            isValid = lock.pattern === pattern;
        }

        if (isValid) {
            lock.failedAttempts = 0;
            lock.lockedUntil = null;
            await lock.save();
            return res.status(200).json({ success: true });
        } else {
            lock.failedAttempts += 1;
            if (lock.failedAttempts >= 3) {
                lock.lockedUntil = new Date(Date.now() + 60 * 1000); // 60s
            }
            await lock.save();
            return res.status(401).json({ success: false, message: 'Invalid security input' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getLockStatus = async (req, res) => {
    try {
         const lock = await Lock.findOne({ userId: req.user.uid });
         if (!lock) return res.json({ hasLock: false });
         // Return hash and pattern so that the PWA can safely cache them for OFFLINE fallback checking ONLY
         res.json({ 
            hasLock: true, 
            lockType: lock.lockType, 
            pinHash: lock.pinHash, 
            pattern: lock.pattern,
            hasRecovery: !!lock.securityQuestion,
            securityQuestion: lock.securityQuestion
         });
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

const removeLock = async (req, res) => {
    try {
        await Lock.findOneAndDelete({ userId: req.user.uid });
        res.json({ message: 'Lock removed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const setRecovery = async (req, res) => {
    const { question, answer } = req.body;
    try {
        const lock = await Lock.findOne({ userId: req.user.uid });
        if (!lock) return res.status(404).json({ message: 'Lock not found' });
        if (!question || !answer) return res.status(400).json({ message: 'Question and answer required.' });

        const salt = await bcrypt.genSalt(10);
        lock.securityQuestion = question;
        lock.securityAnswerHash = await bcrypt.hash(answer.toLowerCase().trim(), salt);
        await lock.save();

        res.status(200).json({ message: 'Recovery saved.' });
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

const recoverLock = async (req, res) => {
    const { answer } = req.body;
    try {
        const lock = await Lock.findOne({ userId: req.user.uid });
        if (!lock) return res.status(200).json({ success: true });

        if (!lock.securityAnswerHash) {
             return res.status(400).json({ success: false, message: 'No recovery configured.' });
        }

        const isValid = await bcrypt.compare(answer.toLowerCase().trim(), lock.securityAnswerHash);
        if (isValid) {
             await Lock.findOneAndDelete({ userId: req.user.uid });
             return res.status(200).json({ success: true, message: 'Verification successful. Lock removed.' });
        } else {
             return res.status(401).json({ success: false, message: 'Answer incorrect' });
        }
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

const sendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user || user.email !== email) {
            return res.status(404).json({ message: 'User not found or email mismatch.' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash it before saving
        const salt = await bcrypt.genSalt(10);
        user.otp = await bcrypt.hash(otp, salt);
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await user.save();

        const emailSent = await sendEmail({
            email: user.email,
            subject: 'Account Recovery OTP',
            message: `Your OTP is ${otp}. It expires in 5 minutes.`
        });

        if (emailSent) {
            res.status(200).json({ message: 'OTP sent to your email' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP email.' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user || user.email !== email) {
            return res.status(404).json({ success: false, message: 'User not found or email mismatch.' });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: 'No OTP requested.' });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        const isValid = await bcrypt.compare(otp, user.otp);
        if (isValid) {
            // Nullify OTP fields
            user.otp = null;
            user.otpExpiry = null;
            await user.save();

            // Clear the lock entirely
            await Lock.findOneAndDelete({ userId: req.user.uid });
            return res.status(200).json({ success: true, message: 'Verified successfully. Lock removed.' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { setLock, verifyLock, getLockStatus, removeLock, setRecovery, recoverLock, sendOtp, verifyOtp };

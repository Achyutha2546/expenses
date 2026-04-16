const express = require('express');
const router = express.Router();
const { setLock, verifyLock, getLockStatus, removeLock, setRecovery, recoverLock, sendOtp, verifyOtp } = require('../controllers/lockController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/status', protect, asyncHandler(getLockStatus));
router.post('/set', protect, asyncHandler(setLock));
router.post('/verify', protect, asyncHandler(verifyLock));
router.delete('/remove', protect, asyncHandler(removeLock));
router.post('/set-recovery', protect, asyncHandler(setRecovery));
router.post('/recover', protect, asyncHandler(recoverLock));
router.post('/send-otp', protect, asyncHandler(sendOtp));
router.post('/verify-otp', protect, asyncHandler(verifyOtp));

module.exports = router;

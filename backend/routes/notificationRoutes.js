const express = require('express');
const router = express.Router();
const {
    subscribe,
    unsubscribe,
    getPreferences,
    updatePreferences,
    sendDailyReminders
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// FCM token management
router.post('/subscribe', protect, asyncHandler(subscribe));
router.post('/unsubscribe', protect, asyncHandler(unsubscribe));

// Notification preferences
router.get('/preferences', protect, asyncHandler(getPreferences));
router.put('/preferences', protect, asyncHandler(updatePreferences));

// Trigger daily reminders (can be called by cron or scheduler)
router.post('/send-reminders', asyncHandler(sendDailyReminders));

module.exports = router;

const admin = require('../firebaseAdmin');
const User = require('../models/userModel');
const Budget = require('../models/budgetModel');
const Transaction = require('../models/transactionModel');

/**
 * @desc    Subscribe device for push notifications (save FCM token)
 * @route   POST /api/notifications/subscribe
 * @access  Private
 */
const subscribe = async (req, res) => {
    try {
        const { token, device } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Deduplicate — don't add same token twice
        const exists = user.fcmTokens.some(t => t.token === token);
        if (!exists) {
            user.fcmTokens.push({
                token,
                device: device || 'unknown',
                createdAt: new Date()
            });
            await user.save();
        }

        res.json({ message: 'Subscribed to notifications', tokenCount: user.fcmTokens.length });
    } catch (error) {
        console.error('Notification subscribe error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Unsubscribe device from push notifications
 * @route   POST /api/notifications/unsubscribe
 * @access  Private
 */
const unsubscribe = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.fcmTokens = user.fcmTokens.filter(t => t.token !== token);
        await user.save();

        res.json({ message: 'Unsubscribed from notifications' });
    } catch (error) {
        console.error('Notification unsubscribe error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
const getPreferences = async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            budgetWarning: user.notificationPrefs?.budgetWarning ?? true,
            budgetExceeded: user.notificationPrefs?.budgetExceeded ?? true,
            dailyReminder: user.notificationPrefs?.dailyReminder ?? true,
            reminderTime: user.notificationPrefs?.reminderTime ?? '20:00',
            hasTokens: user.fcmTokens.length > 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
const updatePreferences = async (req, res) => {
    try {
        const { budgetWarning, budgetExceeded, dailyReminder, reminderTime } = req.body;

        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (typeof budgetWarning === 'boolean') user.notificationPrefs.budgetWarning = budgetWarning;
        if (typeof budgetExceeded === 'boolean') user.notificationPrefs.budgetExceeded = budgetExceeded;
        if (typeof dailyReminder === 'boolean') user.notificationPrefs.dailyReminder = dailyReminder;
        if (reminderTime) user.notificationPrefs.reminderTime = reminderTime;

        await user.save();

        res.json({
            budgetWarning: user.notificationPrefs.budgetWarning,
            budgetExceeded: user.notificationPrefs.budgetExceeded,
            dailyReminder: user.notificationPrefs.dailyReminder,
            reminderTime: user.notificationPrefs.reminderTime
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Send FCM notification to all of a user's registered devices
 * @param {string} userId - Firebase UID
 * @param {object} notification - { title, body, icon, data }
 */
const sendPushToUser = async (userId, notification) => {
    try {
        const user = await User.findOne({ uid: userId });
        if (!user || user.fcmTokens.length === 0) return;

        const tokens = user.fcmTokens.map(t => t.token);
        const invalidTokens = [];

        // Send to each token individually (sendEachForMulticast handles token validation)
        const message = {
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: notification.data || {},
            webpush: {
                notification: {
                    icon: notification.icon || '/logo-192.png',
                    badge: '/logo-192.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: false,
                },
                fcmOptions: {
                    link: notification.link || '/'
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            ...message
        });

        // Clean up invalid tokens
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = resp.error?.code;
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered'
                ) {
                    invalidTokens.push(tokens[idx]);
                }
            }
        });

        // Remove invalid tokens from user record
        if (invalidTokens.length > 0) {
            user.fcmTokens = user.fcmTokens.filter(t => !invalidTokens.includes(t.token));
            await user.save();
            console.log(`Cleaned ${invalidTokens.length} invalid FCM tokens for user ${userId}`);
        }

        console.log(`Notifications sent to ${userId}: ${response.successCount}/${tokens.length} succeeded`);
        return response;
    } catch (error) {
        console.error(`Failed to send notification to ${userId}:`, error.message);
    }
};

/**
 * Check budget thresholds and send notifications after an expense is added.
 * Called from transactionController after creating an expense.
 * @param {string} userId - Firebase UID
 */
const checkBudgetAndNotify = async (userId) => {
    try {
        const user = await User.findOne({ uid: userId });
        if (!user) return;

        const now = new Date();
        const month = now.getUTCMonth() + 1;
        const year = now.getUTCFullYear();

        // Get budget for current month
        const budget = await Budget.findOne({ userId, month, year });
        if (!budget || budget.amount <= 0) return;

        // Calculate total spending this month
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        const result = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'expense',
                    date: { $gte: startDate, $lt: endDate }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalSpent = result[0]?.total || 0;
        const percentUsed = Math.round((totalSpent / budget.amount) * 100);

        // Threshold keys for deduplication
        const key80 = `${year}-${month}-80`;
        const key100 = `${year}-${month}-100`;

        // Check 100% threshold (budget exceeded)
        if (percentUsed >= 100 && user.notificationPrefs?.budgetExceeded !== false) {
            if (!user.notifiedBudgetThresholds?.get(key100)) {
                await sendPushToUser(userId, {
                    title: '🚨 Budget Exceeded!',
                    body: `You've spent ₹${totalSpent.toLocaleString('en-IN')} of your ₹${budget.amount.toLocaleString('en-IN')} budget (${percentUsed}%). Time to review your spending.`,
                    data: { type: 'budget_exceeded', percentUsed: String(percentUsed) },
                    link: '/dashboard'
                });
                user.notifiedBudgetThresholds.set(key100, true);
                await user.save();
            }
        }
        // Check 80% threshold (warning)
        else if (percentUsed >= 80 && user.notificationPrefs?.budgetWarning !== false) {
            if (!user.notifiedBudgetThresholds?.get(key80)) {
                await sendPushToUser(userId, {
                    title: '⚠️ Budget Warning',
                    body: `You've used ${percentUsed}% of your monthly budget (₹${totalSpent.toLocaleString('en-IN')} of ₹${budget.amount.toLocaleString('en-IN')}). Spend wisely!`,
                    data: { type: 'budget_warning', percentUsed: String(percentUsed) },
                    link: '/dashboard'
                });
                user.notifiedBudgetThresholds.set(key80, true);
                await user.save();
            }
        }
    } catch (error) {
        console.error('Budget notification check failed:', error.message);
    }
};

/**
 * Send daily reminders to users who haven't logged expenses today.
 * Called by the scheduler or via API endpoint.
 */
const sendDailyReminders = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setUTCHours(0, 0, 0, 0);

        // Find users with daily reminders enabled, who have FCM tokens,
        // and haven't logged a transaction today
        const users = await User.find({
            'notificationPrefs.dailyReminder': true,
            'fcmTokens.0': { $exists: true },
            $or: [
                { lastTransactionAt: null },
                { lastTransactionAt: { $lt: todayStart } }
            ]
        });

        let sentCount = 0;
        for (const user of users) {
            await sendPushToUser(user.uid, {
                title: '📝 Log Your Expenses',
                body: "Don't forget to track today's spending! Staying on top of your finances takes just a moment.",
                data: { type: 'daily_reminder' },
                link: '/add'
            });
            sentCount++;
        }

        console.log(`Daily reminders sent to ${sentCount}/${users.length} users`);

        if (res) {
            res.json({ message: `Reminders sent to ${sentCount} users` });
        }
    } catch (error) {
        console.error('Daily reminder error:', error.message);
        if (res) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = {
    subscribe,
    unsubscribe,
    getPreferences,
    updatePreferences,
    sendPushToUser,
    checkBudgetAndNotify,
    sendDailyReminders
};

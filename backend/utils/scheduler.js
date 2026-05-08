const { sendDailyReminders } = require('../controllers/notificationController');
const { processRecurringTransactions } = require('../controllers/recurringController');

const REMINDER_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

let schedulerTimer = null;

/**
 * Start the daily reminder scheduler.
 * Checks every 30 minutes if any users need their daily reminder.
 * This is a lightweight approach compatible with free-tier hosting.
 */
const startScheduler = () => {
    console.log('📅 Notification scheduler started (checks every 30 min)');

    const runCheck = async () => {
        try {
            const now = new Date();
            const hours = now.getUTCHours();
            // Convert IST 20:00 (8 PM) to UTC = 14:30
            // We check in a 30-minute window around common reminder times
            // Since users may be in different timezones, we just run reminders
            // during evening hours UTC (14:00-16:00 covers IST 19:30-21:30)
            if (hours >= 14 && hours <= 16) {
                console.log('⏰ Running daily reminder check...');
                await sendDailyReminders();
            }

            // Always check for recurring transactions (dates are checked inside)
            await processRecurringTransactions();
        } catch (error) {
            console.error('Scheduler error:', error.message);
        }
    };

    // Run first check after a short delay
    setTimeout(runCheck, 5000);

    // Schedule recurring checks
    schedulerTimer = setInterval(runCheck, REMINDER_CHECK_INTERVAL);
};

const stopScheduler = () => {
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
        console.log('Notification scheduler stopped');
    }
};

module.exports = { startScheduler, stopScheduler };

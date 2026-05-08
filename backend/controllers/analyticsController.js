const Transaction = require('../models/transactionModel');
const Budget = require('../models/budgetModel');
const mongoose = require('mongoose');

/**
 * @desc    Get total expenses grouped by category
 * @route   GET /api/analytics/category-summary
 * @access  Private
 */
const getCategorySummary = async (req, res) => {
    try {
        const categorySummary = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    type: 'expense'
                }
            },
            {
                $group: {
                    _id: { $toLower: '$category' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            },
            {
                $project: {
                    category: '$_id',
                    totalAmount: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json(categorySummary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get monthly income vs expenses for the last 6 months
 * @route   GET /api/analytics/monthly-summary
 * @access  Private
 */
const getMonthlySummary = async (req, res) => {
    try {
        // Calculate the date 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySummary = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.uid,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    totalIncome: 1,
                    totalExpense: 1,
                    _id: 0
                }
            }
        ]);

        res.json(monthlySummary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get advanced spending insights — multiple rule-based observations
 * @route   GET /api/analytics/insights
 * @access  Private
 *
 * Returns an object with:
 *   - cards[]: Array of insight cards to render
 *   - summary: Legacy fields for backward compatibility (trend, message, etc.)
 */
const getSpendingInsights = async (req, res) => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        const firstDayCurrent = new Date(currentYear, currentMonth, 1);
        const firstDayPrev = new Date(currentYear, currentMonth - 1, 1);
        const lastDayPrev = new Date(currentYear, currentMonth, 0);
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // ====== Run all aggregations in parallel ======
        const [
            currentMonthAgg,
            prevMonthAgg,
            currentCategoryAgg,
            prevCategoryAgg,
            dailySpendingAgg,
            weekdayAgg,
            streakAgg,
            budgetDoc
        ] = await Promise.all([
            // 1. Current month total
            Transaction.aggregate([
                { $match: { userId: req.user.uid, type: 'expense', date: { $gte: firstDayCurrent } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),

            // 2. Previous month total
            Transaction.aggregate([
                { $match: { userId: req.user.uid, type: 'expense', date: { $gte: firstDayPrev, $lte: lastDayPrev } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),

            // 3. Current month by category
            Transaction.aggregate([
                { $match: { userId: req.user.uid, type: 'expense', date: { $gte: firstDayCurrent } } },
                { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]),

            // 4. Previous month by category
            Transaction.aggregate([
                { $match: { userId: req.user.uid, type: 'expense', date: { $gte: firstDayPrev, $lte: lastDayPrev } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } }
            ]),

            // 5. Daily spending for current month (for daily average & peak day)
            Transaction.aggregate([
                { $match: { userId: req.user.uid, type: 'expense', date: { $gte: firstDayCurrent } } },
                { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { '_id': 1 } }
            ]),

            // 6. Spending by day of week (all time — for patterns)
            Transaction.aggregate([
                { $match: { userId: req.user.uid, type: 'expense' } },
                { $group: { _id: { $dayOfWeek: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]),

            // 7. Recent transaction dates (for streak calculation)
            Transaction.find(
                { userId: req.user.uid, type: 'expense' },
                { date: 1 }
            ).sort({ date: -1 }).limit(60).lean(),

            // 8. Budget
            Budget.findOne({ userId: req.user.uid })
        ]);

        // ====== Extract raw values ======
        const currentTotal = currentMonthAgg[0]?.total || 0;
        const currentCount = currentMonthAgg[0]?.count || 0;
        const prevTotal = prevMonthAgg[0]?.total || 0;
        const prevCount = prevMonthAgg[0]?.count || 0;
        const budgetAmount = budgetDoc?.amount || 0;

        // ====== Build insight cards ======
        const cards = [];

        // --- 1. MoM Spending Trend ---
        if (prevTotal > 0) {
            const changePercent = ((currentTotal - prevTotal) / prevTotal) * 100;
            const absChange = Math.abs(changePercent).toFixed(0);

            if (changePercent > 10) {
                cards.push({
                    id: 'mom_trend',
                    type: 'warning',
                    icon: '📈',
                    title: 'Spending Up',
                    value: `+${absChange}%`,
                    description: `You've spent ₹${currentTotal.toLocaleString('en-IN')} this month — ${absChange}% more than last month's ₹${prevTotal.toLocaleString('en-IN')}.`,
                    priority: 1
                });
            } else if (changePercent < -10) {
                cards.push({
                    id: 'mom_trend',
                    type: 'success',
                    icon: '📉',
                    title: 'Spending Down',
                    value: `-${absChange}%`,
                    description: `Great job! You've cut spending by ${absChange}% compared to last month.`,
                    priority: 1
                });
            } else {
                cards.push({
                    id: 'mom_trend',
                    type: 'neutral',
                    icon: '📊',
                    title: 'Stable Spending',
                    value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(0)}%`,
                    description: `Spending is consistent with last month. You're on a steady track.`,
                    priority: 3
                });
            }
        }

        // --- 2. Top Category ---
        if (currentCategoryAgg.length > 0) {
            const top = currentCategoryAgg[0];
            const topPercent = currentTotal > 0 ? ((top.total / currentTotal) * 100).toFixed(0) : 0;
            const categoryName = top._id || 'General';

            cards.push({
                id: 'top_category',
                type: 'info',
                icon: '🏷️',
                title: 'Top Category',
                value: categoryName,
                highlight: `₹${top.total.toLocaleString('en-IN')}`,
                description: `${categoryName} accounts for ${topPercent}% of your spending (${top.count} transactions).`,
                priority: 2
            });

            // Check if a category spiked vs last month
            if (prevCategoryAgg.length > 0) {
                const prevCatMap = {};
                prevCategoryAgg.forEach(c => { prevCatMap[c._id] = c.total; });

                for (const cat of currentCategoryAgg.slice(0, 3)) {
                    const prevCatTotal = prevCatMap[cat._id] || 0;
                    if (prevCatTotal > 0) {
                        const catChange = ((cat.total - prevCatTotal) / prevCatTotal) * 100;
                        if (catChange > 50 && cat.total > 500) {
                            cards.push({
                                id: `spike_${cat._id}`,
                                type: 'warning',
                                icon: '🔥',
                                title: `${cat._id} Spike`,
                                value: `+${catChange.toFixed(0)}%`,
                                description: `${cat._id} spending jumped from ₹${prevCatTotal.toLocaleString('en-IN')} to ₹${cat.total.toLocaleString('en-IN')} this month.`,
                                priority: 2
                            });
                            break; // Only show the biggest spike
                        }
                    }
                }
            }
        }

        // --- 3. Daily Average ---
        if (dayOfMonth > 0 && currentTotal > 0) {
            const dailyAvg = currentTotal / dayOfMonth;
            const projectedTotal = dailyAvg * daysInMonth;

            cards.push({
                id: 'daily_avg',
                type: 'info',
                icon: '📅',
                title: 'Daily Average',
                value: `₹${Math.round(dailyAvg).toLocaleString('en-IN')}`,
                description: `At this pace, you'll spend ~₹${Math.round(projectedTotal).toLocaleString('en-IN')} by month end.`,
                priority: 3
            });
        }

        // --- 4. Budget Risk ---
        if (budgetAmount > 0) {
            const budgetUsed = (currentTotal / budgetAmount) * 100;
            const daysLeft = daysInMonth - dayOfMonth;
            const dailyBudgetLeft = daysLeft > 0 ? (budgetAmount - currentTotal) / daysLeft : 0;

            if (budgetUsed >= 100) {
                cards.push({
                    id: 'budget_risk',
                    type: 'danger',
                    icon: '🚨',
                    title: 'Over Budget',
                    value: `${budgetUsed.toFixed(0)}%`,
                    highlight: `₹${(currentTotal - budgetAmount).toLocaleString('en-IN')} over`,
                    description: `You've exceeded your ₹${budgetAmount.toLocaleString('en-IN')} budget with ${daysLeft} days remaining.`,
                    priority: 0
                });
            } else if (budgetUsed >= 80) {
                cards.push({
                    id: 'budget_risk',
                    type: 'warning',
                    icon: '⚠️',
                    title: 'Budget Warning',
                    value: `${budgetUsed.toFixed(0)}%`,
                    highlight: `₹${Math.round(dailyBudgetLeft).toLocaleString('en-IN')}/day left`,
                    description: `${daysLeft} days left and you can spend ₹${Math.round(dailyBudgetLeft).toLocaleString('en-IN')} per day to stay on budget.`,
                    priority: 1
                });
            } else if (budgetUsed >= 50) {
                cards.push({
                    id: 'budget_pace',
                    type: 'neutral',
                    icon: '💰',
                    title: 'Budget Pace',
                    value: `${budgetUsed.toFixed(0)}%`,
                    highlight: `₹${Math.round(dailyBudgetLeft).toLocaleString('en-IN')}/day`,
                    description: `You have ₹${(budgetAmount - currentTotal).toLocaleString('en-IN')} remaining for ${daysLeft} days.`,
                    priority: 3
                });
            }
        }

        // --- 5. Peak Spending Day ---
        if (dailySpendingAgg.length > 2) {
            const peakDay = dailySpendingAgg.reduce((max, d) => d.total > max.total ? d : max, dailySpendingAgg[0]);
            if (peakDay.total > (currentTotal / dayOfMonth) * 2) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                cards.push({
                    id: 'peak_day',
                    type: 'info',
                    icon: '⚡',
                    title: 'Peak Day',
                    value: `${monthNames[currentMonth]} ${peakDay._id}`,
                    highlight: `₹${peakDay.total.toLocaleString('en-IN')}`,
                    description: `Your highest spending day — ${peakDay.count} transaction${peakDay.count > 1 ? 's' : ''} totaling ₹${peakDay.total.toLocaleString('en-IN')}.`,
                    priority: 4
                });
            }
        }

        // --- 6. Spending Pattern (day of week) ---
        if (weekdayAgg.length > 0) {
            const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const topDay = weekdayAgg[0];
            const totalWeekdaySpend = weekdayAgg.reduce((s, d) => s + d.total, 0);
            const topDayPercent = totalWeekdaySpend > 0 ? ((topDay.total / totalWeekdaySpend) * 100).toFixed(0) : 0;

            if (topDayPercent > 20) {
                cards.push({
                    id: 'weekday_pattern',
                    type: 'info',
                    icon: '📆',
                    title: 'Spending Pattern',
                    value: dayNames[topDay._id] || 'N/A',
                    description: `You tend to spend the most on ${dayNames[topDay._id]}s — ${topDayPercent}% of all spending happens this day.`,
                    priority: 5
                });
            }
        }

        // --- 7. Transaction Frequency ---
        if (currentCount > 0 && dayOfMonth > 0) {
            const avgTxPerDay = currentCount / dayOfMonth;
            if (prevCount > 0) {
                const prevDaysInMonth = lastDayPrev.getDate();
                const prevAvgTx = prevCount / prevDaysInMonth;
                const freqChange = ((avgTxPerDay - prevAvgTx) / prevAvgTx) * 100;

                if (Math.abs(freqChange) > 25) {
                    cards.push({
                        id: 'tx_frequency',
                        type: freqChange > 0 ? 'warning' : 'success',
                        icon: freqChange > 0 ? '🔄' : '✨',
                        title: freqChange > 0 ? 'More Transactions' : 'Fewer Transactions',
                        value: `${avgTxPerDay.toFixed(1)}/day`,
                        description: freqChange > 0
                            ? `You're making ${Math.abs(freqChange).toFixed(0)}% more transactions than last month.`
                            : `${Math.abs(freqChange).toFixed(0)}% fewer transactions — more intentional spending!`,
                        priority: 4
                    });
                }
            }
        }

        // Sort by priority (lower = more important)
        cards.sort((a, b) => a.priority - b.priority);

        // ====== Legacy summary for backward compat ======
        let trend = 'neutral';
        let message = '';
        let changePercent = 0;
        const topCategory = currentCategoryAgg[0]?._id || 'General';
        const topCategoryAmount = currentCategoryAgg[0]?.total || 0;

        if (prevTotal > 0) {
            changePercent = ((currentTotal - prevTotal) / prevTotal) * 100;
            if (changePercent > 10) {
                trend = 'up';
                message = `Spending is up by ${Math.abs(changePercent).toFixed(0)}% MoM. ${topCategory} is your biggest expense.`;
            } else if (changePercent < -10) {
                trend = 'down';
                message = `Great! Spending is down ${Math.abs(changePercent).toFixed(0)}%. You're saving more this month!`;
            } else {
                message = `Your spending is stable. ${topCategory} remains your primary expense at ₹${topCategoryAmount.toLocaleString('en-IN')}.`;
            }
        } else {
            message = currentTotal > 0 ? `${topCategory} is your top category so far. Keep tracking to see MoM trends!` : "Start tracking to see your spending insights.";
        }

        res.json({
            // New: rich insight cards
            cards,
            // Legacy fields (backward compat with existing dashboard)
            currentMonthTotal: currentTotal,
            prevMonthTotal: prevTotal,
            changePercent,
            message,
            trend,
            topCategory,
            topCategoryAmount
        });
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategorySummary,
    getMonthlySummary,
    getSpendingInsights
};

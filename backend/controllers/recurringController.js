const RecurringTransaction = require('../models/recurringTransactionModel');
const Transaction = require('../models/transactionModel');
const Source = require('../models/sourceModel');

/**
 * Logic to process all active recurring transactions.
 * Called by the background scheduler.
 */
const processRecurringTransactions = async () => {
    console.log('🔄 Checking for recurring transactions to generate...');
    const now = new Date();
    
    try {
        const recurringTemplates = await RecurringTransaction.find({ isActive: true });
        let generatedCount = 0;

        for (const template of recurringTemplates) {
            const lastDate = template.lastGeneratedDate || template.startDate;
            let shouldGenerate = false;

            if (template.frequency === 'weekly') {
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                if (lastDate <= oneWeekAgo) shouldGenerate = true;
            } else if (template.frequency === 'monthly') {
                const oneMonthAgo = new Date(now);
                oneMonthAgo.setMonth(now.getMonth() - 1);
                if (lastDate <= oneMonthAgo) shouldGenerate = true;
            }

            if (shouldGenerate) {
                console.log(`[Recurring] Generating transaction for: ${template.description || template.category}`);
                
                // 1. Create the actual transaction
                await Transaction.create({
                    userId: template.userId,
                    amount: template.amount,
                    category: template.category,
                    description: `[Auto] ${template.description || template.category}`,
                    type: template.type,
                    source: template.source,
                    date: now,
                    isRecurring: true // Tag it
                });

                // 2. Update source balance (Mirroring logic in transactionController)
                const source = await Source.findOne({ name: template.source, userId: template.userId });
                if (source) {
                    if (template.type === 'income') {
                        source.balance += template.amount;
                    } else {
                        source.balance -= template.amount;
                    }
                    await source.save();
                }

                // 3. Update template
                template.lastGeneratedDate = now;
                await template.save();
                generatedCount++;
            }
        }
        
        if (generatedCount > 0) {
            console.log(`✅ Generated ${generatedCount} recurring transactions.`);
        }
    } catch (error) {
        console.error('Error processing recurring transactions:', error);
    }
};

/**
 * @desc    Get all recurring templates for user
 * @route   GET /api/recurring
 */
const getRecurringTemplates = async (req, res) => {
    try {
        const templates = await RecurringTransaction.find({ userId: req.user.uid });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete/Stop a recurring template
 * @route   DELETE /api/recurring/:id
 */
const deleteRecurringTemplate = async (req, res) => {
    try {
        const template = await RecurringTransaction.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.uid 
        });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json({ message: 'Automation stopped' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    processRecurringTransactions,
    getRecurringTemplates,
    deleteRecurringTemplate
};

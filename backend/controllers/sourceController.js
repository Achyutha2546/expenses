const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');

const getSources = async (req, res) => {
    try {
        const sources = await Source.find({ userId: req.user.uid });
        res.json(sources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addSource = async (req, res) => {
    const { name, initialBalance } = req.body;

    try {
        const sourceExists = await Source.findOne({ userId: req.user.uid, name });
        if (sourceExists) {
            return res.status(400).json({ message: 'Source already exists' });
        }

        const source = await Source.create({
            userId: req.user.uid,
            name
        });

        // Create initial balance transaction if initialBalance > 0
        if (initialBalance > 0) {
            await Transaction.create({
                userId: req.user.uid,
                type: 'income',
                amount: initialBalance,
                sourceId: source._id,
                source: 'Initial Balance',
                category: 'Other',
                date: new Date(),
                purpose: 'Initial Balance Setup'
            });

            // Sync user balance
            const user = await User.findOne({ uid: req.user.uid });
            if (user) {
                user.balance = (user.balance || 0) + Number(initialBalance);
                await user.save();
            }
        }

        res.status(201).json(source);
    } catch (error) {
        console.error('Error adding source:', error);
        res.status(400).json({ message: error.message });
    }
};

const deleteSource = async (req, res) => {
    try {
        const source = await Source.findById(req.params.id);

        if (!source) {
            return res.status(404).json({ message: 'Source not found' });
        }

        if (source.userId !== req.user.uid) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Delete all transactions associated with this source and sync balance
        const transactionsList = await Transaction.find({ sourceId: req.params.id });
        const user = await User.findOne({ uid: req.user.uid });
        
        if (user && transactionsList.length > 0) {
            let balanceAdjustment = 0;
            transactionsList.forEach(t => {
                if (t.type === 'income') balanceAdjustment -= t.amount;
                else if (t.type === 'expense') balanceAdjustment += t.amount;
            });
            user.balance = (user.balance || 0) + balanceAdjustment;
            await user.save();
        }

        await Transaction.deleteMany({ sourceId: req.params.id });

        await source.deleteOne();
        res.json({ message: 'Source removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const completeOnboarding = async (req, res) => {
    const { sources } = req.body; // Expecting [{ name: string, balance: number }]

    console.log('[Onboarding] req.user:', JSON.stringify(req.user));
    console.log('[Onboarding] req.user.uid:', req.user?.uid);
    console.log('[Onboarding] sources:', JSON.stringify(sources));

    if (!req.user?.uid) {
        return res.status(401).json({ message: 'User authentication failed - no uid found' });
    }

    try {
        const createdSources = [];
        let totalInitialBalance = 0;

        for (const s of sources) {
            // Create the source
            const source = await Source.create({
                userId: req.user.uid,
                name: s.name
            });
            createdSources.push(source);

            // Create initial balance transaction if balance > 0
            if (s.balance > 0) {
                totalInitialBalance += Number(s.balance);
                await Transaction.create({
                    userId: req.user.uid,
                    type: 'income',
                    amount: s.balance,
                    sourceId: source._id,
                    source: 'Initial Balance',
                    category: 'Other',
                    date: new Date(),
                    purpose: 'Initial Balance Setup'
                });
            }
        }

        if (totalInitialBalance > 0) {
            const user = await User.findOne({ uid: req.user.uid });
            if (user) {
                user.balance = (user.balance || 0) + totalInitialBalance;
                await user.save();
            }
        }
        res.status(201).json(createdSources);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateSource = async (req, res) => {
    const { name } = req.body;
    try {
        const source = await Source.findById(req.params.id);

        if (!source) {
            return res.status(404).json({ message: 'Source not found' });
        }

        if (source.userId !== req.user.uid) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        source.name = name || source.name;
        const updatedSource = await source.save();
        res.json(updatedSource);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getSources,
    addSource,
    updateSource,
    deleteSource,
    completeOnboarding
};

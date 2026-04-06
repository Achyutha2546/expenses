const Source = require('../models/sourceModel');
const Transaction = require('../models/transactionModel');

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
        }

        res.status(201).json(source);
    } catch (error) {
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

        // Delete all transactions associated with this source
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
        for (const s of sources) {
            // Create the source
            const source = await Source.create({
                userId: req.user.uid,
                name: s.name
            });
            createdSources.push(source);

            // Create initial balance transaction if balance > 0
            if (s.balance > 0) {
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

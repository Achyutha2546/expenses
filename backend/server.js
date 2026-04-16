const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes (must come before static files)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/lock', require('./routes/lockRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/sources', require('./routes/sourceRoutes'));
app.use('/api', require('./routes/analyticsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes')); // Keep this for backward compatibility if needed, or remove if strictly following request
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/set-budget', require('./routes/budgetRoutes')); // Match user request
app.use('/api/get-budget', require('./routes/budgetRoutes')); // Match user request

// Serve frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// SPA fallback: any non-API route serves index.html
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });

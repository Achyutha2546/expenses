const express = require('express');
const router = express.Router();
const {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/export', protect, exportTransactions);

router.route('/')
    .get(protect, getTransactions)
    .post(protect, addTransaction);

router.route('/:id')
    .put(protect, updateTransaction)
    .delete(protect, deleteTransaction);

module.exports = router;

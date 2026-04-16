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
const asyncHandler = require('../utils/asyncHandler');

router.get('/export', protect, asyncHandler(exportTransactions));

router.route('/')
    .get(protect, asyncHandler(getTransactions))
    .post(protect, asyncHandler(addTransaction));

router.route('/:id')
    .put(protect, asyncHandler(updateTransaction))
    .delete(protect, asyncHandler(deleteTransaction));

module.exports = router;

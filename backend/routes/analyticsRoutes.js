const express = require('express');
const router = express.Router();
const { getCategorySummary, getMonthlySummary, getSpendingInsights } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/category-summary', protect, getCategorySummary);
router.get('/monthly-summary', protect, getMonthlySummary);
router.get('/insights', protect, getSpendingInsights);

module.exports = router;

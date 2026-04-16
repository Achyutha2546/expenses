const express = require('express');
const router = express.Router();
const { getSpendingInsights } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSpendingInsights);

module.exports = router;

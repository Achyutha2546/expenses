const express = require('express');
const router = express.Router();
const { getBudget, setBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', protect, asyncHandler(getBudget));
router.post('/', protect, asyncHandler(setBudget));

module.exports = router;

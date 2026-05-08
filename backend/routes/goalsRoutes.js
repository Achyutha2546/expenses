const express = require('express');
const router = express.Router();
const { getGoals, createGoal, addContribution, updateGoal, deleteGoal } = require('../controllers/goalsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getGoals);
router.post('/', protect, createGoal);
router.post('/:id/contribute', protect, addContribution);
router.put('/:id', protect, updateGoal);
router.delete('/:id', protect, deleteGoal);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getRecurringTemplates, deleteRecurringTemplate } = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRecurringTemplates);
router.delete('/:id', protect, deleteRecurringTemplate);

module.exports = router;

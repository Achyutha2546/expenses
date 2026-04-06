const express = require('express');
const router = express.Router();
const { googleLogin, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/firebase', googleLogin);
router.delete('/delete', protect, deleteAccount);

module.exports = router;

const express = require('express');
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', isAuthenticated, userController.viewProfile);
router.patch('/profile', isAuthenticated, userController.updateProfile);

module.exports = router;

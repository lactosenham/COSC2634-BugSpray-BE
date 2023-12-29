const express = require('express');
const userController = require('../controllers/userController');
const { isAuthenticated, isManager } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', isAuthenticated, userController.viewProfile);

// Get all developers
router.get('/getAllDeveloper', isAuthenticated, userController.getAllDeveloper);

// Update user information
router.patch('/update/', isAuthenticated, userController.updateUser);

module.exports = router;

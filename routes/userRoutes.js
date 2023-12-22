const express = require('express');
const userController = require('../controllers/userController');
const { isAuthenticated, isManager } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', isAuthenticated, userController.viewProfile);

// Get all developers
// router.get('/getAllDeveloper', isAuthenticated, userController.getAllDeveloper);

// Find a developer by partial name within a project
router.post('/findDevelopers/:projectId', isManager, userController.findDeveloper);

// Update user information
router.patch('/update/:id', isAuthenticated, userController.updateUser);

module.exports = router;

const express = require('express');
const bugController = require('../controllers/bugController');
const { isManager, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/report', isAuthenticated, bugController.reportBug);

router.get('/all', bugController.getAllBugs);

router.get('/mybugs', isAuthenticated, bugController.getBugsForUser);

router.get('/:id', bugController.getBugById);

router.get('/project/:projectId', bugController.getBugsForProject);

router.patch('/update/:id', isAuthenticated, bugController.updateBug);

router.delete('/delete/:id', isAuthenticated, bugController.deleteBug);

router.get('/total/:projectId', bugController.getTotalBugsInProject);

router.post('/sort', bugController.searchAndSortBugs);

module.exports = router;

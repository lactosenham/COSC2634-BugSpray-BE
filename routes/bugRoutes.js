const express = require('express');
const bugController = require('../controllers/bugController');
const { isManager, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/report', isAuthenticated, bugController.reportBug);

router.get('/all', bugController.getAllBugs);

router.get('/mybugs', isAuthenticated, bugController.getBugsForUser);

router.get('/solved', isAuthenticated, bugController.recentlySolvedBugs);

router.get('/total-bugs-last-6-months', isAuthenticated, bugController.totalBugsReportedLast6Months);

router.get('/bugs-chart/:type', isAuthenticated, bugController.bugsChart);

router.get('/:id', bugController.getBugById);

router.get('/project/:projectId', isAuthenticated, bugController.getBugsForProject);

router.patch('/update/:id', isAuthenticated, bugController.updateBug);

router.put('/:bugId', isAuthenticated, bugController.addCommentToBug);

router.delete('/delete/:id', isAuthenticated, bugController.deleteBug);

router.get('/total/:projectId', bugController.getTotalBugsInProject);

router.post('/sort', isAuthenticated, bugController.searchAndSortBugs);


module.exports = router;

const express = require('express');
const projectController = require('../controllers/projectController');
const { isManager, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', isManager, projectController.createProject);

router.get('/all', projectController.getAllProjects);

router.get('/my-projects', isAuthenticated, projectController.getMyProjects);

router.get('/:id', projectController.getProjectById);

router.post('/search-by-name', projectController.searchProjectByName);

router.patch('/update/:id', isManager, projectController.updateProject);

router.delete('/delete/:id', isManager, projectController.deleteProject);

router.post('/add-developer', isManager, projectController.addDeveloper);

router.post('/remove-developer', isManager, projectController.removeDeveloper);

router.post('/findDevelopers/:projectId', isManager, projectController.findDeveloper);

module.exports = router;

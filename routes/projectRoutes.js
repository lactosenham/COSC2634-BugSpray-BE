const express = require('express');
const projectController = require('../controllers/projectController');
const { isManager, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/getAllDeveloper', projectController.getAllDeveloper);

router.post('/create', isManager, projectController.createProject);

router.get('/all', isAuthenticated, projectController.getAllProjects);

router.get('/my-projects', isAuthenticated, projectController.getMyProjects);

router.get('/:id', isAuthenticated, projectController.getProjectById);

router.get('/dev/:id', isAuthenticated, projectController.getDevelopersInProject);

router.post('/search-by-name', projectController.searchProjectByName);

router.patch('/update/:id', isManager, projectController.updateProject);

router.delete('/delete/:id', isManager, projectController.deleteProject);

router.post('/add-member', isManager, projectController.addMember);

router.post('/remove-member', isManager, projectController.removeMember);

router.post('/findDevelopers/:projectId', isManager, projectController.findDeveloper);

module.exports = router;

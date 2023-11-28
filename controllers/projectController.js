const Project = require('../models/project');

const projectController = {};

projectController.createProject = async (req, res) => {
    try {
        const { name, description, developers, bugs } = req.body;
        const project = new Project({
            name: name,
            description: description,
            managerId: req.user.userId,
            developers: developers,
            bugs: bugs
        });
        await project.save();
        console.log(project);
        res.status(201).send(project);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, project');
    }
};

projectController.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).send(projects);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, project');
    }
};

projectController.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send('Project not found');
        }
        res.status(200).send(project);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, project');
    }
};

projectController.getMyProjects = async (req, res) => {
    try {
        const assignedProjects = await Project.find({
            $or: [
                { managerId: req.user.userId },
                { developers: { $in: [req.user.userId] } }
            ]
        });

        if (assignedProjects.length === 0) {
            return res.status(200).send('You have no assigned projects.');
        }

        const projectDetails = await Promise.all(assignedProjects.map(async (project) => {
            return await Project.findById(project._id).populate('managerId', 'name').populate('developers', 'name');
        }));

        res.status(200).send(projectDetails);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, project');
    }
};

projectController.searchProjectByName = async (req, res) => {
    try {
      const partialName = req.body.partialName;
  
      const projects = await Project.find({ name: { $regex: new RegExp(partialName, 'i') } });
  
      if (projects.length === 0) {
        return res.status(404).send('No projects found');
      }
  
      res.status(200).send(projects);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error, searchProjectByName');
    }
  };

projectController.updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        if (name) {
            project.name = name;
          }
      
        if (description) {
            project.description = description;
        }
        await project.save();

        res.status(200).send(project);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

projectController.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        await project.deleteOne();
        res.status(200).send('Project deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

projectController.addDeveloper = async (req, res) => {
    try {
        const { projectId, developerIds } = req.body;

        // Ensure developerIds is always an array
        const developerIdsArray = Array.isArray(developerIds) ? developerIds : [developerIds];

        console.log("Array of devs being added: ", developerIdsArray.join(', '));

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        let addedDevelopers = [];

        for (const id of developerIdsArray) {
            if (!project.developers.includes(id)) {
                project.developers.push(id);
                addedDevelopers.push(id);
            }
        }

        if (addedDevelopers.length > 0) {
            await project.save();
            console.log(`Developers [${addedDevelopers.join(', ')}] added to project ${projectId}`);
            res.status(200).send(`Developers added successfully: ${addedDevelopers.join(', ')}`);
        } else {
            res.status(400).send('No new developers were added. They might already be assigned to this project.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


projectController.removeDeveloper = async (req, res) => {
    try {
        const { projectId, developerId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        if (!project.developers.includes(developerId)) {
            return res.status(400).send('Developer not found in this project');
        }

        project.developers = project.developers.filter(dev => dev.toString() !== developerId);
        await project.save();

        res.status(200).send('Developer removed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

projectController.findDeveloper = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { partialName } = req.body;

        const project = await Project.findById(projectId).populate('developers', 'name');

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Filter developers whose names partially match the provided partialName
        const matchingDevelopers = project.developers.filter(developer => developer.name.includes(partialName));

        res.status(200).json(matchingDevelopers);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, findDevelopers');
    }
};



module.exports = projectController;

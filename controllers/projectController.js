const Project = require('../models/project');
const User =  require('../models/user');

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
        const userId = req.user.userId;

        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        res.status(200).send(projects);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, project');
    }
};


projectController.getProjectById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.userId;

        const project = await Project.findOne({
            _id: projectId,
            $or: [
                { managerId: userId }, 
                { managers: userId },    
                { developers: userId },  
            ],
        });
        if (!project) {
            return res.status(404).send('Project not found or you do not have access.');
        }

        res.status(200).send(project);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, project');
    }
};

projectController.getDevelopersInProject = async (req, res) => {
    try {
        const projectId = req.params.id;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        const developerIds = project.developers;

        const developers = await User.find({ _id: { $in: developerIds } });

        res.status(200).send(developers);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, getDevelopersInProject');
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

        if (project.managerId.toString() !== req.user.userId && !project.managers.includes(req.user.userId)) {
            return res.status(403).send('Access denied. Only the creating manager or added managers can modify this project.');
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

projectController.addMember = async (req, res) => {
    try {
        const { projectId, memberIds } = req.body;

        const memberIdsArray = Array.isArray(memberIds) ? memberIds : [memberIds];

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        if (project.managerId.toString() !== req.user.userId && !project.managers.includes(req.user.userId)) {
            return res.status(403).send('Access denied. Only the creating manager or added managers can modify this project.');
        }

        let addedMembers = [];

        for (const id of memberIdsArray) {
            if (!project.developers.includes(id) && !project.managers.includes(id)) {
                // Check if the member is a manager or developer
                const user = await User.findById(id);
                if (!user) {
                    return res.status(404).send(`User with ID ${id} not found`);
                }

                if (user.role === 'Manager') {
                    project.managers.push(id);
                } else if (user.role === 'Developer') {
                    project.developers.push(id);
                }

                addedMembers.push(id);
            }
        }

        if (addedMembers.length > 0) {
            await project.save();
            console.log(`Members [${addedMembers.join(', ')}] added to project ${projectId}`);
            res.status(200).send(`Members added successfully: ${addedMembers.join(', ')}`);
        } else {
            res.status(400).send('No new members were added. They might already be assigned to this project.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


projectController.removeMember = async (req, res) => {
    try {
        const { projectId, memberIds } = req.body; // memberIds is expected to be an array
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Iterate over the array of member IDs
        memberIds.forEach(memberId => {
            // Remove the member if they are a developer or a manager in the project
            project.developers = project.developers.filter(dev => dev.toString() !== memberId);
            project.managers = project.managers.filter(mgr => mgr.toString() !== memberId);
        });

        await project.save();

        res.status(200).send('Members removed successfully');
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

        const matchingDevelopers = project.developers.filter(developer => developer.name.includes(partialName));

        console.log("Matching Developers: ", matchingDevelopers)
        res.status(200).json(matchingDevelopers);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, findDevelopers');
    }
};

projectController.getAllDeveloper = async (req, res) => {
    try {
        const devs = [];
        const users = await User.find();
        console.log(users);
        for (const user of users)
        {
            if (user.role == "Developer")
                {
                    devs.push(user);
                }
        };
        res.status(200).send(devs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, findDevelopers');
    }
};


module.exports = projectController;

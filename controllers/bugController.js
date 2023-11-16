const mongoose = require('mongoose');
const Bug = require('../models/bug');
const Project = require('../models/project');

const bugController = {};

bugController.reportBug = async (req, res) => {
    try {
        const { projectId, assignedTo, priority, severity, stepsToReproduce, image, deadline, status, comments } = req.body;

        console.log('Received projectId:', projectId);
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }

        const newBug = new Bug({

            projectId: project._id,
            reportedBy: req.user.userId,
            assignedTo,
            priority,
            severity,
            stepsToReproduce,
            image,
            deadline,
            status,
            comments
        });

        await newBug.save();
        res.status(201).send(newBug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

module.exports = bugController;

bugController.getAllBugs = async (req, res) => {
    try {
        const bugs = await Bug.find();
        res.status(200).send(bugs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

bugController.getBugsForUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const assignedBugs = await Bug.find({ assignedTo: userId }).populate('projectId', 'name');

        res.status(200).send(assignedBugs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

bugController.getBugById = async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id);
        if (!bug) {
            return res.status(404).send('Bug not found');
        }
        res.status(200).send(bug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

bugController.getBugsForProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Validate projectId if necessary

        const bugs = await Bug.find({ projectId }).populate('assignedTo', 'username');
        if (!bugs || bugs.length === 0) {
            return res.status(404).send('No bugs found for this project');
        }

        res.status(200).send(bugs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

bugController.updateBug = async (req, res) => {
    try {
        const { 
            assignedTo, 
            priority, 
            severity, 
            stepsToReproduce, 
            image, 
            deadline, 
            status, 
            comments 
        } = req.body;

        // Prepare the update object
        const updateData = {
            ...(assignedTo && { assignedTo }),
            ...(priority !== undefined && { priority }),
            ...(severity !== undefined && { severity }),
            ...(stepsToReproduce && { stepsToReproduce }),
            ...(image && { image }),
            ...(deadline && { deadline }),
            ...(status && { status }),
            ...(comments && { comments })
        };

        const bug = await Bug.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!bug) {
            return res.status(404).send('Bug not found');
        }
        res.status(200).send(bug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};


bugController.deleteBug = async (req, res) => {
    try {
        const bug = await Bug.findByIdAndDelete(req.params.id);
        if (!bug) {
            return res.status(404).send('Bug not found');
        }
        res.status(200).send('Bug deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

module.exports = bugController;

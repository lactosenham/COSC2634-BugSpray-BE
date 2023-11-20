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
            deadline, 
            status, 
            comments 
        } = req.body;

        if (status === 'Done') {
            // Fetch the existing bug to check for comments
            const existingBug = await Bug.findById(req.params.id);

            // Check if there is at least one comment
            if (!existingBug.comments || existingBug.comments.length === 0 || !existingBug.comments[0].comment) {
                return res.status(400).send('At least one comment is required to move to "Done" status.');
            }
        }

        // Prepare the update object
        const updateData = {
            ...(assignedTo && { assignedTo }),
            ...(priority !== undefined && { priority }),
            ...(severity !== undefined && { severity }),
            ...(stepsToReproduce && { stepsToReproduce }),
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


bugController.updateBugWithCommit = async (bugId, commitMessage) => {
    try {
        const bug = await Bug.findOne({ _id: bugId });

        // Check if the bug exists
        if (!bug) {
            console.log(`Bug with ID ${bugId} not found`);
            return;
        }

        // Add the commit message to the bug's comments
        bug.comments.push({
            comment: commitMessage,
            date: new Date(),
        });

        // Save the updated bug
        await bug.save();

        console.log(`Bug ${bugId} updated with commit: ${commitMessage}`);
    } catch (error) {
        console.error('Error updating bug with commit:', error);
    }
};


bugController.processGitHubPayload = (payload) => {
    try {
        if (!payload || !payload.commits || payload.commits.length === 0) {
            console.error('Invalid or empty GitHub push payload');
            return;
        }

        const repository = payload.repository ? payload.repository.name : null;
        const commits = payload.commits;

        if (!repository) {
            console.error('Missing repository information in GitHub push payload');
            return;
        }

        console.log(`Repository: ${repository}`);

        commits.forEach((commit) => {
            const commitMessage = commit.message;
            const commitId = commit.id;

            console.log(`Commit ID: ${commitId}`);
            console.log(`Commit Message: ${commitMessage}`);

            // Extract bug ID from commit message and update the bug
            const regex = /#([a-fA-F0-9]+)/;
            const match = commitMessage.match(regex);

            if (match) {
                const bugId = match[1];
                console.log(`Referenced Bug ID: ${bugId}`);
                bugController.updateBugWithCommit(bugId, commitMessage);
            }
        });
    } catch (error) {
        console.error('Error processing GitHub payload:', error);
    }
};


module.exports = bugController;

const mongoose = require('mongoose');
const Bug = require('../models/bug');
const Project = require('../models/project');

const bugController = {};

bugController.reportBug = async (req, res) => {
    try {
        const { projectId, assignedTo, priority, severity, name, description, stepsToReproduce, deadline, status, comments } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }

        const newBug = new Bug({

            projectId: project._id,
            reportedBy: req.user.userId,
            reportTime: Date.now(),
            assignedTo,
            priority,
            severity,
            name,
            description,
            stepsToReproduce,
            deadline,
            status,
            resolvedTime: null,
            comments
        });

        await newBug.save();

        project.bugs.push(newBug._id);
        await project.save();

        res.status(201).send(newBug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

bugController.getAllBugs = async (req, res) => {
    try {
        const userId = req.user.userId;

        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        const projectIds = projects.map(project => project._id);

        const bugs = await Bug.find({
            projectId: { $in: projectIds },
        });

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

bugController.getTotalBugsCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        const projectIds = projects.map(project => project._id);

        const totalBugsCount = await Bug.countDocuments({
            projectId: { $in: projectIds },
        });

        res.status(200).send({ totalBugsCount });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};

bugController.getOpenBugsCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        const projectIds = projects.map(project => project._id);

        const openBugsCount = await Bug.countDocuments({
            projectId: { $in: projectIds },
            status: 'Open',
        });

        res.status(200).send({ openBugsCount });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, bug');
    }
};


bugController.getBugById = async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id)
            .populate('reportedBy', 'name')  
            .populate('assignedTo', 'name'); 

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
        const userId = req.user.userId;

        const isUserAssigned = await Project.exists({
            _id: projectId,
            $or: [
                { managerId: userId },  
                { managers: userId },   
                { developers: userId }, 
            ],
        });

        if (!isUserAssigned) {
            return res.status(403).send('You do not have access to bugs in this project.');
        }

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
            name,
            description,
            stepsToReproduce, 
            deadline, 
            status
        } = req.body;


        if (status === 'Resolved' && !req.body.hasOwnProperty('resolvedTime')) {
            // Fetch the existing bug to check for comments and save new date
            const existingBug = await Bug.findById(req.params.id);
            req.body.resolvedTime = new Date();

            // // Check if there is at least one comment
            // if (!existingBug.comments || existingBug.comments.length === 0 || !existingBug.comments[0].comment) {
            //     return res.status(400).send('At least one comment is required to move to "Resolved" status.');
            // }

        } else if (status !== 'Resolved') {
            req.body.resolvedTime = null;
        }
        
        // Update object
        const updateData = {
            ...(assignedTo && { assignedTo }),
            ...(priority !== undefined && { priority }),
            ...(severity !== undefined && { severity }),
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(stepsToReproduce && { stepsToReproduce }),
            ...(deadline && { deadline }),
            ...(status && { status }),
            resolvedTime: req.body.resolvedTime
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

bugController.addCommentToBug = async (req, res) => {
    try {
        const { bugId } = req.params;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).send('Comment is required.');
        }

        const addCommentToBug = async (bugId, userId, comment) => {
            try {
                const bug = await Bug.findById(bugId);

                if (!bug) {
                    console.error(`Bug with ID ${bugId} not found`);
                    return null;
                }

                const newComment = {
                    userId,
                    comment,
                    date: new Date(),
                };

                bug.comments.push(newComment);
                await bug.save();

                console.log(`Comment added to Bug ${bugId}`);
                return newComment;
            } catch (error) {
                console.error('Error adding comment to bug:', error);
                return null;
            }
        };

        const newComment = await addCommentToBug(bugId, req.user.userId, comment);

        if (!newComment) {
            return res.status(404).send(`Bug with ID ${bugId} not found.`);
        }

        res.status(200).send(newComment);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, addCommentToBug');
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

bugController.getTotalBugsInProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        const totalBugs = await Bug.countDocuments({ projectId });

        res.status(200).json({ totalBugs });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, getTotalBugsInProject');
    }
};


bugController.searchAndSortBugs = async (req, res) => {
    try {
        const { priority, severity, name, status, sortField, sortOrder, assignedFilter} = req.body;

        let query = {};

        // Search criteria
        if (name) {
            query.name = { $regex: new RegExp(name, 'i') };
        }
        if (status) {
            query.status = status;
        }

        const userAssignedProjects = await Project.find({
            $or: [
                { managerId: req.user.userId },
                { developers: req.user.userId }
            ]
        });

        let bugs = await Bug.find(query);

        if (assignedFilter === 'All') {
            const projectIds = userAssignedProjects.map(project => project._id);
            query.projectId = { $in: projectIds };
            bugs = await Bug.find(query);
        } else if (assignedFilter === 'Assigned') {
            const assignedBugs = await Bug.find({
                assignedTo: req.user.userId,
                ...query
            });
            bugs = assignedBugs.filter(bug => {
                return userAssignedProjects.some(project => project._id.equals(bug.projectId));
            });
        }

        // Filter by priority and severity
        if (priority !== undefined || severity !== undefined) {
            bugs = bugs.filter((bug) => (
                (priority === undefined || bug.priority === priority) &&
                (severity === undefined || bug.severity === severity)
            ));
        }

        // Check for valid sort request
        if (sortField && sortOrder) {
            const validSortFields = ['severity', 'priority'];
            const validSortOrders = ['asc', 'desc'];

            if (!validSortFields.includes(sortField)) {
                return res.status(400).json({ error: `Invalid sort field: ${sortField}` });
            }

            if (!validSortOrders.includes(sortOrder)) {
                return res.status(400).json({ error: `Invalid sort order: ${sortOrder}` });
            }

            // Sort based on valid request
            bugs.sort((a, b) => {
                if (sortOrder === 'asc') {  // Ascending order
                    return a[sortField] > b[sortField] ? 1 : -1;
                } else {                    // Descending order
                    return a[sortField] < b[sortField] ? 1 : -1;
                }
            });
        }

        return res.json(bugs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

bugController.recentlySolvedBugs = async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log("Hello")

        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        const projectIds = projects.map(project => project._id);

        console.log(projectIds)

        const recentlySolved = await Bug.find({
            projectId: { $in: projectIds },
            status: 'Resolved',
            resolvedTime: { $ne: null },
        }).sort({ resolvedTime: -1 });

        console.log("List of recently resolved bugs: ")
        console.log(recentlySolved)

        res.status(200).send(recentlySolved);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, recentlySolvedBugs');
    }
};

bugController.totalBugsReportedLast6Months = async (req, res) => {
    try {
        const userId = req.user.userId;

        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        const projectIds = projects.map(project => project._id);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);


        //Find bugs 
        const bugs = await Bug.find({
            projectId: { $in: projectIds },
            reportTime: { $gte: sixMonthsAgo },
        });

        const monthlyCounts = Array(6).fill(0);

        bugs.forEach((bug) => {
            const reportDate = new Date(bug.reportTime);
            const monthDifference = (sixMonthsAgo.getMonth() - reportDate.getMonth() +
                                     (sixMonthsAgo.getFullYear() - reportDate.getFullYear()) * 12) % 6;


            if (monthDifference <= 0 && monthDifference >= -6) {
                monthlyCounts[(6 + monthDifference) % 6]++;
            } 
        });

        //Oldest to newest
        const reversedCounts = monthlyCounts.reverse();

        res.status(200).send(reversedCounts);

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, totalBugsReportedLast6Months');
    }
};


bugController.bugsChart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chartType = req.params.type; // 'priority' or 'severity'

        const projects = await Project.find({
            $or: [
                { managerId: userId },
                { managers: userId },
                { developers: userId },
            ],
        });

        const projectIds = projects.map(project => project._id);

        const bugs = await Bug.find({
            projectId: { $in: projectIds },
            // Optionally, add other filters here
        });

        const counts = bugs.reduce((acc, bug) => {
            const value = bug[chartType];
            if (value >= 1 && value <= 5) {
                acc[value - 1]++;
            }
            return acc;
        }, [0, 0, 0, 0, 0]);

        res.status(200).send(counts);
    } catch (error) {
        console.error(error);
        res.status(500).send(`Server error, bugsBy${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`);
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

const User = require('../models/user');
const bcrypt = require('bcrypt');

const userController = {};


userController.viewProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const userProfile = {
            username: user.username,
            name: user.name,
            role: user.role,
            developerType: user.developerType,
        };

        res.status(200).send(userProfile);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, viewProfile');
    }
};

//Nhu: im not sure if u guys want to put this function on userController or projectController. Binh pls test and take care of this part for me thanks.
// userController.getAllDeveloper = async (req, res) => {
//     try {
//         const devs = [];
//         const users = await User.find();
//         for (const user of users) {
//             if (user.role === "Developer") {
//                 devs.push(user);
//             }
//         }
//         res.status(200).send(devs);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server error, findDevelopers');
//     }
// };

userController.findDeveloper = async (req, res) => {
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

userController.updateUser = async (req, res) => {
    try {
        const { username, password, name, role, developerType } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if the user making the request is the same as the user being updated
        if (req.user.userId !== user._id.toString()) {
            return res.status(403).send('Access denied. You can only update your own profile.');
        }

        // Update the user fields if they are provided
        if (username) user.username = username;

        if (password) {
            // Password validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).send('Password does not meet the required criteria');
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            user.password = hashedPassword;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (developerType) user.developerType = developerType;

        await user.save();

        res.status(200).send({
            id: user._id,
            username: user.username,
            name: user.name,
            role: user.role,
            developerType: user.developerType
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, updateUser');
    }
};

module.exports = userController;
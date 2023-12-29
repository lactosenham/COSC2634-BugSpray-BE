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
userController.getAllDeveloper = async (req, res) => {
    try {
        const devs = [];
        const users = await User.find();
        for (const user of users) {
            if (user.role === "Developer") {
                devs.push(user);
            }
        }
        res.status(200).send(devs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, findDevelopers');
    }
};

userController.updateUser = async (req, res) => {
    try {
        const { username, password, name, role, developerType } = req.body;
        const userId = req.user.userId;

        const updateData = {};

        // Add fields to the update object only if they are provided and not null/undefined
        if (username != null) updateData.username = username;
        if (name != null) updateData.name = name;
        if (role != null) updateData.role = role;
        if (developerType != null) updateData.developerType = developerType;

        // Password Validation
        if (password != null) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).send('Password does not meet the required criteria');
            }
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(password, saltRounds);
        }

        // Update only if updateData is not empty
        if (Object.keys(updateData).length === 0) {
            return res.status(400).send('No valid fields provided for update');
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }

        res.status(200).send({
            id: updatedUser._id,
            username: updatedUser.username,
            name: updatedUser.name,
            role: updatedUser.role,
            developerType: updatedUser.developerType
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, updateUser');
    }
};

module.exports = userController;
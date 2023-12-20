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


userController.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, developerType } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

       
        if (name) {
            user.name = name;
        }

        if (developerType) {
            user.developerType = developerType;
        }

       
        await user.save();

     
        const userProfile = {
            username: user.username,
            name: user.name,
            role: user.role,
            developerType: user.developerType,
        };

        res.status(200).send(userProfile);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, updateProfile');
    }
};

module.exports = userController;

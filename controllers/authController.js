const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authController = {};

authController.register = async (req, res) => {
    try {
        const { username, password, name, role, developerType } = req.body;

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send('Password does not meet the required criteria');
        }

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).send('User already exists');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = new User({
            username,
            password: hashedPassword,
            name,
            role,
            developerType
        });

        await user.save();

        res.status(201).send({ id: user._id, username, name, role, developerType });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, register');
    }
};


authController.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        const tokenPayload = {
            userId: user._id,
            role: user.role,
            developerType: user.developerType
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, login');
    }
};


module.exports = authController;

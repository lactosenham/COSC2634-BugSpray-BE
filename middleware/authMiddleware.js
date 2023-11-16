const jwt = require('jsonwebtoken');

const authMiddleware = {};

authMiddleware.isManager = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(decoded);

        if (req.user.role !== 'Manager') {
            return res.status(403).send('Access denied. Not authorized.');
        }

        console.log(decoded);

        next();
    } catch (ex) {
        res.status(400).send('Invalid token, isManager');
    }
};

authMiddleware.isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token, isAuthenticated');
    }
};

module.exports = authMiddleware;

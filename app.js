require('dotenv').config({ path: './.env' });

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');


const authRoutes = require('./routes/authRoutes'); 
const projectRoutes = require('./routes/projectRoutes');
const bugRoutes = require('./routes/bugRoutes');
const bugController = require('./controllers/bugController');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Use JSON middleware
app.use(express.json());
app.use(bodyParser.json());

// Use CORS middleware
app.use(cors());

// Endpoint to receive GitHub webhook payloads
app.post('/webhook', (req, res) => {
    const payload = req.body;
    console.log('Received GitHub Payload:', JSON.stringify(payload, null, 2));
    try {
        bugController.processGitHubPayload(payload);
        res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error('Error processing GitHub payload:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Use Authentication Routes
app.use('/auth', authRoutes); 

// Use Project Routes
app.use('/projects', projectRoutes);

// Use Bug Routes
app.use('/bugs', bugRoutes);

// Use User Routes
app.use('/user', userRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

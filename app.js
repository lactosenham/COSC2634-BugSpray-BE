require('dotenv').config({ path: './.env' });
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes'); 
const projectRoutes = require('./routes/projectRoutes');
const bugRoutes = require('./routes/bugRoutes');
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

app.use('/auth', authRoutes); 

// Use Project Routes
app.use('/projects', projectRoutes);

// Use Bug Routes
app.use('/bugs', bugRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['Manager', 'Developer'], default: 'Developer' },
    developerType: {
        type: String,
        enum: ['Front-end', 'Back-end', 'Full-stack', 'DevOps', 'Cloud', null],
        default: null
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

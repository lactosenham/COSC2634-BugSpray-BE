const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const bugSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reportTime: {
        type: Date,
        default: Date.now,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    priority: { type: Number, default: 0 },
    severity: { type: Number, default: 0 },
    name: { type: String, required: true },  
    description: { type: String, default: '' },  
    stepsToReproduce: { type: String, default: '' },
    deadline: { type: Date, default: null },
    status: { type: String, enum: ['Open', 'To-do', 'In Progress', 'Resolved', 'In-Review', 'Closed'], default: 'Open' },
    resolvedTime: {
        type: Date,
        default: null,
    },
    comments: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        comment: { type: String, default: '' },
        date: { type: Date, default: Date.now }
    }]
});


const Bug = mongoose.model('Bug', bugSchema);

module.exports = Bug;

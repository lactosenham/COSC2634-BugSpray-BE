const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name: { type: String, required: true, default: '' },
    description: { type: String, default: '' },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    managers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    developers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    bugs: [{ type: Schema.Types.ObjectId, ref: 'Bug', default: [] }],
});

const Project = mongoose.model('Project', projectSchema);


module.exports = Project;


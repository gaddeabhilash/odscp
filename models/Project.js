const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectName: {
      type: String,
      required: [true, 'Please add a project name'],
    },
    status: {
      type: String,
      enum: ['Design', 'Execution', 'Completed'],
      default: 'Design',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);

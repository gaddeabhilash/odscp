const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');

const verifyProjectAccess = asyncHandler(async (req, res, next) => {
  // Can get projectId from params, body, or query depending on route structure
  const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

  if (!projectId) {
    res.status(400);
    throw new Error('Please provide a projectId');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (req.user.role === 'admin') {
    req.project = project; // Pass along reference
    return next();
  }

  // If client, ensure they own it
  if (req.user.role === 'client' && project.clientId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this project');
  }

  req.project = project;
  next();
});

module.exports = { verifyProjectAccess };

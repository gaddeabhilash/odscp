const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = asyncHandler(async (req, res) => {
  const { clientId, projectName } = req.body;

  if (!clientId || !projectName) {
    res.status(400);
    throw new Error('Please add clientId and projectName');
  }

  const project = await Project.create({
    clientId,
    projectName,
  });

  const populatedProject = await project.populate('clientId', 'name email');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: populatedProject,
  });
});

// @desc    Get projects by clientId
// @route   GET /api/projects/client/:clientId
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { clientId } = req.params;

  // Access control
  if (req.user.role === 'client' && req.user.id !== clientId) {
    res.status(403);
    throw new Error('Not authorized to view these projects');
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = { clientId };

  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .populate('clientId', 'name email')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'Projects fetched successfully',
    count: projects.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: projects,
  });
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).populate('clientId', 'name email');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: updatedProject,
  });
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private/Admin
const getAllProjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const total = await Project.countDocuments();
  const projects = await Project.find()
    .populate('clientId', 'name email')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'All projects fetched successfully',
    total,
    data: projects,
  });
});

module.exports = {
  createProject,
  getProjects,
  updateProject,
  getAllProjects,
};

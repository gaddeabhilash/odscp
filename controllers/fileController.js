const asyncHandler = require('express-async-handler');
const FileModel = require('../models/File');

// @desc    Add file to project
// @route   POST /api/files
// @access  Private/Admin
const addFile = asyncHandler(async (req, res) => {
  // verifyProjectAccess middleware guards this
  const projectId = req.project._id;

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const fileUrl = req.file.path;
  const filePublicId = req.file.filename;
  const fileName = req.file.originalname || 'Uploaded File';

  const newFile = await FileModel.create({
    projectId,
    fileName,
    fileUrl,
    filePublicId,
  });

  const populatedFile = await newFile.populate('projectId', 'projectName');

  res.status(201).json({
    success: true,
    message: 'File added successfully',
    data: populatedFile,
  });
});

// @desc    Get files for project
// @route   GET /api/files/project/:projectId
// @access  Private
const getFiles = asyncHandler(async (req, res) => {
  // verifyProjectAccess safeguards this payload
  const projectId = req.project._id;

  const files = await FileModel.find({ projectId })
    .populate('projectId', 'projectName')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'Files fetched successfully',
    count: files.length,
    data: files,
  });
});

module.exports = {
  addFile,
  getFiles,
};

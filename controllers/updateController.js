const asyncHandler = require('express-async-handler');
const Update = require('../models/Update');
const { cloudinary } = require('../config/cloudinary');

// @desc    Create project update
// @route   POST /api/updates
// @access  Private/Admin
const createUpdate = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  
  // Note: verifyProjectAccess middleware protects and attaches req.project
  const projectId = req.project._id;

  if (!title) {
    res.status(400);
    throw new Error('Please add a title');
  }

  let mediaUrl = '';
  let mediaPublicId = '';
  let mediaType = '';

  if (req.file) {
    mediaUrl = req.file.path;
    mediaPublicId = req.file.filename; 
    mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  }

  const newUpdate = await Update.create({
    projectId,
    title,
    description,
    mediaUrl,
    mediaPublicId,
    mediaType,
  });

  const populatedUpdate = await newUpdate.populate('projectId', 'projectName status');

  res.status(201).json({
    success: true,
    message: 'Update created successfully',
    data: populatedUpdate,
  });
});

// @desc    Get updates for a project
// @route   GET /api/updates/project/:projectId
// @access  Private
const getUpdates = asyncHandler(async (req, res) => {
  // Access control handled by verifyProjectAccess middleware
  const projectId = req.project._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const total = await Update.countDocuments({ projectId });
  const updates = await Update.find({ projectId })
    .populate('projectId', 'projectName clientId status progress')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'Updates fetched successfully',
    count: updates.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: updates,
  });
});

// @desc    Delete update
// @route   DELETE /api/updates/:id
// @access  Private/Admin
const deleteUpdate = asyncHandler(async (req, res) => {
  const updateId = req.params.id;
  const updateItem = await Update.findById(updateId);

  if (!updateItem) {
    res.status(404);
    throw new Error('Update not found');
  }

  // Delete media from Cloudinary if exists
  if (updateItem.mediaPublicId) {
    await cloudinary.uploader.destroy(updateItem.mediaPublicId, {
      resource_type: updateItem.mediaType === 'video' ? 'video' : 'image',
    });
  }

  await updateItem.deleteOne();

  res.status(200).json({ 
    success: true, 
    message: 'Update deleted successfully',
    id: updateId 
  });
});

// @desc    Update an existing update
// @route   PATCH /api/updates/:id
// @access  Private/Admin
const updateUpdate = asyncHandler(async (req, res) => {
  const updateItem = await Update.findById(req.params.id);

  if (!updateItem) {
    res.status(404);
    throw new Error('Update not found');
  }

  // Update fields
  if (req.body.title) updateItem.title = req.body.title;
  if (req.body.description) updateItem.description = req.body.description;

  const updatedUpdate = await updateItem.save();

  res.status(200).json({
    success: true,
    message: 'Update modified successfully',
    data: updatedUpdate,
  });
});

module.exports = {
  createUpdate,
  getUpdates,
  updateUpdate,
  deleteUpdate,
};

const asyncHandler = require('express-async-handler');
const https = require('https');
const Update = require('../models/Update');
const FileModel = require('../models/File');
const { cloudinary, getSignedUrl } = require('../config/cloudinary');

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
    
    if (req.file.mimetype === 'application/pdf') {
      mediaType = 'document';
    } else {
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }
  }

  const newUpdate = await Update.create({
    projectId,
    title,
    description,
    mediaUrl,
    mediaPublicId,
    mediaType,
  });

  // If it's a PDF, also add it to the File collection so it shows in "Documents"
  if (mediaType === 'document' && req.file) {
    await FileModel.create({
      projectId,
      fileName: req.file.originalname || title || 'Document Update',
      fileUrl: mediaUrl,
      filePublicId: mediaPublicId,
      resourceType: 'raw', // Cloudinary treats PDFs as raw usually
    });
  }

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

  // Generate signed URLs for all media to bypass Cloudinary security restrictions
  const updatesWithSignedUrls = await Promise.all(updates.map(async (update) => {
    const updateObj = update.toObject();
    if (update.mediaUrl && update.mediaPublicId) {
      // Map mediaType to Cloudinary resource_type
      let resourceType = 'image';
      if (update.mediaType === 'video') resourceType = 'video';
      if (update.mediaType === 'document') resourceType = 'raw';
      // Use transformation for images only to ensure they are optimized without breaking signatures
      const transformation = resourceType === 'image' ? 'q_auto,f_auto,w_800,c_limit' : null;
      updateObj.mediaUrl = await getSignedUrl(update.mediaPublicId, resourceType, transformation);
    }
    return updateObj;
  }));

  res.status(200).json({
    success: true,
    message: 'Updates fetched successfully',
    count: updates.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: updatesWithSignedUrls,
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
    try {
      await cloudinary.uploader.destroy(updateItem.mediaPublicId, {
        resource_type: updateItem.mediaType === 'video' ? 'video' : 'image',
      });
    } catch (err) {
      console.log(`[Delete Update] Media not found or failed: ${err.message}`);
    }
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

// @desc    Proxy download from Cloudinary to bypass security issues
// @route   GET /api/updates/:id/download
// @access  Private
const downloadProxy = asyncHandler(async (req, res) => {
  const update = await Update.findById(req.params.id);
  if (!update || !update.mediaUrl) {
    res.status(404);
    throw new Error('Media not found');
  }

  // Get the signed URL
  let resourceType = 'image';
  if (update.mediaType === 'video') resourceType = 'video';
  if (update.mediaType === 'document') resourceType = 'raw';
  
  const signedUrl = await getSignedUrl(update.mediaPublicId, resourceType);
  console.log(`[Proxy] Attempting to fetch update media: ${signedUrl}`);

  const tryFetch = async (urlVariation, index) => {
    // 1. Fetch definitive details from Admin API on the first attempt
    if (index === 0) {
      console.log(`[Proxy Update] Deep Probing: ${update.mediaPublicId}`);
      const probeTypes = (resourceType === 'raw' || resourceType === 'image') ? ['raw', 'image'] : [resourceType];
      let found = false;

      for (const pType of probeTypes) {
        try {
          const details = await cloudinary.api.resource(update.mediaPublicId, { resource_type: pType });
          update.version = details.version;
          update.type = details.type;
          update.actualResourceType = pType;
          console.log(`[Proxy Update] Confirmed Version: ${update.version}, Type: ${update.type}, Res: ${pType}`);
          found = true;
          break;
        } catch (err) {
          console.log(`[Proxy Update] Probe as ${pType} failed: ${err.message}`);
        }
      }
      
      if (!found) {
        console.log(`[Proxy Update] All probes failed, using defaults`);
      }
    }

    console.log(`[Proxy Update] Trying Variation ${index}: ${urlVariation}`);
    https.get(urlVariation, (cloudinaryRes) => {
      if (cloudinaryRes.statusCode === 200) {
        console.log(`[Proxy Update] Success with Variation ${index}`);
        res.setHeader('Content-Type', cloudinaryRes.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${update.title || 'media'}.${resourceType === 'video' ? 'mp4' : 'pdf'}"`);
        return cloudinaryRes.pipe(res);
      }

      console.log(`[Proxy Update] Variation ${index} failed: ${cloudinaryRes.statusCode}`);
      
      const v = update.version || '1';
      const t = update.type || 'upload';
      const r = update.actualResourceType || resourceType;

      const variations = [
        cloudinary.url(update.mediaPublicId, { resource_type: r, type: t, version: v, sign_url: true, secure: true }),
        cloudinary.url(update.mediaPublicId, { resource_type: r, type: t, sign_url: true, secure: true }), // No version
        cloudinary.utils.private_download_url(update.mediaPublicId, '', { resource_type: r, type: 'authenticated', secure: true }),
        cloudinary.utils.private_download_url(update.mediaPublicId, '', { resource_type: r, type: 'upload', secure: true }),
        cloudinary.url(update.mediaPublicId, { resource_type: 'image', type: t, version: v, sign_url: true, secure: true }),
        cloudinary.url(update.mediaPublicId.replace(/\.pdf$/i, ''), { resource_type: 'image', type: t, version: v, sign_url: true, secure: true }),
        cloudinary.url(update.mediaPublicId, { resource_type: r, type: 'authenticated', sign_url: true, secure: true }),
        cloudinary.url(update.mediaPublicId, { resource_type: r, type: 'private', sign_url: true, secure: true }),
      ];

      if (index < variations.length) {
        tryFetch(variations[index], index + 1);
      } else {
        res.status(cloudinaryRes.statusCode || 401).json({ 
          message: 'Failed to fetch media from all available storage paths',
          error: cloudinaryRes.statusMessage
        });
      }
    }).on('error', (err) => {
      res.status(500).json({ message: 'Stream error', error: err.message });
    });
  };

  tryFetch(signedUrl, 0);
});

module.exports = {
  createUpdate,
  getUpdates,
  updateUpdate,
  deleteUpdate,
  downloadProxy,
};

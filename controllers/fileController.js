const asyncHandler = require('express-async-handler');
const https = require('https');
const FileModel = require('../models/File');
const { cloudinary, getSignedUrl } = require('../config/cloudinary');

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
  
  // Detect resource type accurately
  let resourceType = req.file.resource_type;
  if (!resourceType) {
    if (req.file.mimetype === 'application/pdf') {
      resourceType = 'raw';
    } else if (req.file.mimetype.startsWith('video')) {
      resourceType = 'video';
    } else {
      resourceType = 'image';
    }
  }
  
  const fileName = req.file.originalname || 'Uploaded File';

  const newFile = await FileModel.create({
    projectId,
    fileName,
    fileUrl,
    filePublicId,
    resourceType,
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

  // Generate signed URLs for all files to bypass Cloudinary security restrictions
  const filesWithSignedUrls = await Promise.all(files.map(async (file) => {
    const fileObj = file.toObject();
    const transformation = file.resourceType === 'image' ? 'q_auto,f_auto,w_300,c_scale' : null;
    fileObj.fileUrl = await getSignedUrl(file.filePublicId, file.resourceType || 'auto', transformation);
    return fileObj;
  }));

  res.status(200).json({
    success: true,
    message: 'Files fetched successfully',
    count: files.length,
    data: filesWithSignedUrls,
  });
});



// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private/Admin
const deleteFile = asyncHandler(async (req, res) => {
  const fileId = req.params.id;
  const fileItem = await FileModel.findById(fileId);

  if (!fileItem) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Delete from Cloudinary if public ID exists
  if (fileItem.filePublicId) {
    try {
      await cloudinary.uploader.destroy(fileItem.filePublicId, {
        resource_type: fileItem.resourceType || 'image'
      });
    } catch (err) {
      console.log(`[Delete] Cloudinary asset not found or failed: ${err.message}`);
    }
  }

  await fileItem.deleteOne();

  res.status(200).json({ success: true, data: { id: fileItem._id } });
});

// @desc    Proxy download from Cloudinary to bypass security issues
// @route   GET /api/files/:id/download
// @access  Private
const downloadProxy = asyncHandler(async (req, res) => {
  const file = await FileModel.findById(req.params.id);
  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Get the signed URL (already fixed to handle security)
  console.log(`[Proxy] DB URL: ${file.fileUrl}`);
  const signedUrl = await getSignedUrl(file.filePublicId, file.resourceType || 'auto');
  console.log(`[Proxy] Attempting to fetch: ${signedUrl}`);

  const tryFetch = async (urlVariation, index) => {
    // 1. Fetch definitive details from Admin API on the first attempt
    if (index === 0) {
      console.log(`[Proxy] Deep Probing: ${file.filePublicId}`);
      const probeTypes = ['raw', 'image'];
      let found = false;
      
      for (const pType of probeTypes) {
        try {
          const details = await cloudinary.api.resource(file.filePublicId, { resource_type: pType });
          file.version = details.version;
          file.type = details.type;
          file.actualResourceType = pType;
          console.log(`[Proxy] Confirmed Version: ${file.version}, Type: ${file.type}, Res: ${pType}`);
          found = true;
          break;
        } catch (err) {
          console.log(`[Proxy] Probe as ${pType} failed: ${err.message}`);
        }
      }
      
      if (!found) {
        console.log(`[Proxy] All probes failed, using defaults`);
      }
    }

    console.log(`[Proxy] Trying Variation ${index}: ${urlVariation}`);
    https.get(urlVariation, (cloudinaryRes) => {
      if (cloudinaryRes.statusCode === 200) {
        console.log(`[Proxy] Success with Variation ${index}`);
        res.setHeader('Content-Type', cloudinaryRes.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        return cloudinaryRes.pipe(res);
      }

      console.log(`[Proxy] Variation ${index} failed: ${cloudinaryRes.statusCode}`);
      
      const v = file.version || '1';
      const t = file.type || 'upload';
      const r = file.actualResourceType || (file.resourceType === 'auto' ? 'raw' : file.resourceType);

      const variations = [
        cloudinary.url(file.filePublicId, { resource_type: r, type: t, version: v, sign_url: true, secure: true }),
        cloudinary.url(file.filePublicId, { resource_type: r, type: t, sign_url: true, secure: true }), // No version
        cloudinary.utils.private_download_url(file.filePublicId, '', { resource_type: r, type: 'authenticated', secure: true }),
        cloudinary.utils.private_download_url(file.filePublicId, '', { resource_type: r, type: 'upload', secure: true }),
        cloudinary.url(file.filePublicId, { resource_type: 'image', type: t, version: v, sign_url: true, secure: true }),
        cloudinary.url(file.filePublicId.replace(/\.pdf$/i, ''), { resource_type: 'image', type: t, version: v, sign_url: true, secure: true }),
        cloudinary.url(file.filePublicId, { resource_type: r, type: 'authenticated', sign_url: true, secure: true }),
        cloudinary.url(file.filePublicId, { resource_type: r, type: 'private', sign_url: true, secure: true }),
      ];

      if (index < variations.length) {
        tryFetch(variations[index], index + 1);
      } else {
        res.status(cloudinaryRes.statusCode || 401).json({ 
          message: 'Failed to fetch file from all available storage paths',
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
  addFile,
  getFiles,
  deleteFile,
  downloadProxy,
};

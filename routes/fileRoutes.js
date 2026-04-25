const express = require('express');
const router = express.Router();
const { addFile, getFiles, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { verifyProjectAccess } = require('../middleware/projectAccess');
const { upload } = require('../config/cloudinary');

router.route('/')
  .post(protect, authorize('admin'), upload.single('file'), verifyProjectAccess, addFile);

router.route('/project/:projectId')
  .get(protect, verifyProjectAccess, getFiles);

router.route('/:id/delete')
  .post(protect, authorize('admin'), deleteFile);

module.exports = router;

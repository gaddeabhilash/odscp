const express = require('express');
const router = express.Router();
const { createUpdate, getUpdates, deleteUpdate } = require('../controllers/updateController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { verifyProjectAccess } = require('../middleware/projectAccess');
const { upload } = require('../config/cloudinary');

router.route('/')
  .post(protect, authorize('admin'), verifyProjectAccess, upload.single('media'), createUpdate);

router.route('/project/:projectId')
  .get(protect, verifyProjectAccess, getUpdates);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteUpdate);

module.exports = router;

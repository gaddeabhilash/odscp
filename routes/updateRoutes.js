const express = require('express');
const router = express.Router();
const { createUpdate, getUpdates, updateUpdate, deleteUpdate, downloadProxy } = require('../controllers/updateController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { verifyProjectAccess } = require('../middleware/projectAccess');
const { upload } = require('../config/cloudinary');

router.route('/')
  .post(protect, authorize('admin'), upload.single('media'), verifyProjectAccess, createUpdate);

router.route('/project/:projectId')
  .get(protect, verifyProjectAccess, getUpdates);

router.route('/:id/download')
  .get(protect, downloadProxy);

router.route('/:id')
  .patch(protect, authorize('admin'), updateUpdate)
  .delete(protect, authorize('admin'), deleteUpdate);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validateMiddleware');
const { createProject, getProjects, updateProject, getAllProjects, getAggregateData } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, authorize('admin'), validate([
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('projectName').notEmpty().withMessage('Project Name is required')
  ]), createProject)
  .get(protect, authorize('admin'), getAllProjects);

router.route('/client/:clientId/aggregate')
  .get(protect, getAggregateData);

router.route('/client/:clientId')
  .get(protect, getProjects);

router.route('/:id')
  .put(protect, authorize('admin'), updateProject);

module.exports = router;

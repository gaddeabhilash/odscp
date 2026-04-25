const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title for the update'],
    },
    description: {
      type: String,
    },
    mediaUrl: {
      type: String, // Cloudinary URL
    },
    mediaPublicId: {
      type: String, // Cloudinary public_id used for deletion
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Update', updateSchema);

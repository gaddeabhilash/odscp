const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    fileName: {
      type: String,
      required: [true, 'Please provide a file name'],
    },
    fileUrl: {
      type: String, // Cloudinary URL or regular file link
      required: true,
    },
    filePublicId: {
      type: String, // For deletion
      required: true,
    },
    resourceType: {
      type: String, // 'image', 'video', or 'raw'
      default: 'image',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('File', fileSchema);

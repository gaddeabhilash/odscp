const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Setup multer storage for cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'odscp_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'pdf'],
    resource_type: 'auto', // supports video and image
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };

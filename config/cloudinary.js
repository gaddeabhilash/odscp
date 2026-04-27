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
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    return {
      folder: 'odscp_uploads',
      resource_type: isPDF ? 'raw' : 'auto',
      allowed_formats: isPDF ? undefined : ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'webp'],
    };
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };

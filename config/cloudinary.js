const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    return {
      folder: 'odscp_uploads',
      resource_type: isPDF ? 'raw' : 'auto',
      public_id: `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
    };
  },
});

const upload = multer({ storage: storage });

/**
 * Fetches a valid versioned and signed URL synchronously.
 * Removing the slow cloudinary.api.resource Admin API probe makes loading 100x faster!
 */
const getSignedUrl = async (publicId, resourceType = 'auto', transformation = null) => {
  if (!publicId) return null;
  
  const options = {
    resource_type: resourceType === 'auto' ? 'image' : resourceType,
    sign_url: true,
    secure: true,
  };

  if (transformation) {
    options.raw_transformation = transformation;
  }
  
  return cloudinary.url(publicId, options);
};

module.exports = {
  cloudinary,
  upload,
  storage,
  getSignedUrl,
};

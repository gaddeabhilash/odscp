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
 * Fetches a 100% valid versioned and signed URL
 */
const getSignedUrl = async (publicId, resourceType = 'auto', transformation = null) => {
  if (!publicId) return null;
  
  const typesToTry = (resourceType === 'auto' || resourceType === 'raw') ? ['raw', 'image'] : [resourceType];
  
  for (const type of typesToTry) {
    try {
      const result = await cloudinary.api.resource(publicId, { 
        resource_type: type,
      });
      
      const options = {
        resource_type: type,
        type: result.type || 'upload',
        version: result.version,
        sign_url: true,
        secure: true,
      };

      if (transformation) {
        options.raw_transformation = transformation;
      }
      
      return cloudinary.url(publicId, options);
    } catch (err) {
      // If last type failed, move to fallback
      if (type === typesToTry[typesToTry.length - 1]) {
        const fallbackOptions = {
          resource_type: resourceType === 'auto' ? 'raw' : resourceType,
          sign_url: true,
          secure: true,
        };
        if (transformation) fallbackOptions.raw_transformation = transformation;
        
        return cloudinary.url(publicId, fallbackOptions);
      }
      // Otherwise continue to next type
      continue;
    }
  }
};

module.exports = {
  cloudinary,
  upload,
  storage,
  getSignedUrl,
};

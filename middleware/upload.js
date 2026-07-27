const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // userId is accessible due to authMiddleware
    const userId = req.user ? req.user._id.toString() : 'guest';
    const timestamp = Date.now();
    return {
      folder: 'budgetwise/avatars',
      public_id: `${userId}_${timestamp}`,
      allowed_formats: ['jpg', 'jpeg', 'png']
    };
  },
});

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;

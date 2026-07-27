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
    const random = Math.floor(Math.random() * 1000);
    return {
      folder: 'budgetwise/activities',
      public_id: `activity_${userId}_${timestamp}_${random}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    };
  },
});

// Multer upload instance
const uploadActivity = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = uploadActivity;

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dajteimpn',
  api_key: process.env.CLOUDINARY_API_KEY || '561328671521375',
  api_secret: process.env.CLOUDINARY_API_SECRET || '-2zd3qEaMkueioFXKWUHd2vOL00'
});

// Storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menu-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menu-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }]
  }
});

module.exports = {
  cloudinary,
  imageStorage,
  videoStorage
};


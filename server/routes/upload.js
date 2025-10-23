const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, authorize } = require('../middleware/auth');

// יצירת תיקיית uploads אם לא קיימת
const uploadDir = process.env.UPLOAD_DIR || './uploads';
['images', 'videos'].forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// הגדרת אחסון
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    const subDir = isVideo ? 'videos' : 'images';
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

// פילטר קבצים
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, MP4, WEBM allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  }
});

// העלאת תמונה
router.post('/image', [
  authenticateToken,
  authorize('admin', 'editor'),
  upload.single('image')
], (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/images/${req.file.filename}`;
    res.json({
      message: 'Image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// העלאת וידאו
router.post('/video', [
  authenticateToken,
  authorize('admin', 'editor'),
  upload.single('video')
], (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/videos/${req.file.filename}`;
    res.json({
      message: 'Video uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// מחיקת קובץ
router.delete('/file', [
  authenticateToken,
  authorize('admin', 'editor')
], (req, res) => {
  try {
    const { filename, type } = req.body; // type: 'image' or 'video'
    
    if (!filename || !type) {
      return res.status(400).json({ error: 'Missing filename or type' });
    }

    const subDir = type === 'video' ? 'videos' : 'images';
    const filePath = path.join(uploadDir, subDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;


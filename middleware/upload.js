const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadBase = path.join('/data', 'uploads');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(uploadBase, 'courses/handouts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `course-${req.params.id || uniqueSuffix}-handout${ext}`);
  }
});

// Configure storage for question images
const questionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =  path.join(uploadBase, 'questions');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `question-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for option images
const optionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =  path.join(uploadBase, 'options');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `option-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// File filter to allow only image files
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Create separate upload instances
const uploadQuestionImage = multer({
  storage: questionStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for question images
  }
}).single('question_image');

const uploadOptionImage = multer({
  storage: optionStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit for option images
  }
}).single('option_image');
// Middleware for single file upload
const uploadHandout = upload.single('handout_pdf');

// Middleware to handle upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'File size too large (max 100MB)'
        : 'File upload error'
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  next();
};

// Middleware to handle upload errors
const handleImageUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Image size too large'
        : 'Image upload error'
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading image'
    });
  }
  next();
};

// Middleware to get the uploaded image path
const getUploadedImagePath = (req, res, next) => {
  if (req.file) {
    // Remove 'public/' from the path for client-side access
    req.imagePath = req.file.path.replace('public/', '');
  }
  next();
};

module.exports = {
  uploadHandout,
  handleUploadErrors,
  uploadQuestionImage,
  uploadOptionImage,
  handleImageUploadErrors,
  getUploadedImagePath
};
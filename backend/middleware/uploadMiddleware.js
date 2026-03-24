const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (documents only)
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/jpeg",
    "image/png"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, Word, TXT, and images are allowed."
      ),
      false
    );
  }
};

// Main upload (used in your route)
const upload = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Optional: allow any file type
const uploadAnyFile = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, true),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

module.exports = {
  upload,
  uploadAnyFile
};
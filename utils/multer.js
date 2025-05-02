const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/signup");

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
}

// Set up the storage engine for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files in "uploads/signup" directory
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname); // Get file extension
        cb(null, Date.now() + fileExtension); // Generate unique filename
    },
});

// File filter for image, video, and audio files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|pdf|jpg|png|gif|mp4|mkv|mp3|wav|aac/; // Allowed image, video, and audio types
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extName) {
        return cb(null, true);
    } else {
        return cb(new Error("Only image, video, or audio files are allowed!"), false);
    }
};

// Configure Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

module.exports = upload;

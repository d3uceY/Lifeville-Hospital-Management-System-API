import multer from "multer";

// Configure multer to store files in memory as Buffer
const storage = multer.memoryStorage();

// File filter (optional - to restrict file types)
const fileFilter = (req, file, cb) => {
    // Accept images and PDFs
    // if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
};

// Create multer upload instance
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

// For routes that don't have files but still send multipart/form-data
export const uploadNone = multer().none();

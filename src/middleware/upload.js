import multer from "multer";

/**
 * Multer storage configuration - stores files in memory as Buffer
 * Files will be available as req.file.buffer
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate uploaded file types
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object containing file information
 * @param {Function} cb - Callback function (error, acceptFile)
 */
const fileFilter = (req, file, cb) => {
    // Accept images and PDFs
    // if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed'), false);
    }
};

/**
 * Multer upload instance configured for file uploads
 * - Stores files in memory (req.file.buffer)
 * - Restricts file size to 5MB
 * - Only accepts image files
 * 
 * @example
 * router.post('/upload', upload.single('image'), controller);
 */
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

/**
 * Multer middleware for parsing multipart/form-data without files
 * Use this when the form sends multipart data but contains no file uploads
 * All form fields will be available in req.body
 * 
 * @example
 * router.post('/data', uploadNone, controller);
 */
export const uploadNone = multer().none();

/**
 * Creates middleware for optional single file upload
 * Handles multipart/form-data with an optional file field
 * 
 * @param {string} fieldName - The name of the file input field in the form
 * @returns {Function} Express middleware function
 * 
 * @description
 * - If file is provided: Available in req.file
 * - If no file provided: req.file will be undefined (no error thrown)
 * - All other form fields: Available in req.body
 * - File validation: Uses the fileFilter defined above
 * - Size limit: 5MB maximum
 * 
 * @example
 * // In routes
 * router.put('/lab-tests/:id', uploadOptionalSingle('results_image'), updateLabTest);
 * 
 * // In controller
 * export const updateLabTest = async (req, res) => {
 *     console.log(req.body);  // All form fields
 *     console.log(req.file);  // File object or undefined
 *     
 *     if (req.file) {
 *         // Handle file upload
 *         const imageUrl = await uploadToCloudinary(req.file.buffer);
 *     }
 *     // Continue processing...
 * };
 */
export const uploadOptionalSingle = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            // If error is about missing file, ignore it since it's optional
            if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
                return next();
            }
            if (err) {
                return next(err);
            }
            next();
        });
    };
};

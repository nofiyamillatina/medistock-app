import multer from 'multer';

const MAX_PHARMACY_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHARMACY_IMAGE_BYTES, files: 1, fields: 0, parts: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error('Format foto harus JPG, PNG, atau WebP.');
      error.code = 'UNSUPPORTED_IMAGE_TYPE';
      callback(error);
      return;
    }
    callback(null, true);
  }
});

export const parsePharmacyImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'Ukuran foto maksimal 4 MB.' });
    }
    if (error.code === 'UNSUPPORTED_IMAGE_TYPE') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ success: false, message: 'Unggah satu file foto pada field image.' });
    }
    console.error('Pharmacy image multipart parsing failed.', error?.code || error?.name || 'UNKNOWN');
    return res.status(400).json({ success: false, message: 'Data upload foto tidak valid.' });
  });
};

export const MAX_PHARMACY_IMAGE_BYTES_ALLOWED = MAX_PHARMACY_IMAGE_BYTES;

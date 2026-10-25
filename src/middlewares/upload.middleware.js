const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { sendError } = require('../utils/response.util');

const PRODUCT_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/products');

if (!fs.existsSync(PRODUCT_UPLOADS_DIR)) {
  fs.mkdirSync(PRODUCT_UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP image files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const uploadProductImage = (req, res, next) => {
  const singleUpload = upload.single('image');

  singleUpload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size exceeds limit. Maximum allowed size is 10MB.', 400);
        }
        return sendError(res, `Upload error: ${err.message}`, 400);
      }
      return sendError(res, err.message, 400);
    }

    if (!req.file) {
      return next();
    }

    try {
      if (!fs.existsSync(PRODUCT_UPLOADS_DIR)) {
        fs.mkdirSync(PRODUCT_UPLOADS_DIR, { recursive: true });
      }

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `product-${uniqueSuffix}.webp`;
      const outputPath = path.join(PRODUCT_UPLOADS_DIR, filename);

      const compressedBuffer = await sharp(req.file.buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

      await fs.promises.writeFile(outputPath, compressedBuffer);

      req.file.filename = filename;
      req.file.path = outputPath;
      req.file.mimetype = 'image/webp';
      req.file.size = compressedBuffer.length;

      next();
    } catch (compressionErr) {
      console.error('[Upload Middleware Error - Sharp Compression]:', compressionErr);
      return sendError(res, 'Gagal memproses dan mengompres gambar produk.', 500);
    }
  });
};

module.exports = {
  uploadProductImage,
  PRODUCT_UPLOADS_DIR
};

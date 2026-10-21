const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');

/**
 * Safely delete a file from the uploads directory.
 * @param {string} relativeFilePath - e.g. "/uploads/products/prod-123.jpg" or "uploads/products/prod-123.jpg"
 * @returns {boolean} true if deleted, false if file did not exist or path is invalid
 */
const deleteFile = (relativeFilePath) => {
  if (!relativeFilePath || typeof relativeFilePath !== 'string') {
    return false;
  }

  const cleanPath = relativeFilePath.replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(PROJECT_ROOT, cleanPath);

  if (!absolutePath.startsWith(UPLOADS_DIR)) {
    console.warn(`[File Util]: Blocked attempt to delete file outside uploads directory: ${relativeFilePath}`);
    return false;
  }

  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`[File Util Error]: Failed to delete file ${absolutePath}:`, err);
    }
  }

  return false;
};

module.exports = {
  deleteFile,
  PROJECT_ROOT,
  UPLOADS_DIR
};

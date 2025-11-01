const asyncErrorHandler = require('../utils/asyncErrorHandler');
const globalErrorHandler = require('../utils/globalErrorHandler');
const fs = require('fs');

const removeFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) console.error("File remove failed:", err.message);
  });
};

const mediaUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.files || Object.values(req.files).flat().length === 0) return next();

  const files = Object.values(req.files).flat();

  for (const file of files) {
    const isImage = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    const isVideo = file.mimetype === 'video/mp4';

    if (!isImage && !isVideo) {
      removeFile(file.tempFilePath);
      return next(new globalErrorHandler('Unsupported file detected', 400));
    }

    if (isVideo && file.size > 2 * 1024 * 1024 * 1024) {
      removeFile(file.tempFilePath);
      return next(new globalErrorHandler(`${file.name} exceeds the 2GB video limit`, 400));
    }

    if (isImage && file.size > 2 * 1024 * 1024) {
      removeFile(file.tempFilePath);
      return next(new globalErrorHandler(`${file.name} exceeds the 5MB image limit`, 400));
    }
  }

  next();
});

module.exports = mediaUpload;

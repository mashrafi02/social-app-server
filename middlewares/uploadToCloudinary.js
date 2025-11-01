const asyncErrorHandler = require('../utils/asyncErrorHandler');
const globalErrorHandler = require('../utils/globalErrorHandler');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');



const uploadToCloudinary = asyncErrorHandler( async (req, res, next) => {

    if (!req.files || Object.values(req.files).flat().length === 0) return next();

    let {path} = req.body;
    const files = Object.values(req.files).flat();
    const images = [];
    const videos = [];

    for (const file of files) {
        if(file.mimetype === 'video/mp4') {
            const {url} = await cloudUpload(file, `${path}/videos/`)
            videos.push(url)
        };
        if(file.mimetype.startsWith('image')) {
            const {url} = await cloudUpload(file, `${path}/images/`)
            images.push(url)
        };

        removeFile(file.tempFilePath)
    }

    req.uploadedFiles = { images, videos };
    next()

})


const cloudUpload = async (file, path, next) => {
    return new Promise((resolve,reject) => {
        cloudinary.uploader.upload(
            file.tempFilePath,
            { folder: path, resource_type: 'auto' },
            (err, result) => {
                if (err) {
                    removeFile(file.tempFilePath)
                    return reject(new Error("File upload failed"));
                }
                resolve({
                    url: result.secure_url,
                });
            }
        )
    })
}


const removeFile = (path) => {
    fs.unlink(path, (err) => {
      if (err) console.error("File remove failed:", err.message);
    });
  };


module.exports = uploadToCloudinary
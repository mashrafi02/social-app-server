const express = require('express');
const router = express.Router();
const protect = require('../middlewares/validateUser');
const mediaUpload = require('../middlewares/mediaUpload');
const uploadToCloudinary = require('../middlewares/uploadToCloudinary');
const {createPost} = require('../controllers/postControllers')


router.route('/create-post').post(protect, mediaUpload, uploadToCloudinary, createPost);



module.exports = router
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const globalErrorHandler = require('../utils/globalErrorHandler');
const User = require('../models/userModel');
const Post = require('../models/postModel');


const createPost = asyncErrorHandler( async (req, res, next) => {

    const { images = [], videos = [] } = req.uploadedFiles || {};
    const body = req.body;

    if ( images?.length === 0 && videos?.length === 0 && body?.text === ("" || undefined)) return next (new globalErrorHandler('No post content found', 400));

    await Post.create({
                       ...body,
                       images,
                       videos,
                       user:req.user._id});

    res.status(201).json({
        status: 'success',
        message: 'Your new post has created successfully'
    })
})


module.exports = {createPost};
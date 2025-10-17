const jwt = require('jsonwebtoken');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const globalErrorHandler = require('../utils/globalErrorHandler');
const User = require('../models/userModel');
const signToken = require('../utils/signToken');
const sendMail = require('../utils/sendMail');
const Queue = require('bull');


const emailQueue = new Queue('sendMail', {
    redis:{
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD
    }
})


const registration = asyncErrorHandler( async (req, res, next) => {
    const newUser = await User.create(req.body);
    const user = await User.findOne({_id:newUser._id});

    const verifyToken = signToken(user._id, '10m');
    const requestURL = `${process.env.CLIENT_LOCAL_URL}/verify/${verifyToken}`;

    const mailOptions = {
        email: user.email,
        subject: 'Verify Your Email at Social',
        userName: user.fName,
        message: 'to verify your email at social',
        requestURL
    }
    
    // await emailQueue.add('verifyMail', mailOptions, {
    //     attempts:5,
    //     backoff:5000,
    //     removeOnComplete:true
    // });

    res.status(201).json({
        status:'succes',
        message:'account created successfully. Please verify your email to continue. Please check your email',
    })
});


const verifyMail = asyncErrorHandler( async (req, res, next) => {
    const {token} = req.params;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        await User.findByIdAndUpdate(decodedToken.id, {emailVerified:true});

        res.status(200).json({
            status:'success',
            message: 'Email verified Successfully'
        })

    } catch (err) {
        if(err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError'){
            res.status(400).json({
                status:'fail',
                message: 'Invalid token or Token expired. Please try log in again'
            })
        }
    }
});


const login = asyncErrorHandler(async (req, res, next) => {
    const {email, password} = req.body;

    const userExists = await User.findOne({email}).select('+password');
    if(!userExists) return next(new globalErrorHandler('User not found', 404));

    if(!(await userExists.comparePassword(password))) return next(new globalErrorHandler('invalid password', 400));

    if(!userExists.emailVerified) {
        const verifyToken = signToken(userExists._id, '10m');
        const requestURL = `${process.env.CLIENT_LOCAL_URL}/verify/${verifyToken}`;
        const mailOptions = {
                            email: userExists.email,
                            subject: 'Verify Your Email at Social',
                            userName: userExists.fName,
                            message: 'to verify your email at social',
                            requestURL
                        };
        await emailQueue.add('verifyMail', mailOptions, {
                                                            attempts:5,
                                                            backoff:5000,
                                                            removeOnComplete:true
                                                        });

        return res.status(200).json({
                status:'running',
                message:'Please verify your email to continue',
            })
    };

    const accessToken = signToken(userExists._id, '7d');
    const userData = await User.findById(userExists._id);

    res.status(200).json({
        status:'success',
        message:'logged in successfully',
        data:{
            userData,
            accessToken
        }
    })
});


emailQueue.process('verifyMail', async job => {
    await sendMail(job.data)
})


module.exports = {registration, verifyMail, login}
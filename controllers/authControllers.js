const jwt = require('jsonwebtoken');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const globalErrorHandler = require('../utils/globalErrorHandler');
const User = require('../models/userModel');
const signToken = require('../utils/signToken');
const sendMail = require('../utils/sendMail');
const Queue = require('bull');
const crypto = require('crypto');
const sendResetEmail = require('../utils/sendResetMail');


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

    const verifyToken = await user.createEmailVerificationToken();
    await user.save({validateBeforeSave : false});
    
    const requestURL = `${process.env.CLIENT_LOCAL_URL}/verify/${verifyToken}`;

    const mailOptions = {
        email: user.email,
        subject: 'Verify Your Email at Social',
        userName: user.fName,
        message: 'to verify your email at social',
        requestURL
    }
    
    await emailQueue.add('verifyMail', mailOptions, {
        attempts:5,
        backoff:5000,
        removeOnComplete:true
    });

    res.status(201).json({
        status:'succes',
        message:'account created successfully. Please verify your email to continue. Please check your email',
    })
});


const verifyMail = asyncErrorHandler( async (req, res, next) => {
    const {token} = req.params;

    if(!token) return next(new globalErrorHandler('No verification code found', 404));

    const reqToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({emailVerificationToken:reqToken, emailVerificationTokenExpires: {$gt:Date.now()}});

    if(!user) return next(new globalError('Invalid Token or token has expired. Log in to get a new one',400));

    if(user.emailVerified) return next(new globalErrorHandler('The account is already verified', 400));

    await User.findByIdAndUpdate(user._id, {
        emailVerified:true,
        emailVerificationToken:undefined,
        emailVerificationTokenExpires:undefined
    });

    res.status(200).json({
        status:'success',
        message: 'Email verified Successfully',
        userId: user._id
    })

});


const reVerifyMail = asyncErrorHandler( async (req, res, next) => {

    const user = await User.findById(req.user._id);

    const verifyToken = await user.createEmailVerificationToken();
    await user.save({validateBeforeSave : false});
    
    const requestURL = `${process.env.CLIENT_LOCAL_URL}/verify/${verifyToken}`;

    const mailOptions = {
        email: user.email,
        subject: 'Verify Your Email at Social',
        userName: user.fName,
        message: 'to verify your email at social',
        requestURL
    }
    
    await emailQueue.add('verifyMail', mailOptions, {
        attempts:5,
        backoff:5000,
        removeOnComplete:true
    });

    res.status(201).json({
        status:'succes',
        message:'Verification mail sent successfully',
    })
});


const login = asyncErrorHandler(async (req, res, next) => {
    const {email, password} = req.body;

    const userExists = await User.findOne({email}).select('+password');
    if(!userExists) return next(new globalErrorHandler('User not found', 404));

    if(!(await userExists.comparePassword(password))) return next(new globalErrorHandler('invalid password', 400));

    const accessToken = signToken(userExists._id.toString(), '7d');
    const userData = await User.findById(userExists._id);

    if(!userExists.emailVerified) {

        const now = new Date();
        const createdAt = new Date(userData.createdAt);
        const diff = (now - createdAt) / (1000 * 60);
        
        if(diff > 10){
            const verifyToken = await userData.createEmailVerificationToken();
            await userData.save({validateBeforeSave:false});

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
        }

        return res.status(200).json({
                status:'not verified',
                message:'Please verify your email to continue',
                data : {
                    userData,
                    accessToken
                }
            })
    };

    res.status(200).json({
        status:'verified',
        message:'logged in successfully',
        data:{
            userData,
            accessToken
        }
    })
});


const matchMail = asyncErrorHandler( async (req, res, next) => {
    const {email} = req.body;

    const mailMatched = await User.findOne({email});

    if(!mailMatched) return next(new globalErrorHandler('This email does not exists', 404));

    res.status(200).json({
        status: 'success',
        message: 'Email match found',
        data : {
            email: mailMatched.email,
            profilePic: mailMatched.profilePic
        }
    })
});


const sendResetPassToken = asyncErrorHandler( async (req, res, next) => {
    const {email} = req.body;
    const user = await User.findOne({email});

    const resetPassToken = await user.createResetPasswordToken();
    user.save({validateBeforeSave:false});

    const mailOptions = {
                        email,
                        subject: 'Reset Password validation token',
                        userName: user.fName,
                        message: 'to reset your password of your social account',
                        resetPassToken
                    };
    await emailQueue.add('resetMail', mailOptions, {
                                                        attempts:5,
                                                        backoff:5000,
                                                        removeOnComplete:true
                                                    });

    res.status(200).json({
        status:'success',
        message: 'reset password token sent successfully'
    })
    
})


const verifyResetPassToken = asyncErrorHandler( async (req, res, next) => {
    const {email,token} = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({email,resetPasswordToken, resetPasswordTokenExpires: {$gt: Date.now()}});

    if(!user) return next(new globalErrorHandler('Invalid token or token has expired', 400));

    user.resetPasswordToken = undefined;
    await user.save({validateBeforeSave:false});

    res.status(200).json({
        status: 'success',
        message: 'Token matched'
    })
})


const resetPassword = asyncErrorHandler( async (req, res, next) => {
    const {email, password, confirmPassword} = req.body;

    const user = await User.findOne({email, resetPasswordTokenExpires: {$gt: Date.now()}});

    if(!user) return next(new globalErrorHandler('Your 5 minutes time limit has expired', 401));

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.resetPasswordTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save({validateModifiedOnly:true});

    res.status(200).json({
        status: 'success',
        message:'Password changed successfull'
    })
})


emailQueue.process('verifyMail', async job => {
    await sendMail(job.data)
})

emailQueue.process('resetMail', async job => {
    await sendResetEmail(job.data)
})


module.exports = {registration, verifyMail, reVerifyMail, login, matchMail, sendResetPassToken, verifyResetPassToken, resetPassword}
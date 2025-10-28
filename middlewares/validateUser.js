const User = require('../models/userModel');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const globalError = require('../utils/globalErrorHandler');
const jwt = require('jsonwebtoken');


const protect = asyncErrorHandler ( async (req, res, next) => {
    const testToken = req.headers.authorization;
    let token;

    if (testToken && testToken.startsWith('Bearer')){
        token = testToken.split(' ')[1]
    }else{
        return next(new globalError('You are not ALlowed to perform this task', 401))
    }

    const verifyToken = await jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(verifyToken.id);

    if(!user) {
         return next(new globalError('The user does not exists with the given token', 401))
    }

    const isPasswordChnaged = await user.isPasswordChnaged(verifyToken.iat);
    if(isPasswordChnaged){
        return next(new globalError('Invalid token. Your password was changed',401))
    }

    req.user = user;
    next()
} );


module.exports = protect
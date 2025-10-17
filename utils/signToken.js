const jwt = require('jsonwebtoken');

const signToken = (id, expiresIn) => {
    return jwt.sign({id}, process.env.JWT_SECRET_KEY, {expiresIn})
}

module.exports = signToken;
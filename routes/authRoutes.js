const express = require('express');
const router = express.Router();
const {registration, verifyMail, login} = require('../controllers/authControllers');


router.route('/registration').post(registration);
router.route('/verify/:token').get(verifyMail);
router.route('/login').post(login);


module.exports = router
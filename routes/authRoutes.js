const express = require('express');
const router = express.Router();
const {registration, verifyMail, login, reVerifyMail, matchMail, sendResetPassToken, verifyResetPassToken, resetPassword} = require('../controllers/authControllers');
const protect = require('../middlewares/validateUser');


router.route('/registration').post(registration);
router.route('/verify/:token').patch(verifyMail);
router.route('/re-verify-mail').patch(protect, reVerifyMail);
router.route('/login').post(login);
router.route('/match-mail').post(matchMail);
router.route('/reset-mail').post(sendResetPassToken);
router.route('/verify-reset-pass-token').post(verifyResetPassToken);
router.route('/reset-password').post(resetPassword);


module.exports = router
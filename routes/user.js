const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const auth = require('../middleware/auth');
const nocache = require('../middleware/nocache');

// LOGIN PAGE
router.get('/login', auth.isLogin, userController.loadLogin);
router.post('/login', userController.login);

// REGISTER PAGE
router.get('/register', auth.isLogin, userController.loadRegister);
router.post('/register', userController.registerUser);

// HOME PAGE (requires login + no cache)
router.get('/home', auth.checkSession, nocache, userController.loadHome);

// LOGOUT (prevents back button from showing home page)
router.get('/logout', auth.checkSession, nocache, userController.logout);

router.get('/resend-otp', userController.resendOtp);

router.get('/forgot-password', userController.loadForgotPassword);
router.post('/forgot-password', userController.forgotPassword);

router.post('/verify-reset-otp', userController.verifyResetOtp);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
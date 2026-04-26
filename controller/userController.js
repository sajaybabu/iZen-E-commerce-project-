const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { generateOtp, sendOtpEmail } = require('../services/otpService');

const saltRounds = 10;


// ================= REGISTER =================

// LOAD REGISTER PAGE
const loadRegister = (req, res) => {
    res.render('user/register', { message: "" });
};


// REGISTER USER (SEND OTP)
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.render('user/register', { message: 'All fields are required' });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.render('user/register', { message: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.render('user/register', { message: 'Password must be at least 8 characters' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('user/register', { message: 'User already exists' });
        }

        const otp = generateOtp();

        req.session.otp = otp;
        req.session.otpExpiry = Date.now() + 60 * 1000;
        req.session.userData = { name, email, password };

        await sendOtpEmail(email, otp);

        return res.render('user/verifyOtp', { message: 'OTP sent to your email' });

    } catch (error) {
        console.log(error);
        return res.render('user/register', { message: 'Something went wrong' });
    }
};


// VERIFY OTP (REGISTER)
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.otp || !req.session.userData) {
            return res.redirect('/user/register');
        }

        if (Date.now() > req.session.otpExpiry) {
            return res.render('user/verifyOtp', { message: 'OTP expired. Please resend OTP' });
        }

        if (otp !== req.session.otp) {
            return res.render('user/verifyOtp', { message: 'Invalid OTP' });
        }

        const { name, email, password } = req.session.userData;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await User.create({
            name,
            email,
            password: hashedPassword
        });

        req.session.otp = null;
        req.session.otpExpiry = null;
        req.session.userData = null;

        return res.render('user/login', { message: 'Signup successful. Please login.' });

    } catch (error) {
        console.log(error);
        return res.render('user/verifyOtp', { message: 'Something went wrong' });
    }
};


// RESEND OTP
const resendOtp = async (req, res) => {
    try {
        if (!req.session.userData) {
            return res.redirect('/user/register');
        }

        if (req.session.otpExpiry && Date.now() < req.session.otpExpiry) {
            return res.render('user/verifyOtp', { message: 'Please wait before requesting new OTP' });
        }

        const { email } = req.session.userData;

        const otp = generateOtp();

        req.session.otp = otp;
        req.session.otpExpiry = Date.now() + 60 * 1000;

        await sendOtpEmail(email, otp);

        return res.render('user/verifyOtp', { message: 'OTP resent successfully' });

    } catch (error) {
        console.log(error);
        return res.render('user/verifyOtp', { message: 'Something went wrong' });
    }
};


// ================= LOGIN =================

// LOAD LOGIN PAGE
const loadLogin = (req, res) => {
    res.render('user/login', { message: "" });
};


// LOGIN USER
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('user/login', { message: 'All fields are required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.render('user/login', { message: 'User does not exist' });
        }

        if (user.isBlocked) {
            return res.render('user/login', { message: 'Your account is blocked' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('user/login', { message: 'Incorrect password' });
        }

        req.session.user = user._id;

        return res.redirect('/user/home');

    } catch (error) {
        console.log(error);
        return res.render('user/login', { message: 'Something went wrong' });
    }
};


// ================= FORGOT PASSWORD =================

// LOAD FORGOT PASSWORD PAGE
const loadForgotPassword = (req, res) => {
    res.render('user/forgotPassword', { message: "" });
};


// SEND OTP FOR RESET
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.render('user/forgotPassword', { message: 'User not found' });
        }

        const otp = generateOtp();

        req.session.resetOtp = otp;
        req.session.resetEmail = email;
        req.session.otpExpiry = Date.now() + 60 * 1000;

        await sendOtpEmail(email, otp);

        return res.render('user/resetOtp', { message: 'OTP sent to your email' });

    } catch (error) {
        console.log(error);
        return res.render('user/forgotPassword', { message: 'Something went wrong' });
    }
};


// VERIFY RESET OTP
const verifyResetOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (Date.now() > req.session.otpExpiry) {
            return res.render('user/resetOtp', { message: 'OTP expired' });
        }

        if (otp !== req.session.resetOtp) {
            return res.render('user/resetOtp', { message: 'Invalid OTP' });
        }

        return res.render('user/newPassword', { message: '' });

    } catch (error) {
        console.log(error);
        return res.render('user/resetOtp', { message: 'Something went wrong' });
    }
};


// RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await User.findOneAndUpdate(
            { email: req.session.resetEmail },
            { password: hashedPassword }
        );

        req.session.resetOtp = null;
        req.session.resetEmail = null;
        req.session.otpExpiry = null;

        return res.render('user/login', { message: 'Password reset successful' });

    } catch (error) {
        console.log(error);
        return res.render('user/newPassword', { message: 'Something went wrong' });
    }
};


// ================= HOME =================

// HOME PAGE
const loadHome = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/user/login');
        }

        const user = await User.findById(req.session.user);

        if (!user) {
            req.session.destroy();
            return res.redirect('/user/login');
        }

        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        return res.render('user/userhome');

    } catch (error) {
        console.log(error);
        return res.redirect('/user/login');
    }
};


// LOGOUT
const logout = (req, res) => {
    req.session.destroy(() => {
        return res.redirect('/user/login');
    });
};


module.exports = {
    loadRegister,
    registerUser,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    loadForgotPassword,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    loadHome,
    logout
};
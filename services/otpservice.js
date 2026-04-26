const nodemailer = require("nodemailer");

// generate 6 digit OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};


// send OTP email
const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}`
        });

        console.log("OTP sent successfully");

    } catch (error) {
        console.log("Error sending OTP:", error);
    }
};

module.exports = {
    generateOtp,
    sendOtpEmail
};
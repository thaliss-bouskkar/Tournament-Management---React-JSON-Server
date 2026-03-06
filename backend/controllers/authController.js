const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');

// We create a function to get the transporter so it can dynamically verify environment variables
const getTransporter = () => {
    // Check if the user has left the default template email or is missing credentials
    if (!process.env.EMAIL_USERNAME || process.env.EMAIL_USERNAME === 'your_email@gmail.com') {
        console.log("⚠️ Using Mock Email Transporter (Check console for reset links)");
        // Returns a mock transporter that just logs
        return {
            sendMail: async (mailOptions) => {
                console.log("\n================ MOCK EMAIL ================");
                console.log(`To: ${mailOptions.to}`);
                console.log(`Subject: ${mailOptions.subject}`);
                console.log(`Text: \n${mailOptions.text}`);
                console.log("============================================\n");
                return true;
            }
        };
    }

    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

exports.forgotPassword = async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        if (!admin) {
            return res.status(404).json({ message: 'There is no admin with that email' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token to save to DB
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set token & expire time (10 mins)
        admin.resetPasswordToken = resetTokenHash;
        admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await admin.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested a password reset. Please make a PUT request to the following URL to reset your password: \n\n ${resetUrl}`;

        console.log("Mock Email Sending Mode. Real URL:", resetUrl);

        // Attempt to send email
        try {
            const transporter = getTransporter();
            await transporter.sendMail({
                from: process.env.EMAIL_USERNAME !== 'your_email@gmail.com' ? process.env.EMAIL_USERNAME : 'admin@tournament.local',
                to: admin.email,
                subject: 'Password Reset Token',
                text: message,
            });

            res.status(200).json({ success: true, message: 'Email sent', debugUrl: resetUrl });
        } catch (err) {
            console.error("Email send error:", err);
            admin.resetPasswordToken = undefined;
            admin.resetPasswordExpire = undefined;
            await admin.save({ validateBeforeSave: false });

            return res.status(500).json({ message: 'Email could not be sent. Check backend logs for details.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const admin = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password (it should preferably be hashed, though standard json-server didn't enforce it)
        // We'll leave it plain if the user expects plain text from their json-server days, 
        // OR we can hash it. The prompt asked: "which is hashed before saving to MongoDB."
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        admin.password = hashedPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await admin.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/emailService.js';

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /auth/register
 * Create user + send verification OTP (no auto-login)
 */
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email && !existingUser.isVerified) {
                // Re-send OTP for unverified account
                const otp = generateOTP();
                existingUser.verificationOTP = otp;
                existingUser.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
                await existingUser.save();

                await sendVerificationEmail(email, otp);
                return res.status(200).json({
                    message: 'Verification email re-sent. Please check your inbox.',
                    email,
                    requiresVerification: true
                });
            }
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);
        const otp = generateOTP();

        const newUser = new User({
            username,
            email,
            password: passwordHash,
            isVerified: false,
            verificationOTP: otp,
            verificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        });

        await newUser.save();

        // Send verification email
        await sendVerificationEmail(email, otp);

        res.status(201).json({
            message: 'Registration successful! Please check your email for the verification code.',
            email,
            requiresVerification: true
        });
    } catch (err) {
        console.error("Register Error:", err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

/**
 * POST /auth/verify-email
 * Verify OTP → auto-login + send welcome email
 */
export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        if (user.verificationOTP !== otp) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (user.verificationOTPExpires < new Date()) {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }

        // Mark as verified
        user.isVerified = true;
        user.verificationOTP = null;
        user.verificationOTPExpires = null;
        await user.save();

        // Send welcome email (don't block on failure)
        sendWelcomeEmail(email, user.username).catch(err => {
            console.error('Welcome email failed:', err.message);
        });

        // Auto-login: generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        const userToSend = user.toObject();
        delete userToSend.password;
        delete userToSend.verificationOTP;
        delete userToSend.verificationOTPExpires;

        res.status(200).json({
            message: 'Email verified successfully!',
            token,
            user: userToSend
        });
    } catch (err) {
        console.error("Verify Email Error:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

/**
 * POST /auth/resend-otp
 * Resend OTP (60-second cooldown)
 */
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Cooldown: check if last OTP was sent less than 60 seconds ago
        if (user.verificationOTPExpires) {
            const timeSinceLastOTP = Date.now() - (user.verificationOTPExpires.getTime() - 10 * 60 * 1000);
            if (timeSinceLastOTP < 60 * 1000) {
                const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastOTP) / 1000);
                return res.status(429).json({
                    message: `Please wait ${waitSeconds} seconds before requesting a new code`,
                    retryAfter: waitSeconds
                });
            }
        }

        const otp = generateOTP();
        user.verificationOTP = otp;
        user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(email, otp);

        res.status(200).json({ message: 'New verification code sent!' });
    } catch (err) {
        console.error("Resend OTP Error:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

/**
 * POST /auth/login
 * Login (only verified users)
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User does not exist' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Check verification status
        if (!user.isVerified) {
            // Re-send OTP automatically
            const otp = generateOTP();
            user.verificationOTP = otp;
            user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            await sendVerificationEmail(email, otp);

            return res.status(403).json({
                message: 'Email not verified. A new verification code has been sent to your email.',
                requiresVerification: true,
                email
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const userToSend = user.toObject();
        delete userToSend.password;
        delete userToSend.verificationOTP;
        delete userToSend.verificationOTPExpires;
        delete userToSend.resetPasswordToken;
        delete userToSend.resetPasswordExpires;

        res.status(200).json({ token, user: userToSend });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

/**
 * POST /auth/forgot-password
 * Send password reset link
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists — always show success
            return res.status(200).json({
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({
            message: 'If an account with this email exists, a password reset link has been sent.'
        });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

/**
 * POST /auth/reset-password
 * Reset password using token
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.isVerified = true; // Also verify email if not already
        await user.save();

        res.status(200).json({ message: 'Password reset successful! You can now log in.' });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

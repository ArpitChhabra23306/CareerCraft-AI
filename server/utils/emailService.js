import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        transporter.verify().then(() => {
            console.log('✉️  Email service ready');
        }).catch((err) => {
            console.error('❌ Email service error:', err.message);
        });
    }
    return transporter;
};

/**
 * Send 6-digit OTP verification email
 */
export const sendVerificationEmail = async (email, otp) => {
    const mailOptions = {
        from: `"CareerCraft AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your CareerCraft AI account',
        html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0;">CareerCraft AI</h1>
            </div>
            <div style="background: #fafafa; border: 1px solid #f0f0f0; border-radius: 16px; padding: 32px; text-align: center;">
                <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">Verify your email</h2>
                <p style="color: #999; font-size: 13px; margin: 0 0 24px;">Enter this code to complete your registration</p>
                <div style="background: #111; color: #fff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; border-radius: 12px; display: inline-block;">
                    ${otp}
                </div>
                <p style="color: #bbb; font-size: 12px; margin: 24px 0 0;">This code expires in <strong>10 minutes</strong></p>
            </div>
            <p style="color: #ccc; font-size: 11px; text-align: center; margin-top: 24px;">
                If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
        `,
    };

    await getTransporter().sendMail(mailOptions);
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (email, username) => {
    const mailOptions = {
        from: `"CareerCraft AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to CareerCraft AI! 🚀',
        html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0;">CareerCraft AI</h1>
            </div>
            <div style="background: #fafafa; border: 1px solid #f0f0f0; border-radius: 16px; padding: 32px;">
                <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">Welcome aboard, ${username}!</h2>
                <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
                    Your account has been verified. Here's what you can do:
                </p>
                <div style="space-y: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; margin-bottom: 8px;">
                        <span style="font-size: 16px;">📄</span>
                        <span style="font-size: 13px; color: #333;">Upload documents & chat with AI</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; margin-bottom: 8px;">
                        <span style="font-size: 16px;">⚡</span>
                        <span style="font-size: 13px; color: #333;">Generate quizzes & flashcards</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; margin-bottom: 8px;">
                        <span style="font-size: 16px;">🎯</span>
                        <span style="font-size: 13px; color: #333;">Practice mock interviews</span>
                    </div>
                </div>
                <a href="${process.env.CLIENT_URL}/dashboard" style="display: block; background: #111; color: #fff; text-align: center; padding: 12px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 24px;">
                    Go to Dashboard →
                </a>
            </div>
            <p style="color: #ccc; font-size: 11px; text-align: center; margin-top: 24px;">
                You're receiving this because you signed up for CareerCraft AI.
            </p>
        </div>
        `,
    };

    await getTransporter().sendMail(mailOptions);
};

/**
 * Send password reset email with token link
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const mailOptions = {
        from: `"CareerCraft AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset your password — CareerCraft AI',
        html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0;">CareerCraft AI</h1>
            </div>
            <div style="background: #fafafa; border: 1px solid #f0f0f0; border-radius: 16px; padding: 32px; text-align: center;">
                <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">Reset your password</h2>
                <p style="color: #999; font-size: 13px; margin: 0 0 24px;">Click the button below to set a new password</p>
                <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600;">
                    Reset Password →
                </a>
                <p style="color: #bbb; font-size: 12px; margin: 24px 0 0;">This link expires in <strong>1 hour</strong></p>
            </div>
            <p style="color: #ccc; font-size: 11px; text-align: center; margin-top: 24px;">
                If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
        </div>
        `,
    };

    await getTransporter().sendMail(mailOptions);
};

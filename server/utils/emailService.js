const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const FROM_EMAIL = process.env.SENDER_EMAIL || 'arpitchhara369@gmail.com';
const FROM_NAME = 'CareerCraft AI';

/**
 * Send email using Brevo HTTP API
 */
const sendEmail = async (to, subject, htmlContent) => {
    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: FROM_NAME, email: FROM_EMAIL },
            to: [{ email: to }],
            subject,
            htmlContent,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Brevo API error: ${response.status}`);
    }

    return response.json();
};

/**
 * Send 6-digit OTP verification email
 */
export const sendVerificationEmail = async (email, otp) => {
    await sendEmail(email, 'Verify your CareerCraft AI account', `
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
    `);
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (email, username) => {
    await sendEmail(email, 'Welcome to CareerCraft AI! 🚀', `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0;">CareerCraft AI</h1>
            </div>
            <div style="background: #fafafa; border: 1px solid #f0f0f0; border-radius: 16px; padding: 32px;">
                <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">Welcome aboard, ${username}!</h2>
                <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
                    Your account has been verified. Here's what you can do:
                </p>
                <div>
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
    `);
};

/**
 * Send password reset email with token link
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(email, 'Reset your password — CareerCraft AI', `
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
    `);
};

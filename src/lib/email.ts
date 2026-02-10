import nodemailer from 'nodemailer';

// Create reusable transporter
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

// Generate a random 6-digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
export async function sendOTPEmail(
    to: string,
    otp: string,
    purpose: 'CHANGE_PASSWORD' | 'FORGOT_PASSWORD'
): Promise<boolean> {
    try {
        const transporter = createTransporter();

        const purposeText = purpose === 'FORGOT_PASSWORD'
            ? 'reset your password'
            : 'change your password';

        const mailOptions = {
            from: process.env.SMTP_FROM || `AeroSky <${process.env.SMTP_USER}>`,
            to,
            subject: `AeroSky - Your OTP Code`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0F172A; border-radius: 16px; color: #E2E8F0;">
                    <h1 style="color: #38BDF8; font-size: 24px; margin-bottom: 8px;">AeroSky</h1>
                    <p style="color: #94A3B8; margin-bottom: 24px;">Verification Code</p>
                    
                    <p style="margin-bottom: 16px;">You requested to ${purposeText}. Use the following OTP code:</p>
                    
                    <div style="background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #38BDF8;">${otp}</span>
                    </div>
                    
                    <p style="color: #94A3B8; font-size: 14px; margin-bottom: 8px;">⏱ This code expires in <strong style="color: #E2E8F0;">10 minutes</strong>.</p>
                    <p style="color: #94A3B8; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
                    <p style="color: #64748B; font-size: 12px;">© ${new Date().getFullYear()} AeroSky Aviation. All rights reserved.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to} for ${purpose}`);
        return true;
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        return false;
    }
}

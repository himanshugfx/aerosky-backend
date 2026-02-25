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

// Send welcome email with credentials
export async function sendWelcomeEmail(
    to: string,
    name: string,
    loginEmail: string,
    password: string,
    type: 'organization' | 'team_member'
): Promise<boolean> {
    try {
        const transporter = createTransporter();

        const isOrg = type === 'organization';
        const roleLabel = isOrg ? 'Organization Administrator' : 'Team Member';
        const subjectLine = isOrg
            ? `Welcome to AeroSky — Your Organization is Live`
            : `Welcome to AeroSky — You've Been Onboarded`;

        const mailOptions = {
            from: process.env.SMTP_FROM || `AeroSky <${process.env.SMTP_USER}>`,
            to,
            subject: subjectLine,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0F172A; border-radius: 24px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #334155;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #FB923C 100%); width: 56px; height: 56px; border-radius: 16px; line-height: 56px; margin-bottom: 16px;">
                            <span style="color: white; font-size: 24px; font-weight: 900;">A</span>
                        </div>
                        <h1 style="color: #F8FAFC; font-size: 28px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.5px;">Welcome to AeroSky</h1>
                        <p style="color: #64748B; font-size: 14px; margin: 0; font-weight: 500;">Aviation Compliance & Fleet Management</p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 32px;">
                        <p style="color: #E2E8F0; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">Hello <strong style="color: #F8FAFC;">${name}</strong>,</p>
                        <p style="color: #94A3B8; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
                            ${isOrg
                    ? 'Your organization has been successfully registered on the AeroSky platform. An administrator account has been created for you to manage your fleet, personnel, and compliance operations.'
                    : 'You have been onboarded as a team member on the AeroSky platform. Your account is ready for access to fleet management and compliance operations.'
                }
                        </p>

                        <!-- Role Badge -->
                        <div style="text-align: center; margin-bottom: 24px;">
                            <span style="display: inline-block; background: ${isOrg ? '#F97316' : '#38BDF8'}15; color: ${isOrg ? '#FB923C' : '#38BDF8'}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 8px; border: 1px solid ${isOrg ? '#F97316' : '#38BDF8'}30;">
                                ${roleLabel}
                            </span>
                        </div>

                        <!-- Credentials Box -->
                        <div style="background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                            <p style="color: #64748B; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px;">Your Login Credentials</p>
                            
                            <div style="margin-bottom: 16px;">
                                <p style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Login Email</p>
                                <p style="color: #F8FAFC; font-size: 16px; font-weight: 700; margin: 0; background: #0F172A; padding: 12px 16px; border-radius: 10px; border: 1px solid #334155;">${loginEmail}</p>
                            </div>
                            
                            <div>
                                <p style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Temporary Password</p>
                                <p style="color: #F8FAFC; font-size: 16px; font-weight: 700; margin: 0; background: #0F172A; padding: 12px 16px; border-radius: 10px; border: 1px solid #334155; letter-spacing: 2px;">${password}</p>
                            </div>
                        </div>

                        <!-- Warning Banner -->
                        <div style="background: linear-gradient(135deg, #7C2D1220 0%, #F9731610 100%); border: 1px solid #F9731640; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                            <div style="display: flex; align-items: flex-start; gap: 12px;">
                                <span style="font-size: 20px; line-height: 1;">⚠️</span>
                                <div>
                                    <p style="color: #FB923C; font-size: 14px; font-weight: 800; margin: 0 0 6px;">Security Notice — Action Required</p>
                                    <p style="color: #FDBA74; font-size: 13px; line-height: 1.6; margin: 0;">
                                        Please <strong>change your password immediately</strong> after your first login. Navigate to your <strong>Profile</strong> section to update your credentials and secure your account.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Get Started -->
                        <div style="text-align: center; margin-bottom: 8px;">
                            <p style="color: #94A3B8; font-size: 13px; margin: 0 0 16px;">You can log in using the AeroSky mobile app or web portal.</p>
                            <div style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 14px 40px; border-radius: 14px; text-decoration: none;">
                                <span style="color: #ffffff; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Ready to Launch</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 24px 32px; border-top: 1px solid #1E293B; text-align: center;">
                        <p style="color: #475569; font-size: 11px; margin: 0 0 4px; font-weight: 600;">This is an automated message from AeroSky Aviation.</p>
                        <p style="color: #334155; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} AeroSky Aviation. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${to} (${type})`);
        return true;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return false;
    }
}

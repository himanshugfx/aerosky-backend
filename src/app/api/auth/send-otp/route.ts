import { generateOTP, sendOTPEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { localLoginLimiter } from '@/lib/rate-limiter';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// Input validation schema
const sendOTPSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    purpose: z.enum(['CHANGE_PASSWORD', 'FORGOT_PASSWORD']),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validated = sendOTPSchema.parse(body);
        const { email, purpose } = validated;

        // Apply rate limiting (3 OTP requests per 15 minutes per email)
        const { success, retryAfter } = await localLoginLimiter.limit(email, 3, 15 * 60 * 1000);
        if (!success) {
            return NextResponse.json(
                { error: "Too many OTP requests. Please try again later." },
                { status: 429 }
            );
        }

        // Verify the email belongs to a user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username: email },
                ],
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'No account found with this email' },
                { status: 404 }
            );
        }

        const targetEmail = user.email || user.username;
        if (!targetEmail.includes('@')) {
            return NextResponse.json(
                { error: 'User does not have a valid email address configured' },
                { status: 400 }
            );
        }

        // Delete any existing unused OTPs for this email/purpose
        await prisma.otpVerification.deleteMany({
            where: {
                email: targetEmail,
                purpose,
                verified: false,
            },
        });

        // Generate OTP and hash it for storage
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        // Store OTP in database (expires in 10 minutes)
        await prisma.otpVerification.create({
            data: {
                email: targetEmail,
                otp: otpHash,
                purpose,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        // Send OTP via email
        const sent = await sendOTPEmail(targetEmail, otp, purpose as 'CHANGE_PASSWORD' | 'FORGOT_PASSWORD');

        if (!sent) {
            return NextResponse.json(
                { error: 'Failed to send OTP email. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: 'OTP sent to your email',
            email: targetEmail,
        });
    } catch (error: any) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { 
                    error: "Validation failed",
                    fields: error.flatten().fieldErrors
                },
                { status: 400 }
            );
        }

        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}

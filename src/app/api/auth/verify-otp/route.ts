import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, otp, purpose } = body;

        if (!email || !otp || !purpose) {
            return NextResponse.json(
                { error: 'Email, OTP, and purpose are required' },
                { status: 400 }
            );
        }

        // Find all non-verified, non-expired OTPs for this email and purpose
        // We check against email OR username since they are often the same in this system
        const otpRecords = await prisma.otpVerification.findMany({
            where: {
                email,
                purpose,
                verified: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (otpRecords.length === 0) {
            return NextResponse.json(
                { error: 'OTP expired or not found. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check if any OTP record matches
        let matchedRecord = null;
        for (const record of otpRecords) {
            const isMatch = await bcrypt.compare(otp, record.otp);
            if (isMatch) {
                matchedRecord = record;
                break;
            }
        }

        if (!matchedRecord) {
            return NextResponse.json(
                { error: 'Invalid OTP. Please try again.' },
                { status: 400 }
            );
        }

        // Mark OTP as verified
        await prisma.otpVerification.update({
            where: { id: matchedRecord.id },
            data: { verified: true },
        });

        return NextResponse.json({
            success: true,
            verificationId: matchedRecord.id,
            message: 'OTP verified successfully',
        });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to verify OTP', details: error.message },
            { status: 500 }
        );
    }
}

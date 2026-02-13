import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, newPassword, verificationId } = body;

        if (!email || !newPassword || !verificationId) {
            return NextResponse.json(
                { error: 'Email, new password, and verification ID are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 4) {
            return NextResponse.json(
                { error: 'Password must be at least 4 characters long' },
                { status: 400 }
            );
        }

        // Verify the OTP verification record exists and is verified
        const otpRecord = await prisma.otpVerification.findUnique({
            where: { id: verificationId },
        });

        if (!otpRecord) {
            return NextResponse.json(
                { error: 'Invalid verification. Please request a new OTP.' },
                { status: 400 }
            );
        }

        if (!otpRecord.verified) {
            return NextResponse.json(
                { error: 'OTP not yet verified. Please verify OTP first.' },
                { status: 400 }
            );
        }

        if (otpRecord.email !== email) {
            // Check if it's the username
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { username: email },
                    ],
                },
            });

            if (!user || (user.email !== otpRecord.email && user.username !== otpRecord.email)) {
                return NextResponse.json(
                    { error: 'Email mismatch with verification record.' },
                    { status: 400 }
                );
            }
        }

        // Check if the verification is not too old (30 minutes max after verification)
        const verificationAge = Date.now() - otpRecord.createdAt.getTime();
        if (verificationAge > 30 * 60 * 1000) {
            return NextResponse.json(
                { error: 'Verification expired. Please request a new OTP.' },
                { status: 400 }
            );
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update user password and organization phone in a transaction
        await prisma.$transaction(async (tx) => {
            // Find the user by email
            let user = await tx.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { username: email },
                    ],
                },
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Update user password
            await tx.user.update({
                where: { id: user.id },
                data: { passwordHash },
            });

            // Also update the organization phone field (legacy sync)
            if (user.organizationId) {
                await tx.organization.update({
                    where: { id: user.organizationId },
                    data: { phone: newPassword },
                });
            }

            // Delete all OTP records for this email
            await tx.otpVerification.deleteMany({
                where: { email: otpRecord.email },
            });
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset password' },
            { status: 500 }
        );
    }
}

// Help Center / Support Request API
import { authenticateRequest } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

// Support message schema in database would be ideal, but for now we'll use a simple approach

// GET - Get support messages (for admins/super_admin)
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can view support requests
        if (auth.user.role !== 'ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // For now return a placeholder - in production, query from SupportMessage table
        return NextResponse.json({
            messages: [],
            info: 'Help center messages will appear here'
        });
    } catch (error) {
        console.error('Get support messages error:', error);
        return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
    }
}

// POST - Submit a support request
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subject, message, priority } = body;

        if (!subject || !message) {
            return NextResponse.json(
                { error: 'Subject and message are required' },
                { status: 400 }
            );
        }

        // Determine recipient based on sender's role
        let recipientType: string;
        if (auth.user.role === 'ADMIN') {
            recipientType = 'SUPER_ADMIN'; // Admin contacts developer (super admin)
        } else {
            recipientType = 'ADMIN'; // Staff contacts admin
        }

        // For now, log the support request
        // In production, save to SupportMessage table and send notification
        console.log('Support request received:', {
            from: auth.user.username,
            fromRole: auth.user.role,
            toRole: recipientType,
            subject,
            message,
            priority: priority || 'normal',
            createdAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: `Your message has been sent to ${recipientType === 'SUPER_ADMIN' ? 'Developer Support' : 'Admin'}`,
            ticketId: `SUPPORT-${Date.now()}`
        });
    } catch (error) {
        console.error('Submit support request error:', error);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }
}

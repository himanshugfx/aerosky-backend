import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const rawUrl = process.env.DATABASE_URL || 'NOT_SET';
    // Mask password
    const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ':***@');
    const host = rawUrl.includes('@') ? rawUrl.split('@')[1].split('/')[0] : 'unknown';

    try {
        const userCount = await prisma.user.count();
        const teamCount = await prisma.teamMember.count();
        const teamMembers = await prisma.teamMember.findMany({
            select: { id: true, name: true, email: true, accessId: true }
        });

        return NextResponse.json({
            databaseHost: host,
            databaseUrlMasked: maskedUrl,
            isUsingSupabase: host.includes('supabase.com'),
            userCount,
            teamCount,
            teamMembers,
            message: host.includes('supabase.com')
                ? 'Connected to Supabase'
                : 'Vercel is STILL connected to the old database. Please update DATABASE_URL in your Vercel Dashboard.'
        });
    } catch (err: any) {
        return NextResponse.json({
            databaseHost: host,
            databaseUrlMasked: maskedUrl,
            error: err.message,
            message: 'Database query failed with current Vercel DATABASE_URL'
        }, { status: 500 });
    }
}

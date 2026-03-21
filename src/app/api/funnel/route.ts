import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const defaultStages = [
    { name: 'NEW', order: 1, color: '#94a3b8' },      // slate-400
    { name: 'CONTACTED', order: 2, color: '#3b82f6' }, // blue-500
    { name: 'QUALIFIED', order: 3, color: '#8b5cf6' }, // violet-500
    { name: 'PROPOSAL', order: 4, color: '#f59e0b' }, // amber-500
    { name: 'WON', order: 5, color: '#ea580c' },       // orange-600
    { name: 'LOST', order: 6, color: '#ef4444' },      // red-500
];

async function ensureStagesExist() {
    if (!prisma.funnelStage) {
        throw new Error('Prisma client not initialized with FunnelStage model. Please restart the server.');
    }
    const existingStages = await prisma.funnelStage.findMany();
    if (existingStages.length === 0) {
        for (const stage of defaultStages) {
            await prisma.funnelStage.create({ data: stage });
        }
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ensureStagesExist();

        const stages = await prisma.funnelStage.findMany({
            orderBy: { order: 'asc' },
            include: {
                leads: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                _count: {
                    select: { leads: true }
                }
            }
        });

        const stats = {
            totalLeads: await prisma.lead.count(),
            wonLeads: await prisma.lead.count({ 
                where: { stage: { name: 'WON' } } 
            }),
            totalValue: await prisma.lead.aggregate({
                _sum: { value: true }
            })
        };

        return NextResponse.json({ stages, stats });
    } catch (error) {
        console.error('Error fetching funnel data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

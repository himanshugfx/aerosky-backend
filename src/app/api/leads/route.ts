import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, email, phone, company, source, stageId, value, notes } = body;

        const year = new Date().getFullYear().toString().slice(-2);
        const prefix = `Lead-${year}-`;
        
        const latestLead = await prisma.lead.findFirst({
            where: { id: { startsWith: prefix } },
            orderBy: { id: 'desc' }
        });

        let nextNumber = 1;
        if (latestLead) {
            const parts = latestLead.id.split('-');
            const lastNum = parseInt(parts[2]);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }

        const customId = `${prefix}${nextNumber}`;

        const lead = await prisma.lead.create({
            data: {
                id: customId,
                name,
                email,
                phone,
                company,
                source: source || 'MANUAL',
                stageId,
                value: parseFloat(value) || 0,
                notes,
                activities: {
                    create: {
                        type: 'NOTE',
                        content: 'Lead created manually.'
                    }
                }
            }
        });

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, ...updates } = body;

        const lead = await prisma.lead.update({
            where: { id },
            data: updates
        });

        if (updates.stageId) {
            await prisma.leadActivity.create({
                data: {
                    leadId: id,
                    type: 'STAGE_CHANGE',
                    content: `Lead moved to new stage.`
                }
            });
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Error updating lead:', error);
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const leads = await prisma.lead.findMany({
            include: { stage: true, activities: true },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(leads);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

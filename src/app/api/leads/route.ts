import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/api-auth';
import { checkResourceAccess } from '@/lib/authorize';

export async function GET(req: NextRequest) {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const leads = await prisma.lead.findMany({
            include: { stage: true, activities: true },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(leads);
    } catch (error) {
        console.error('Failed to fetch leads:', error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await req.json();
        const { name, email, phone, company, source, stageId, value, notes } = body;

        const year = new Date().getFullYear().toString().slice(-2);
        const prefix = `Lead-${year}-`;

        // Calculate arithmetic maximum across all leads for this year to avoid string sorting bugs
        const existingLeads = await prisma.lead.findMany({
            where: { id: { startsWith: prefix } },
            select: { id: true }
        });

        let maxNum = 0;
        for (const l of existingLeads) {
            const parts = l.id.split('-');
            if (parts.length >= 3) {
                const num = parseInt(parts[2], 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        }

        // Attempt creation with retry in case of concurrent insert
        let createdLead = null;
        let attempts = 0;
        let nextNumber = maxNum + 1;

        while (!createdLead && attempts < 5) {
            const customId = `${prefix}${String(nextNumber).padStart(5, '0')}`;
            try {
                createdLead = await prisma.lead.create({
                    data: {
                        id: customId,
                        name: name || null,
                        email: email || null,
                        phone: phone || null,
                        company: company || null,
                        source: source || 'MANUAL',
                        stageId: stageId || null,
                        value: value ? parseFloat(value) : 0,
                        notes: notes || null,
                        activities: {
                            create: {
                                type: 'NOTE',
                                content: 'Lead created manually.'
                            }
                        }
                    }
                });
            } catch (err: any) {
                if (err.code === 'P2002') {
                    // Unique constraint collision due to concurrent request: increment and retry
                    nextNumber++;
                    attempts++;
                } else {
                    throw err;
                }
            }
        }

        if (!createdLead) {
            return NextResponse.json({ error: 'Failed to generate unique lead ID after retries' }, { status: 500 });
        }

        return NextResponse.json(createdLead, { status: 201 });
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'edit');
    if (permCheck !== true) return permCheck;

    try {
        const body = await req.json();
        const { id, name, email, phone, company, source, stageId, value, notes, convertedAt } = body;

        if (!id) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (email !== undefined) dataToUpdate.email = email;
        if (phone !== undefined) dataToUpdate.phone = phone;
        if (company !== undefined) dataToUpdate.company = company;
        if (source !== undefined) dataToUpdate.source = source;
        if (stageId !== undefined) dataToUpdate.stageId = stageId;
        if (value !== undefined) dataToUpdate.value = parseFloat(value) || 0;
        if (notes !== undefined) dataToUpdate.notes = notes;
        if (convertedAt !== undefined) dataToUpdate.convertedAt = convertedAt ? new Date(convertedAt) : null;

        const lead = await prisma.lead.update({
            where: { id },
            data: dataToUpdate
        });

        if (stageId) {
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

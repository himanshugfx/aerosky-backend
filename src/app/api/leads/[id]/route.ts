import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const lead = await prisma.lead.findUnique({
            where: { id: params.id },
            include: {
                stage: true,
                activities: {
                    orderBy: { createdAt: 'desc' }
                },
                followUps: {
                    orderBy: { scheduledAt: 'asc' }
                }
            }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        return NextResponse.json(lead);
    } catch (error) {
        console.error("Error fetching lead:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'edit');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { name, email, phone, company, source, stageId, value, notes, convertedAt } = body;

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

        const updatedLead = await prisma.lead.update({
            where: { id: params.id },
            data: dataToUpdate,
            include: { stage: true }
        });

        return NextResponse.json(updatedLead);
    } catch (error) {
        console.error("Error updating lead:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'delete');
    if (permCheck !== true) return permCheck;

    try {
        await prisma.lead.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting lead:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

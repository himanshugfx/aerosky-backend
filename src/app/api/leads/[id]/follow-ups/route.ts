import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, description, scheduledAt } = await request.json();
        const followUp = await prisma.followUp.create({
            data: {
                leadId: params.id,
                title: title || null,
                description: description || null,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            }
        });

        // Also create an activity for this scheduling
        await prisma.leadActivity.create({
            data: {
                leadId: params.id,
                type: 'FOLLOW_UP_SCHEDULED',
                content: `Scheduled: ${title || 'Follow-up'} on ${scheduledAt ? new Date(scheduledAt).toLocaleString() : 'TBD'}`
            }
        });

        return NextResponse.json(followUp, { status: 201 });
    } catch (error) {
        console.error("Error creating follow-up:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

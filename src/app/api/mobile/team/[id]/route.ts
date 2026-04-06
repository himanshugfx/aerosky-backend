import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const existingMember = await prisma.teamMember.findUnique({
            where: { id: params.id }
        });

        if (!existingMember) {
            return NextResponse.json({ error: "Team member not found" }, { status: 404 });
        }

        const body = await request.json();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, ...data } = body;

        const item = await prisma.teamMember.update({
            where: { id: params.id },
            data: data,
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("Update team member error:", error);
        return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const existingMember = await prisma.teamMember.findUnique({
            where: { id: params.id }
        });

        if (!existingMember) {
            return NextResponse.json({ error: "Team member not found" }, { status: 404 });
        }

        // The schema handles cascading delete for the User record if it exists
        await prisma.teamMember.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete team member error:", error);
        return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
    }
}

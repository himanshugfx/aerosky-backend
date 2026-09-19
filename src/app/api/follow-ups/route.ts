import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'lead', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const followUps = await prisma.followUp.findMany({
            include: {
                lead: {
                    select: {
                        name: true,
                        company: true
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });
        return NextResponse.json(followUps);
    } catch (error) {
        console.error("Error fetching follow-ups:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

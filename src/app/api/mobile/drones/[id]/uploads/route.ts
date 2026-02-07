import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const body = await request.json();
        const { uploadType, files, label } = body;

        if (!uploadType || !files || !Array.isArray(files)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Handle file uploads by creating entries in the DroneUpload table
        const uploadEntries = files.map((fileData: string) => ({
            droneId: id,
            uploadType,
            fileData,
            label: label || null,
        }));

        await prisma.droneUpload.createMany({
            data: uploadEntries,
        });

        return NextResponse.json({ success: true }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    } catch (error) {
        console.error("Error creating drone uploads:", error);
        return NextResponse.json({ error: "Failed to create drone uploads" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

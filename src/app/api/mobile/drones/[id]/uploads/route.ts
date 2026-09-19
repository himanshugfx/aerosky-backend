import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_UPLOAD_TYPES = [
    "training_manual",
    "system_design",
    "infrastructure_manufacturing",
    "infrastructure_testing",
    "infrastructure_office",
    "regulatory_display",
    "hardware_security",
];

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function validateFileEntry(file: any): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: "Empty file payload." };
    }

    if (typeof file === "string") {
        const dataUriMatch = file.match(/^data:([a-zA-Z0-9\/+-]+);base64,/);
        if (dataUriMatch) {
            const mime = dataUriMatch[1].toLowerCase();
            if (!ALLOWED_MIME_TYPES.includes(mime)) {
                return { valid: false, error: `Invalid file type: ${mime}. Allowed types: PDF, JPEG, PNG, WebP.` };
            }
        }
        const approxBytes = Math.round(file.length * 0.75);
        if (approxBytes > MAX_FILE_SIZE_BYTES) {
            return { valid: false, error: "File exceeds the 10MB size limit." };
        }
        return { valid: true };
    }

    return { valid: false, error: "Unsupported file payload format." };
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permCheck = checkResourceAccess(auth.user, 'drone', 'edit');
    if (permCheck !== true) return permCheck;

    const { id } = params;

    try {
        const drone = await prisma.drone.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!drone) {
            return NextResponse.json({ error: "Drone not found" }, { status: 404 });
        }

        const body = await request.json();
        const { uploadType, files, label } = body;

        if (!uploadType || !files || !Array.isArray(files)) {
            return NextResponse.json({ error: "Missing required fields (uploadType and files array)" }, { status: 400 });
        }

        if (!ALLOWED_UPLOAD_TYPES.includes(uploadType)) {
            return NextResponse.json({ error: `Invalid uploadType: ${uploadType}` }, { status: 400 });
        }

        for (const f of files) {
            const validation = validateFileEntry(f);
            if (!validation.valid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating drone uploads:", error);
        return NextResponse.json({ error: "Failed to create drone uploads" }, { status: 500 });
    }
}

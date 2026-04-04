import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST upload files for a drone
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        
        // Handle both standard multipart/form-data and JSON
        const contentType = request.headers.get("content-type") || "";
        let uploadType, files, label;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            uploadType = formData.get("uploadType") as string;
            label = formData.get("label") as string;
            
            // Collect all files from form data
            const allFiles = formData.getAll("files");
            files = allFiles.length > 1 ? allFiles : allFiles[0];
        } else {
            const body = await request.json();
            uploadType = body.uploadType;
            files = body.files;
            label = body.label;
        }

        if (!uploadType || !files) {
            return NextResponse.json({ error: "Missing upload data" }, { status: 400 });
        }

        // Delete existing uploads of this type (for single file types like training_manual)
        const singleFileTypes = ["training_manual", "system_design"];
        if (singleFileTypes.includes(uploadType)) {
            await prisma.droneUpload.deleteMany({
                where: { droneId: id, uploadType },
            });
        }

        // For array types, delete all existing and re-add
        const arrayTypes = [
            "infrastructure_manufacturing",
            "infrastructure_testing",
            "infrastructure_office",
            "regulatory_display",
            "hardware_security",
        ];
        if (arrayTypes.includes(uploadType)) {
            await prisma.droneUpload.deleteMany({
                where: { droneId: id, uploadType },
            });
        }

        // Create new uploads
        if (Array.isArray(files)) {
            await prisma.droneUpload.createMany({
                data: (files as any[]).map((f: any) => ({
                    droneId: id,
                    uploadType,
                    fileData: typeof f === 'string' ? f : f, // Adjust based on if it's base64 or blob
                    label: label || null,
                })),
            });
        } else {
            await prisma.droneUpload.create({
                data: {
                    droneId: id,
                    uploadType,
                    fileData: typeof files === 'string' ? files : files,
                    label: label || null,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Critical: Error uploading files:", error.message);
        // Special case for database connection errors (likely Prisma lock issue on user system)
        if (error.message.includes("prisma") || error.message.includes("client")) {
            return NextResponse.json({ 
                error: "Database configuration error. Please restart your dev server.",
                details: "A file lock issue is preventing the database from functioning."
            }, { status: 500 });
        }
        return NextResponse.json({ error: "Failed to process upload. Please check file size." }, { status: 500 });
    }
}

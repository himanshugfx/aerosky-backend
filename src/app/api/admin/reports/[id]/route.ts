import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATION'];

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(auth.user.role)) {
        return NextResponse.json(
            { error: "Forbidden: Administration access required." },
            { status: 403 }
        );
    }

    try {
        const report = await prisma.report.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        email: true,
                        role: true,
                    }
                }
            }
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found." }, { status: 404 });
        }

        return NextResponse.json({ report });
    } catch (error: any) {
        console.error("Error fetching report:", error);
        return NextResponse.json({ error: "Failed to fetch report." }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(auth.user.role)) {
        return NextResponse.json(
            { error: "Forbidden: Administration access required." },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const {
            title,
            description,
            category,
            status,
            period,
            attachment,
            fileName,
            fileSize,
            tags
        } = body;

        const existing = await prisma.report.findUnique({ where: { id: params.id } });
        if (!existing) {
            return NextResponse.json({ error: "Report not found." }, { status: 404 });
        }

        const updated = await prisma.report.update({
            where: { id: params.id },
            data: {
                title: title ? title.trim() : undefined,
                description: description ? description.trim() : undefined,
                category: category ? category.trim() : undefined,
                status: status ? status.trim().toLowerCase() : undefined,
                period: period !== undefined ? period.trim() : undefined,
                attachment: attachment !== undefined ? attachment : undefined,
                fileName: fileName !== undefined ? fileName : undefined,
                fileSize: fileSize !== undefined ? fileSize : undefined,
                tags: tags !== undefined ? tags.trim() : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        email: true,
                        role: true,
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: "Report updated successfully.",
            report: updated
        });
    } catch (error: any) {
        console.error("Error updating report:", error);
        return NextResponse.json({ error: "Failed to update report." }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(auth.user.role)) {
        return NextResponse.json(
            { error: "Forbidden: Administration access required." },
            { status: 403 }
        );
    }

    try {
        const existing = await prisma.report.findUnique({ where: { id: params.id } });
        if (!existing) {
            return NextResponse.json({ error: "Report not found." }, { status: 404 });
        }

        await prisma.report.delete({ where: { id: params.id } });

        return NextResponse.json({
            success: true,
            message: "Report deleted successfully."
        });
    } catch (error: any) {
        console.error("Error deleting report:", error);
        return NextResponse.json({ error: "Failed to delete report." }, { status: 500 });
    }
}

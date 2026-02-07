import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const permCheck = checkResourceAccess(auth.user, 'drone', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const where: any = {};
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const drones = await prisma.drone.findMany({
            where,
            include: {
                uploads: true,
                accountableManager: true,
                manufacturedUnits: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const transformedDrones = drones.map((drone: any) => {
            const uploads = {
                trainingManual: drone.uploads.find((u: any) => u.uploadType === "training_manual")?.fileData,
                infrastructureManufacturing: drone.uploads
                    .filter((u: any) => u.uploadType === "infrastructure_manufacturing")
                    .map((u: any) => u.fileData),
                infrastructureTesting: drone.uploads
                    .filter((u: any) => u.uploadType === "infrastructure_testing")
                    .map((u: any) => u.fileData),
                infrastructureOffice: drone.uploads
                    .filter((u: any) => u.uploadType === "infrastructure_office")
                    .map((u: any) => u.fileData),
                infrastructureOthers: drone.uploads
                    .filter((u: any) => u.uploadType === "infrastructure_others")
                    .map((u: any) => ({ label: u.label || "", image: u.fileData })),
                regulatoryDisplay: drone.uploads
                    .filter((u: any) => u.uploadType === "regulatory_display")
                    .map((u: any) => u.fileData),
                systemDesign: drone.uploads.find((u: any) => u.uploadType === "system_design")?.fileData,
                hardwareSecurity: drone.uploads
                    .filter((u: any) => u.uploadType === "hardware_security")
                    .map((u: any) => u.fileData),
                webPortalLink: drone.webPortalLink,
            };

            return {
                id: drone.id,
                modelName: drone.modelName,
                image: drone.image,
                accountableManagerId: drone.accountableManagerId,
                organizationId: drone.organizationId,
                createdAt: drone.createdAt.toISOString(),
                uploads,
                manufacturedUnits: drone.manufacturedUnits.map((u: any) => ({
                    serialNumber: u.serialNumber,
                    uin: u.uin,
                })),
                recurringData: drone.recurringData,
            };
        });

        return NextResponse.json(transformedDrones);
    } catch (error) {
        console.error("Error fetching drones:", error);
        return NextResponse.json({ error: "Failed to fetch drones" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const permCheck = checkResourceAccess(auth.user, 'drone', 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { modelName, image, manufacturedUnits, organizationId } = body;

        // Use provided organizationId if super admin, else use current user's org
        const targetOrgId = auth.user.role === 'SUPER_ADMIN' ? organizationId : auth.user.organizationId;

        const drone = await prisma.drone.create({
            data: {
                modelName,
                image,
                organizationId: targetOrgId,
                manufacturedUnits: {
                    create: (manufacturedUnits || []).map((unit: any) => ({
                        serialNumber: unit.serialNumber,
                        uin: unit.uin,
                    })),
                },
            },
            include: {
                manufacturedUnits: true,
            },
        });

        return NextResponse.json(drone, { status: 201 });
    } catch (error) {
        console.error("Error creating drone:", error);
        return NextResponse.json({ error: "Failed to create drone" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

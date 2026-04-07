import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const drone = await prisma.drone.findUnique({
            where: { id },
            include: {
                uploads: true,
                accountableManager: true,
                manufacturedUnits: true,
            },
        });

        if (!drone) {
            return NextResponse.json({ error: "Drone not found" }, { status: 404 });
        }

        // Organization scoping check - removed

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

        const transformedDrone = {
            id: drone.id,
            modelName: drone.modelName,
            image: drone.image,
            accountableManagerId: drone.accountableManagerId,
            createdAt: drone.createdAt.toISOString(),
            uploads,
            manufacturedUnits: drone.manufacturedUnits.map((u: any) => ({
                serialNumber: u.serialNumber,
                uin: u.uin,
            })),
            recurringData: drone.recurringData,
        };

        return NextResponse.json(transformedDrone);
    } catch (error) {
        console.error("Error fetching drone:", error);
        return NextResponse.json({ error: "Failed to fetch drone" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const existingDrone = await prisma.drone.findUnique({
            where: { id },
            /* select: { organizationId: true } removed */
        });

        if (!existingDrone) {
            return NextResponse.json({ error: "Drone not found" }, { status: 404 });
        }

        // Organization scoping check
        // Scoping check removed

        const body = await request.json();
        const { modelName, image, accountableManagerId, webPortalLink, manufacturedUnits, recurringData } = body;

        // Start transaction for updates
        const updatedDrone = await prisma.$transaction(async (tx) => {
            // Update basic drone fields
            const drone = await tx.drone.update({
                where: { id },
                data: {
                    modelName: modelName !== undefined ? modelName : undefined,
                    image: image !== undefined ? image : undefined,
                    accountableManagerId: accountableManagerId !== undefined ? accountableManagerId : undefined,
                    webPortalLink: webPortalLink !== undefined ? webPortalLink : undefined,
                    recurringData: recurringData !== undefined ? recurringData : undefined,
                },
                include: {
                    uploads: true,
                    accountableManager: true,
                    manufacturedUnits: true,
                }
            });

            // Update manufactured units if provided
            if (manufacturedUnits) {
                // Delete old units and create new ones
                await tx.manufacturedUnit.deleteMany({
                    where: { droneId: id }
                });

                if (manufacturedUnits.length > 0) {
                    await tx.manufacturedUnit.createMany({
                        data: manufacturedUnits.map((unit: any) => ({
                            serialNumber: unit.serialNumber,
                            uin: unit.uin,
                            droneId: id
                        }))
                    });
                }
            }

            return drone;
        });

        return NextResponse.json(updatedDrone);
    } catch (error) {
        console.error("Error updating drone:", error);
        return NextResponse.json({ error: "Failed to update drone" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const existingDrone = await prisma.drone.findUnique({
            where: { id },
            /* select: { organizationId: true } removed */
        });

        if (!existingDrone) {
            return NextResponse.json({ error: "Drone not found" }, { status: 404 });
        }

        // Organization scoping check
        // Scoping check removed

        await prisma.drone.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting drone:", error);
        return NextResponse.json({ error: "Failed to delete drone" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

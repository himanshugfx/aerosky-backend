import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const flightLogs = await prisma.flightLog.findMany({
            where: {
                organizationId: auth.user.role === 'SUPER_ADMIN' ? undefined : auth.user.organizationId
            },
            include: {
                drone: true,
                pic: true,
                vo: true,
                battery: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(flightLogs);
    } catch (error) {
        console.error("Error fetching flight logs:", error);
        return NextResponse.json({ error: "Failed to fetch flight logs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            date,
            takeoffTime,
            duration,
            locationCoords,
            locationName,
            picId,
            voId,
            missionType,
            droneId,
            serialNumber,
            uin,
            technicalFeedback,
            batteryId
        } = body;

        // Validations
        if (!date || !takeoffTime || !duration || !locationName || !picId || !missionType || !droneId) {
            return NextResponse.json({ error: "Missing mandatory fields" }, { status: 400 });
        }

        const flightLog = await prisma.flightLog.create({
            data: {
                date: new Date(date),
                takeoffTime,
                duration,
                locationCoords,
                locationName,
                picId,
                voId: voId || null,
                missionType,
                droneId,
                serialNumber,
                uin,
                technicalFeedback,
                batteryId: batteryId || null,
                organizationId: auth.user.organizationId
            },
            include: {
                drone: true,
                pic: true,
                vo: true,
                battery: true
            }
        });

        return NextResponse.json(flightLog);
    } catch (error) {
        console.error("Error creating flight log:", error);
        return NextResponse.json({ error: "Failed to create flight log" }, { status: 500 });
    }
}

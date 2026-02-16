import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET Fetch attendance records
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = {};

        // Organization scoping
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const records = await prisma.attendanceRecord.findMany({
            where,
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error('Fetch attendance error:', error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

// POST Upload biometric data (bulk)
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only Admin can upload biometric data
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { records } = body; // Array of { employeeId, date, checkIn, checkOut, status }

        if (!Array.isArray(records)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const organizationId = auth.user.organizationId || "";

        // Upsert records
        const results = await Promise.all(records.map(async (record: any) => {
            return prisma.attendanceRecord.upsert({
                where: {
                    employeeId_date_organizationId: {
                        employeeId: record.employeeId,
                        date: new Date(record.date),
                        organizationId
                    }
                },
                update: {
                    checkIn: record.checkIn,
                    checkOut: record.checkOut,
                    status: record.status
                },
                create: {
                    employeeId: record.employeeId,
                    date: new Date(record.date),
                    checkIn: record.checkIn,
                    checkOut: record.checkOut,
                    status: record.status,
                    organizationId
                }
            });
        }));

        return NextResponse.json({ success: true, count: results.length });
    } catch (error) {
        console.error('Upload attendance error:', error);
        return NextResponse.json({ error: "Failed to upload attendance" }, { status: 500 });
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

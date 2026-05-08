import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { createComponentSchema, validateRequest } from "@/lib/schemas";
import { handleError, errors } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

// GET all components
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) throw errors.unauthorized();

        const permCheck = checkResourceAccess(auth.user, 'component', 'view' as any);
        if (permCheck !== true) throw errors.forbidden('Insufficient permissions to view components');

        const { searchParams } = new URL(request.url);
        const { page, limit } = getPaginationParams(searchParams);

        const where: any = {};
        // Filter by organization if user is not SUPER_ADMIN
        if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && auth.user.role !== 'ADMINISTRATION') {
            if (auth.user.organizationId) {
                where.organizationId = auth.user.organizationId;
            } else {
                // If no organization is set, return empty array for security
                return NextResponse.json(createPaginatedResponse([], 0, { page, limit }));
            }
        }

        const [components, total] = await Promise.all([
            prisma.component.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.component.count({ where }),
        ]);

        const response = createPaginatedResponse(components, total, { page, limit });
        return NextResponse.json(response);
    } catch (error) {
        return handleError(error);
    }
}

// POST create component
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) throw errors.unauthorized();

        const permCheck = checkResourceAccess(auth.user, 'component', 'create' as any);
        if (permCheck !== true) throw errors.forbidden('Insufficient permissions to create components');

        const body = await request.json();

        // Validate input
        const validation = validateRequest(createComponentSchema, body);
        if (validation.error) {
            throw errors.validationError(validation.error.fields);
        }

        const { data: validated } = validation;

        // Use user's organization or return error
        if (!auth.user.organizationId) {
            throw errors.validationError({ organizationId: ['User must be associated with an organization'] });
        }

        const component = await prisma.component.create({
            data: {
                name: validated.name,
                description: validated.description,
                category: validated.category || "Operational",
                quantity: validated.quantity,
                unitPrice: validated.unitPrice,
                organizationId: auth.user.organizationId,
            },
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

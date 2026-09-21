import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    return new PrismaClient({
        datasources: process.env.DATABASE_URL ? { db: { url: process.env.DATABASE_URL } } : undefined
    });
}

// Invalidate stale cached instance if report model is not present
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).report) {
    try {
        globalForPrisma.prisma.$disconnect();
    } catch {}
    globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;


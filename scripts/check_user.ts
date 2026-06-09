import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'himanshu@aerosysaviation.in' }
    });
    console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());

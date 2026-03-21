import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing Lead data...');
    await prisma.followUp.deleteMany({});
    await prisma.leadActivity.deleteMany({});
    await prisma.lead.deleteMany({});
    console.log('Lead data cleared successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

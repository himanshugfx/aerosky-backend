const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Promoting himanshu@aerosysaviation.in to SUPER_ADMIN...');
    const user = await prisma.user.update({
        where: { username: 'himanshu@aerosysaviation.in' },
        data: { role: 'SUPER_ADMIN' }
    });
    console.log('✅ User promoted successfully:', user.username, 'Role:', user.role);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

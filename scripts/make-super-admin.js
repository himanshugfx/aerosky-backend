const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.update({
            where: { username: 'himanshu' },
            data: { role: 'SUPER_ADMIN' },
        });
        console.log('Successfully updated user:', user.username, 'to', user.role);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

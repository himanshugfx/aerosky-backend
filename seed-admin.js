const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('admin', 12);
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            passwordHash,
            role: 'SUPER_ADMIN',
            fullName: 'Super Admin',
        },
        create: {
            username: 'admin',
            email: 'admin@aerosky.com',
            passwordHash,
            role: 'SUPER_ADMIN',
            fullName: 'Super Admin',
        },
    });
    console.log('✅ Super Admin user created/updated successfully!');
    console.log('   Username: admin');
    console.log('   Password: admin');
    console.log('   Role:', user.role);
}

main()
    .catch((e) => {
        console.error('Error seeding admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Supabase Database for AeroSky ---');

    // 1. Create or Find Primary Organization
    let org = await prisma.organization.findFirst({
        where: { name: 'AeroSys Aviation India' }
    });

    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'AeroSys Aviation India',
                email: 'himanshu@aerosysaviation.in',
                phone: '+91 9211535292',
                address: 'New Delhi, India'
            }
        });
        console.log('✅ Created Organization:', org.name, org.id);
    } else {
        console.log('ℹ️ Organization already exists:', org.name, org.id);
    }

    // 2. Create Admin User (admin / admin)
    const adminPassHash = await bcrypt.hash('admin', 12);
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            passwordHash: adminPassHash,
            role: 'SUPER_ADMIN',
            isActive: true,
            organizationId: org.id
        },
        create: {
            username: 'admin',
            email: 'admin@aerosysaviation.in',
            fullName: 'System Administrator',
            passwordHash: adminPassHash,
            role: 'SUPER_ADMIN',
            isActive: true,
            organizationId: org.id
        }
    });
    console.log('✅ Created/Updated Admin User:', adminUser.username, adminUser.role);

    // 3. Create Himanshu Admin User
    const himanshuPassHash = await bcrypt.hash('Aerosky@1909', 12);
    const himanshuUser = await prisma.user.upsert({
        where: { username: 'himanshu@aerosysaviation.in' },
        update: {
            passwordHash: himanshuPassHash,
            role: 'SUPER_ADMIN',
            isActive: true,
            organizationId: org.id
        },
        create: {
            username: 'himanshu@aerosysaviation.in',
            email: 'himanshu@aerosysaviation.in',
            fullName: 'Himanshu',
            passwordHash: himanshuPassHash,
            role: 'SUPER_ADMIN',
            isActive: true,
            organizationId: org.id
        }
    });
    console.log('✅ Created/Updated Himanshu User:', himanshuUser.username, himanshuUser.role);

    console.log('\n🎉 Supabase Database Seeded Successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

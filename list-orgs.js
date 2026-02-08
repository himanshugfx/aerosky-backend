// List all organizations and their admin users
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== All Organizations ===\n');
    const orgs = await prisma.organization.findMany({
        orderBy: { createdAt: 'desc' }
    });

    for (const org of orgs) {
        console.log(`📁 ${org.name}`);
        console.log(`   Email: ${org.email}`);
        console.log(`   Phone: ${org.phone}`);
        console.log(`   Created: ${org.createdAt}`);

        // Find admin users for this org
        const admins = await prisma.user.findMany({
            where: { organizationId: org.id }
        });

        if (admins.length > 0) {
            console.log(`   👤 Admin Users:`);
            admins.forEach(a => {
                console.log(`      - ${a.username} (${a.email}) - Role: ${a.role}`);
            });
        } else {
            console.log(`   ⚠️  NO ADMIN USERS!`);
        }
        console.log('');
    }

    console.log('\n=== All Users ===\n');
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`👤 ${u.username}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   OrgId: ${u.organizationId || 'None'}`);
        console.log('');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

// Reset password for org admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    // Find the org admin user
    const user = await prisma.user.findFirst({
        where: { username: 'admin@aerosysaviation.con' }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('Found user:', user.username);
    console.log('Role:', user.role);

    // Get the org to find the phone number
    const org = await prisma.organization.findUnique({
        where: { id: user.organizationId }
    });

    if (org) {
        console.log('Org phone (password):', org.phone);

        // Reset password to phone
        const hash = await bcrypt.hash(org.phone, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hash }
        });

        console.log('\n✅ Password reset to:', org.phone);
        console.log('\n📱 Login credentials:');
        console.log('   Username:', user.username);
        console.log('   Password:', org.phone);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

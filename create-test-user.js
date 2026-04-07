const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        // Hash password
        const passwordHash = await bcrypt.hash('admin123', 12);

        // Create admin user
        const user = await prisma.user.create({
            data: {
                username: 'admin',
                email: 'admin@test.com',
                fullName: 'Admin User',
                passwordHash: passwordHash,
                role: 'ADMIN',
                isActive: true,
            },
        });

        console.log('✓ Admin user created:', user.username);
        
        // Create a test organization
        const org = await prisma.organization.create({
            data: {
                name: 'Test Organization',
                email: 'org@test.com',
                phone: '1234567890',
            },
        });

        console.log('✓ Organization created:', org.name);

        // Update user to have organization
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: org.id },
        });

        console.log('✓ User updated with organization');

    } catch (error) {
        if (error.code === 'P2002') {
            console.log('✗ User already exists');
        } else {
            console.error('✗ Error:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        // Get or create organization
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: 'Test Organization',
                    email: 'org@test.com',
                    phone: '1234567890',
                },
            });
            console.log('✓ Organization created:', org.id);
        }

        // Create regular user
        const passwordHash = await bcrypt.hash('user123', 12);
        const user = await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'user@test.com',
                fullName: 'Test User',
                passwordHash: passwordHash,
                role: 'MANUFACTURING',
                isActive: true,
                organizationId: org.id,
            },
        });

        console.log('✓ Regular user created:', user.username, 'org:', user.organizationId);

        // Create a component for the organization
        const component = await prisma.component.create({
            data: {
                name: 'Test Component',
                category: 'Operational',
                organizationId: org.id,
            },
        });

        console.log('✓ Component created:', component.name, 'org:', component.organizationId);

        // Create a team member
        const teamMember = await prisma.teamMember.create({
            data: {
                name: 'Test Team Member',
                email: 'team@test.com',
                position: 'Manager',
                accessId: 'TM001',
                organizationId: org.id,
            },
        });

        console.log('✓ Team member created:', teamMember.name);

    } catch (error) {
        if (error.code === 'P2002') {
            console.log('✗ Record already exists');
        } else {
            console.error('✗ Error:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();

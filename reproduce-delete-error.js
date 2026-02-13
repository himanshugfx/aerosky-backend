const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduce() {
    console.log('🧪 Reproducing organization deletion error...');

    // 1. Create a dummy org
    const org = await prisma.organization.create({
        data: {
            name: 'Delete Me Org',
            email: 'delete@test.com'
        }
    });
    console.log('✅ Created organization:', org.id);

    // 2. Add a user
    const user = await prisma.user.create({
        data: {
            username: 'test-user-' + Date.now(),
            passwordHash: 'dummy',
            organizationId: org.id
        }
    });
    console.log('✅ Created user:', user.id);

    // 3. Add a support ticket
    const ticket = await prisma.supportTicket.create({
        data: {
            subject: 'Help me',
            userId: user.id,
            organizationId: org.id
        }
    });
    console.log('✅ Created support ticket:', ticket.id);

    // 4. Try to delete the org like the API does (WITHOUT deleting tickets)
    console.log('🗑️ Attempting to delete organization (simulating buggy API)...');
    try {
        await prisma.$transaction(async (tx) => {
            await tx.user.deleteMany({ where: { organizationId: org.id } });
            // API is missing tx.supportTicket.deleteMany
            await tx.organization.delete({ where: { id: org.id } });
        });
        console.log('❌ Error: Transformation succeeded when it should have failed (or tickets weren\'t created correctly)');
    } catch (error) {
        console.log('✅ Success: Received expected error:', error.message);
    }
}

reproduce()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

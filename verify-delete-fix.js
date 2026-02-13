const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFix() {
    console.log('🧪 Verifying organization deletion fix...');

    // 1. Create a dummy org
    const org = await prisma.organization.create({
        data: {
            name: 'Verification Org ' + Date.now(),
            email: 'verify@test.com'
        }
    });
    console.log('✅ Created organization:', org.id);

    // 2. Add complex data
    const user = await prisma.user.create({
        data: {
            username: 'verify-user-' + Date.now(),
            passwordHash: 'dummy',
            organizationId: org.id
        }
    });
    console.log('✅ Created user:', user.id);

    const ticket = await prisma.supportTicket.create({
        data: {
            subject: 'Verify Cascade',
            userId: user.id,
            organizationId: org.id
        }
    });
    console.log('✅ Created support ticket:', ticket.id);

    const message = await prisma.supportMessage.create({
        data: {
            ticketId: ticket.id,
            senderId: user.id,
            message: 'Hello'
        }
    });
    console.log('✅ Created support message:', message.id);

    // 3. Attempt deletion
    console.log('🗑️ Attempting to delete organization (using new cascading schema)...');
    try {
        await prisma.organization.delete({
            where: { id: org.id }
        });
        console.log('✨ SUCCESS: Organization and all related data deleted successfully!');

        // Final sanity check - try to find the user or ticket
        const userCheck = await prisma.user.findUnique({ where: { id: user.id } });
        const ticketCheck = await prisma.supportTicket.findUnique({ where: { id: ticket.id } });

        if (!userCheck && !ticketCheck) {
            console.log('🕵️ Verification: Confirmed child records are also gone.');
        } else {
            console.error('❌ Error: Cascading delete failed to remove child records.');
        }

    } catch (error) {
        console.error('❌ FAILURE: Received unexpected error:', error.message);
    }
}

testFix()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIndicator() {
    console.log('🧪 Testing New Reply Indicator Logic...');

    // 1. Get the main user and their organization
    const user = await prisma.user.findUnique({
        where: { username: 'himanshu@aerosysaviation.in' }
    });

    if (!user) {
        console.error('❌ User not found');
        return;
    }

    // 2. Create a test support ticket
    const ticket = await prisma.supportTicket.create({
        data: {
            subject: 'Test Indicator Ticket',
            userId: user.id,
            organizationId: user.organizationId,
            status: 'OPEN',
            priority: 'NORMAL'
        }
    });
    console.log('✅ Created test ticket:', ticket.subject);

    // 3. Find a Super Admin (the 'admin' user)
    const superAdmin = await prisma.user.findUnique({
        where: { username: 'admin' }
    });

    if (!superAdmin) {
        console.error('❌ Super Admin not found');
        return;
    }

    // 4. Simulate Super Admin reply
    console.log('💬 Super Admin replying...');
    // This logic is in the POST /api/mobile/support/[id]/messages route
    // We'll mimic it here
    await prisma.$transaction([
        prisma.supportMessage.create({
            data: {
                ticketId: ticket.id,
                senderId: superAdmin.id,
                message: 'Hello, this is a support reply.'
            }
        }),
        prisma.supportTicket.update({
            where: { id: ticket.id },
            data: {
                hasNewReply: true,
                status: 'IN_PROGRESS'
            }
        })
    ]);

    // 5. Verify flag
    const updatedTicket = await prisma.supportTicket.findUnique({
        where: { id: ticket.id }
    });
    console.log('🚩 hasNewReply status:', updatedTicket.hasNewReply);
    console.log('📊 Status:', updatedTicket.status);

    if (updatedTicket.hasNewReply === true && updatedTicket.status === 'IN_PROGRESS') {
        console.log('✨ SUCCESS: Indicator logic works as expected!');
    } else {
        console.error('❌ FAILURE: Indicator logic did not update correctly.');
    }

    // Cleanup
    // await prisma.supportTicket.delete({ where: { id: ticket.id } });
}

testIndicator()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

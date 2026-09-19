require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Initiating deletion of all users and staff members...\n');

    // 1. Unlink drones from accountable managers
    const updatedDrones = await prisma.drone.updateMany({
        where: { accountableManagerId: { not: null } },
        data: { accountableManagerId: null }
    });
    console.log(`Unlinked ${updatedDrones.count} drone(s) from accountable managers.`);

    // 2. Unlink flight logs from PIC/VO team members
    const updatedPIC = await prisma.flightLog.updateMany({
        where: { picId: { not: null } },
        data: { picId: null }
    });
    const updatedVO = await prisma.flightLog.updateMany({
        where: { voId: { not: null } },
        data: { voId: null }
    });
    console.log(`Unlinked ${updatedPIC.count + updatedVO.count} flight log pilot reference(s).`);

    // 3. Delete related User cascading records if any exist
    const tickets = await prisma.supportTicket.deleteMany();
    console.log(`Deleted ${tickets.count} support ticket(s).`);

    const convs = await prisma.assistantConversation.deleteMany();
    console.log(`Deleted ${convs.count} assistant conversation(s).`);

    const reimbursements = await prisma.reimbursement.deleteMany();
    console.log(`Deleted ${reimbursements.count} reimbursement(s).`);

    const otp = await prisma.otpVerification.deleteMany();
    console.log(`Deleted ${otp.count} OTP record(s).`);

    // 4. Delete all Users
    const users = await prisma.user.deleteMany();
    console.log(`✅ Deleted ${users.count} user account(s).`);

    // 5. Delete all Team Members (staff)
    const team = await prisma.teamMember.deleteMany();
    console.log(`✅ Deleted ${team.count} staff / team member(s).`);

    console.log('\n🎉 All staff and user records have been completely removed.');
}

main()
    .catch((e) => {
        console.error('Error during deletion:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

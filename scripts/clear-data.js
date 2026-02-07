// Script to clear all sample data (keeps user and permissions)
// Run with: node scripts/clear-data.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Clearing sample data...\n');

    // Delete in order to respect foreign key constraints
    console.log('Deleting orders...');
    await prisma.order.deleteMany();

    console.log('Deleting manufactured units...');
    await prisma.manufacturedUnit.deleteMany();

    console.log('Deleting drone uploads...');
    await prisma.droneUpload.deleteMany();

    console.log('Deleting drones...');
    await prisma.drone.deleteMany();

    console.log('Deleting batteries...');
    await prisma.battery.deleteMany();

    console.log('Deleting subcontractors...');
    await prisma.subcontractor.deleteMany();

    console.log('Deleting team members...');
    await prisma.teamMember.deleteMany();

    console.log('\n✅ All sample data cleared!');
    console.log('   (Users and permissions preserved)');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

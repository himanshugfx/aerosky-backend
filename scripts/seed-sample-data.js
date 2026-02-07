// Seed sample data for AeroSky
// Run with: node scripts/seed-sample-data.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding sample data...\n');

    // 1. Create Team Members
    console.log('👥 Creating team members...');
    const teamMembers = await Promise.all([
        prisma.teamMember.create({
            data: {
                accessId: 'TM001',
                name: 'Himanshu Kumar',
                email: 'himanshu@aerosysaviation.in',
                phone: '+91-9876543210',
                position: 'CEO & Founder',
            },
        }),
        prisma.teamMember.create({
            data: {
                accessId: 'TM002',
                name: 'Rahul Sharma',
                email: 'rahul@aerosysaviation.in',
                phone: '+91-9876543211',
                position: 'Operations Manager',
            },
        }),
        prisma.teamMember.create({
            data: {
                accessId: 'TM003',
                name: 'Priya Patel',
                email: 'priya@aerosysaviation.in',
                phone: '+91-9876543212',
                position: 'QA Manager',
            },
        }),
        prisma.teamMember.create({
            data: {
                accessId: 'TM004',
                name: 'Amit Singh',
                email: 'amit@aerosysaviation.in',
                phone: '+91-9876543213',
                position: 'Remote Pilot',
            },
        }),
        prisma.teamMember.create({
            data: {
                accessId: 'TM005',
                name: 'Sanjay Verma',
                email: 'sanjay@aerosysaviation.in',
                phone: '+91-9876543214',
                position: 'Technician',
            },
        }),
    ]);
    console.log(`✅ Created ${teamMembers.length} team members\n`);

    // 2. Create Subcontractors
    console.log('🏭 Creating subcontractors...');
    const subcontractors = await Promise.all([
        prisma.subcontractor.create({
            data: {
                companyName: 'DroneWorks Manufacturing',
                type: 'Manufacturing',
                contactPerson: 'Vikash Gupta',
                contactEmail: 'vikash@droneworks.in',
                contactPhone: '+91-9988776655',
                agreementDate: '2024-01-15',
            },
        }),
        prisma.subcontractor.create({
            data: {
                companyName: 'AeroDesign Solutions',
                type: 'Design',
                contactPerson: 'Neha Reddy',
                contactEmail: 'neha@aerodesign.in',
                contactPhone: '+91-9988776656',
                agreementDate: '2024-02-20',
            },
        }),
        prisma.subcontractor.create({
            data: {
                companyName: 'FlightTech Components',
                type: 'Manufacturing',
                contactPerson: 'Ravi Kumar',
                contactEmail: 'ravi@flighttech.in',
                contactPhone: '+91-9988776657',
                agreementDate: '2024-03-10',
            },
        }),
    ]);
    console.log(`✅ Created ${subcontractors.length} subcontractors\n`);

    // 3. Create Drones
    console.log('🚁 Creating drones...');
    const drones = await Promise.all([
        prisma.drone.create({
            data: {
                modelName: 'AeroSky Pro X1',
                accountableManagerId: teamMembers[0].id,
                webPortalLink: 'https://digitalsky.dgca.gov.in/drone/X1',
                manufacturedUnits: {
                    create: [
                        { serialNumber: 'ASX1-001', uin: 'IND-UAS-001-2024' },
                        { serialNumber: 'ASX1-002', uin: 'IND-UAS-002-2024' },
                        { serialNumber: 'ASX1-003', uin: 'IND-UAS-003-2024' },
                    ],
                },
            },
        }),
        prisma.drone.create({
            data: {
                modelName: 'AeroSky Surveyor S2',
                accountableManagerId: teamMembers[1].id,
                webPortalLink: 'https://digitalsky.dgca.gov.in/drone/S2',
                manufacturedUnits: {
                    create: [
                        { serialNumber: 'ASS2-001', uin: 'IND-UAS-004-2024' },
                        { serialNumber: 'ASS2-002', uin: 'IND-UAS-005-2024' },
                    ],
                },
            },
        }),
        prisma.drone.create({
            data: {
                modelName: 'AeroSky Agri A3',
                accountableManagerId: teamMembers[0].id,
                webPortalLink: 'https://digitalsky.dgca.gov.in/drone/A3',
                manufacturedUnits: {
                    create: [
                        { serialNumber: 'ASA3-001', uin: 'IND-UAS-006-2024' },
                    ],
                },
            },
        }),
    ]);
    console.log(`✅ Created ${drones.length} drones\n`);

    // 4. Create Batteries
    console.log('🔋 Creating batteries...');
    const batteries = await Promise.all([
        prisma.battery.create({
            data: {
                model: 'LiPo 6S 10000mAh',
                ratedCapacity: '10000mAh',
                batteryNumberA: 'BAT-A-001',
                batteryNumberB: 'BAT-B-001',
            },
        }),
        prisma.battery.create({
            data: {
                model: 'LiPo 6S 15000mAh',
                ratedCapacity: '15000mAh',
                batteryNumberA: 'BAT-A-002',
                batteryNumberB: 'BAT-B-002',
            },
        }),
        prisma.battery.create({
            data: {
                model: 'LiPo 4S 8000mAh',
                ratedCapacity: '8000mAh',
                batteryNumberA: 'BAT-A-003',
                batteryNumberB: 'BAT-B-003',
            },
        }),
        prisma.battery.create({
            data: {
                model: 'LiPo 6S 12000mAh',
                ratedCapacity: '12000mAh',
                batteryNumberA: 'BAT-A-004',
                batteryNumberB: 'BAT-B-004',
            },
        }),
    ]);
    console.log(`✅ Created ${batteries.length} batteries\n`);

    // 5. Create Orders
    console.log('📦 Creating orders...');
    const orders = await Promise.all([
        prisma.order.create({
            data: {
                contractNumber: 'ASA-2024-001',
                clientName: 'Indian Army',
                clientSegment: 'Defense',
                orderDate: new Date('2024-01-10'),
                estimatedCompletionDate: new Date('2024-06-30'),
                contractValue: 15000000,
                currency: 'INR',
                revenueRecognitionStatus: 'In Progress',
                droneModel: 'AeroSky Pro X1',
                droneType: 'Multi-rotor',
                weightClass: 'Small',
                payloadConfiguration: 'Surveillance Camera + GPS',
                flightEnduranceRequirements: '45 minutes',
                softwareAiTier: 'Advanced',
                dgcaFaaCertificationStatus: 'Certified',
                uin: 'IND-UAS-001-2024',
                bomReadiness: 'Ready',
                manufacturingStage: 'In Production',
            },
        }),
        prisma.order.create({
            data: {
                contractNumber: 'ASA-2024-002',
                clientName: 'Agriculture Ministry',
                clientSegment: 'Government',
                orderDate: new Date('2024-02-15'),
                estimatedCompletionDate: new Date('2024-08-15'),
                contractValue: 8500000,
                currency: 'INR',
                revenueRecognitionStatus: 'Pending',
                droneModel: 'AeroSky Agri A3',
                droneType: 'Multi-rotor',
                weightClass: 'Medium',
                payloadConfiguration: 'Sprayer System',
                flightEnduranceRequirements: '30 minutes',
                softwareAiTier: 'Standard',
                dgcaFaaCertificationStatus: 'Pending',
                bomReadiness: 'In Progress',
                manufacturingStage: 'In Design',
            },
        }),
        prisma.order.create({
            data: {
                contractNumber: 'ASA-2024-003',
                clientName: 'Survey of India',
                clientSegment: 'Government',
                orderDate: new Date('2024-03-01'),
                estimatedCompletionDate: new Date('2024-09-01'),
                contractValue: 12000000,
                currency: 'INR',
                revenueRecognitionStatus: 'Pending',
                droneModel: 'AeroSky Surveyor S2',
                droneType: 'Fixed Wing',
                weightClass: 'Small',
                payloadConfiguration: 'LiDAR + RGB Camera',
                flightEnduranceRequirements: '90 minutes',
                softwareAiTier: 'Advanced',
                dgcaFaaCertificationStatus: 'In Review',
                bomReadiness: 'Not Ready',
                manufacturingStage: 'Prototyping',
            },
        }),
        prisma.order.create({
            data: {
                contractNumber: 'ASA-2024-004',
                clientName: 'Reliance Industries',
                clientSegment: 'Private',
                orderDate: new Date('2024-03-20'),
                estimatedCompletionDate: new Date('2024-07-20'),
                contractValue: 5000000,
                currency: 'INR',
                revenueRecognitionStatus: 'Completed',
                droneModel: 'AeroSky Pro X1',
                droneType: 'Multi-rotor',
                weightClass: 'Small',
                payloadConfiguration: 'Thermal Camera',
                flightEnduranceRequirements: '40 minutes',
                softwareAiTier: 'Standard',
                dgcaFaaCertificationStatus: 'Certified',
                uin: 'IND-UAS-003-2024',
                bomReadiness: 'Ready',
                manufacturingStage: 'Delivered',
            },
        }),
        prisma.order.create({
            data: {
                contractNumber: 'ASA-2024-005',
                clientName: 'ISRO',
                clientSegment: 'Government',
                orderDate: new Date('2024-04-01'),
                estimatedCompletionDate: new Date('2024-12-31'),
                contractValue: 25000000,
                currency: 'INR',
                revenueRecognitionStatus: 'Pending',
                droneModel: 'AeroSky Pro X1',
                droneType: 'Multi-rotor',
                weightClass: 'Medium',
                payloadConfiguration: 'Custom Scientific Payload',
                flightEnduranceRequirements: '60 minutes',
                softwareAiTier: 'Enterprise',
                dgcaFaaCertificationStatus: 'Pending',
                bomReadiness: 'Not Ready',
                manufacturingStage: 'In Design',
            },
        }),
    ]);
    console.log(`✅ Created ${orders.length} orders\n`);

    console.log('🎉 Sample data seeding complete!');
    console.log('-----------------------------------');
    console.log(`📊 Summary:`);
    console.log(`   - Team Members: ${teamMembers.length}`);
    console.log(`   - Subcontractors: ${subcontractors.length}`);
    console.log(`   - Drones: ${drones.length}`);
    console.log(`   - Batteries: ${batteries.length}`);
    console.log(`   - Orders: ${orders.length}`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFlights() {
    console.log('--- Verifying Flight Log Implementation ---');

    try {
        // 1. Check if organization exists
        const org = await prisma.organization.findFirst();
        if (!org) {
            console.error('No organization found. Please run reproduction script first.');
            return;
        }

        // 2. Check if drone exists
        const drone = await prisma.drone.findFirst({
            where: { organizationId: org.id },
            include: { manufacturedUnits: true }
        });

        if (!drone) {
            console.log('Creating a test drone...');
            const newDrone = await prisma.drone.create({
                data: {
                    modelName: 'Test Drone X1',
                    organizationId: org.id,
                    manufacturedUnits: {
                        create: [
                            { serialNumber: 'SN-001', uin: 'UIN-001' }
                        ]
                    }
                }
            });
            drone = newDrone;
        }

        // 3. Check if team member exists
        let pilot = await prisma.teamMember.findFirst({
            where: { organizationId: org.id }
        });

        if (!pilot) {
            console.log('Creating a test pilot...');
            pilot = await prisma.teamMember.create({
                data: {
                    name: 'Test Pilot',
                    accessId: 'PILOT-001',
                    position: 'Senior Pilot',
                    organizationId: org.id
                }
            });
        }

        // 4. Create a flight log
        console.log('Creating a test flight log...');
        const log = await prisma.flightLog.create({
            data: {
                date: new Date(),
                takeoffTime: '10:00',
                duration: '30 mins',
                locationName: 'Test Field, New Delhi',
                missionType: 'Commercial',
                picId: pilot.id,
                droneId: drone.id,
                serialNumber: 'SN-001',
                uin: 'UIN-001',
                organizationId: org.id
            },
            include: {
                drone: true,
                pic: true
            }
        });

        console.log('Successfully created flight log:', {
            id: log.id,
            drone: log.drone.modelName,
            pilot: log.pic.name,
            location: log.locationName
        });

        // 5. Cleanup
        await prisma.flightLog.delete({ where: { id: log.id } });
        console.log('Cleanup successful.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFlights();

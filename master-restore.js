const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PERMISSIONS = [
    { name: 'drone:view', description: 'View drones', category: 'drones' },
    { name: 'drone:create', description: 'Create drones', category: 'drones' },
    { name: 'drone:edit', description: 'Edit drones', category: 'drones' },
    { name: 'drone:delete', description: 'Delete drones', category: 'drones' },
    { name: 'order:view', description: 'View orders', category: 'orders' },
    { name: 'order:create', description: 'Create orders', category: 'orders' },
    { name: 'order:edit', description: 'Edit orders', category: 'orders' },
    { name: 'order:delete', description: 'Delete orders', category: 'orders' },
    { name: 'team:view', description: 'View team members', category: 'team' },
    { name: 'team:create', description: 'Create team members', category: 'team' },
    { name: 'team:edit', description: 'Edit team members', category: 'team' },
    { name: 'team:delete', description: 'Delete team members', category: 'team' },
    { name: 'subcontractor:view', description: 'View subcontractors', category: 'subcontractors' },
    { name: 'subcontractor:create', description: 'Create subcontractors', category: 'subcontractors' },
    { name: 'subcontractor:edit', description: 'Edit subcontractors', category: 'subcontractors' },
    { name: 'subcontractor:delete', description: 'Delete subcontractors', category: 'subcontractors' },
    { name: 'battery:view', description: 'View batteries', category: 'batteries' },
    { name: 'battery:create', description: 'Create batteries', category: 'batteries' },
    { name: 'battery:edit', description: 'Edit batteries', category: 'batteries' },
    { name: 'battery:delete', description: 'Delete batteries', category: 'batteries' },
    { name: 'compliance:view', description: 'View compliance documents', category: 'compliance' },
    { name: 'compliance:upload', description: 'Upload compliance documents', category: 'compliance' },
    { name: 'compliance:approve', description: 'Approve compliance items', category: 'compliance' },
    { name: 'report:view', description: 'View reports', category: 'reports' },
    { name: 'report:export', description: 'Export reports', category: 'reports' },
    { name: 'settings:view', description: 'View settings', category: 'settings' },
    { name: 'settings:edit', description: 'Edit settings', category: 'settings' },
    { name: 'settings:admin', description: 'Admin settings', category: 'settings' },
];

async function main() {
    console.log('🚀 Starting Full Restore...\n');

    // 1. Permissions & RBAC
    console.log('📝 Seeding permissions...');
    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description, category: perm.category },
            create: perm,
        });
    }
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
        await prisma.rolePermission.upsert({
            where: { role_permissionId: { role: 'SUPER_ADMIN', permissionId: perm.id } },
            update: {},
            create: { role: 'SUPER_ADMIN', permissionId: perm.id },
        });
    }
    console.log('✅ RBAC Ready\n');

    // 2. Organization
    console.log('📁 Creating Organization...');
    const org = await prisma.organization.create({
        data: {
            name: 'Aerosys Aviation India',
            email: 'himanshu@aerosysaviation.in',
            phone: '9110134408',
            address: 'New Delhi, India'
        }
    });
    console.log(`✅ Organization created: ${org.name} (${org.id})\n`);

    // 3. Users
    console.log('👤 Creating Users...');
    const adminPasswordHash = await bcrypt.hash('admin', 12);
    const userPasswordHash = await bcrypt.hash('9110134408', 12);

    // Super Admin
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: { role: 'SUPER_ADMIN', passwordHash: adminPasswordHash },
        create: { username: 'admin', email: 'admin@aerosky.com', role: 'SUPER_ADMIN', passwordHash: adminPasswordHash, fullName: 'System Admin' }
    });

    // Org Admin
    const mainUser = await prisma.user.upsert({
        where: { username: 'himanshu@aerosysaviation.in' },
        update: { role: 'SUPER_ADMIN', passwordHash: userPasswordHash, organizationId: org.id },
        create: {
            username: 'himanshu@aerosysaviation.in',
            email: 'himanshu@aerosysaviation.in',
            role: 'SUPER_ADMIN',
            passwordHash: userPasswordHash,
            fullName: 'Himanshu Kumar',
            organizationId: org.id
        }
    });
    console.log(`✅ Users ready. Main user: ${mainUser.username}\n`);

    // 4. Team Members
    console.log('👥 Creating Team Members...');
    const teamMembers = await Promise.all([
        prisma.teamMember.create({
            data: { accessId: 'TM001', name: 'Himanshu Kumar', email: 'himanshu@aerosysaviation.in', phone: '9110134408', position: 'CEO', organizationId: org.id }
        }),
        prisma.teamMember.create({
            data: { accessId: 'TM002', name: 'Rahul Sharma', email: 'rahul@aerosysaviation.in', position: 'Ops Manager', organizationId: org.id }
        })
    ]);

    // Link main user to team member
    await prisma.user.update({
        where: { id: mainUser.id },
        data: { teamMemberId: teamMembers[0].id }
    });

    // 5. Drones
    console.log('🚁 Creating Drones...');
    await prisma.drone.create({
        data: {
            modelName: 'AeroSky Pro X1',
            organizationId: org.id,
            accountableManagerId: teamMembers[0].id,
            manufacturedUnits: {
                create: [
                    { serialNumber: 'ASX1-001', uin: 'IND-UAS-001-2024' },
                    { serialNumber: 'ASX1-002', uin: 'IND-UAS-002-2024' }
                ]
            }
        }
    });

    // 6. Batteries
    console.log('🔋 Creating Batteries...');
    await prisma.battery.create({
        data: { model: 'LiPo 6S 10000mAh', ratedCapacity: '10000mAh', batteryNumberA: 'BAT-A-001', batteryNumberB: 'BAT-B-001', organizationId: org.id }
    });

    // 7. Orders
    console.log('📦 Creating Orders...');
    await prisma.order.create({
        data: {
            contractNumber: 'ASA-2024-001',
            clientName: 'Indian Army',
            clientSegment: 'Defense',
            orderDate: new Date('2024-01-10'),
            contractValue: 15000000,
            droneModel: 'AeroSky Pro X1',
            droneType: 'Multi-rotor',
            weightClass: 'Small',
            organizationId: org.id
        }
    });

    console.log('\n🎉 FULL RESTORE COMPLETE!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

// Create admin user script
// Run with: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Creating admin user...\n');

    // Hash the password
    const passwordHash = await bcrypt.hash('Golu,4184', 10);

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { username: 'himanshu' },
        update: {
            role: 'ADMIN',
            email: 'himanshu@aerosysaviation.in',
            passwordHash: passwordHash,
        },
        create: {
            username: 'himanshu',
            email: 'himanshu@aerosysaviation.in',
            passwordHash: passwordHash,
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin user created!');
    console.log(`   ID: ${adminUser.id}`);
    console.log('   Username: himanshu');
    console.log('   Email: himanshu@aerosysaviation.in');
    console.log('   Password: Golu,4184');
    console.log('   Role: ADMIN\n');

    // Also seed permissions
    console.log('📝 Seeding permissions...');

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

    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description, category: perm.category },
            create: perm,
        });
    }
    console.log(`✅ Created ${PERMISSIONS.length} permissions\n`);

    console.log('🎉 Setup complete!');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

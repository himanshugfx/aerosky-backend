// Seed script for permissions and default admin user
// Run with: node scripts/seed-permissions.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Permission definitions
const PERMISSIONS = [
    // Drones
    { name: 'drone:view', description: 'View drones', category: 'drones' },
    { name: 'drone:create', description: 'Create drones', category: 'drones' },
    { name: 'drone:edit', description: 'Edit drones', category: 'drones' },
    { name: 'drone:delete', description: 'Delete drones', category: 'drones' },

    // Orders
    { name: 'order:view', description: 'View orders', category: 'orders' },
    { name: 'order:create', description: 'Create orders', category: 'orders' },
    { name: 'order:edit', description: 'Edit orders', category: 'orders' },
    { name: 'order:delete', description: 'Delete orders', category: 'orders' },

    // Team
    { name: 'team:view', description: 'View team members', category: 'team' },
    { name: 'team:create', description: 'Create team members', category: 'team' },
    { name: 'team:edit', description: 'Edit team members', category: 'team' },
    { name: 'team:delete', description: 'Delete team members', category: 'team' },

    // Subcontractors
    { name: 'subcontractor:view', description: 'View subcontractors', category: 'subcontractors' },
    { name: 'subcontractor:create', description: 'Create subcontractors', category: 'subcontractors' },
    { name: 'subcontractor:edit', description: 'Edit subcontractors', category: 'subcontractors' },
    { name: 'subcontractor:delete', description: 'Delete subcontractors', category: 'subcontractors' },

    // Batteries
    { name: 'battery:view', description: 'View batteries', category: 'batteries' },
    { name: 'battery:create', description: 'Create batteries', category: 'batteries' },
    { name: 'battery:edit', description: 'Edit batteries', category: 'batteries' },
    { name: 'battery:delete', description: 'Delete batteries', category: 'batteries' },

    // Compliance
    { name: 'compliance:view', description: 'View compliance documents', category: 'compliance' },
    { name: 'compliance:upload', description: 'Upload compliance documents', category: 'compliance' },
    { name: 'compliance:approve', description: 'Approve compliance items', category: 'compliance' },

    // Reports
    { name: 'report:view', description: 'View reports', category: 'reports' },
    { name: 'report:export', description: 'Export reports', category: 'reports' },

    // Settings
    { name: 'settings:view', description: 'View settings', category: 'settings' },
    { name: 'settings:edit', description: 'Edit settings', category: 'settings' },
    { name: 'settings:admin', description: 'Admin settings', category: 'settings' },
];

async function main() {
    console.log('🚀 Starting RBAC seed...\n');

    // 1. Create permissions
    console.log('📝 Creating permissions...');
    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description, category: perm.category },
            create: perm,
        });
    }
    console.log(`✅ Created ${PERMISSIONS.length} permissions\n`);

    // 2. Create role-permission mappings for SUPER_ADMIN (all permissions)
    console.log('🔗 Setting up SUPER_ADMIN role permissions...');
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
        await prisma.rolePermission.upsert({
            where: { role_permissionId: { role: 'SUPER_ADMIN', permissionId: perm.id } },
            update: {},
            create: { role: 'SUPER_ADMIN', permissionId: perm.id },
        });
    }
    console.log('✅ SUPER_ADMIN has all permissions\n');

    // 3. Update or create default admin user
    console.log('👤 Setting up default admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { role: 'ADMIN' },
        create: {
            username: 'admin',
            passwordHash: passwordHash,
            role: 'ADMIN',
            email: 'admin@aerosky.com',
        },
    });
    console.log(`✅ Admin user ready (ID: ${adminUser.id})`);
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN\n');

    console.log('🎉 RBAC seed complete!');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

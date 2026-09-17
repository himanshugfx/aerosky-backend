const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { PERMISSIONS, ROLE_PERMISSIONS } = require('./src/lib/permissions');
const { hasPermission } = require('./src/lib/rbac');

async function test() {
    const user = await prisma.user.findUnique({
        where: { email: 'himanshu@aerosysaviation.in' }
    });
    console.log("User role:", user.role);
    console.log("Permissions for role:", ROLE_PERMISSIONS[user.role]);
    
    console.log("Has DRONE_VIEW?", hasPermission(user.role, PERMISSIONS.DRONE_VIEW));
    console.log("Has TEAM_VIEW?", hasPermission(user.role, PERMISSIONS.TEAM_VIEW));
    
    process.exit(0);
}
test().catch(console.error);

// Script to create org admin user for Aerosys Aviation
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'himanshu@aerosysaviation.in';
    const phone = '9110134408';

    // Find org
    const org = await prisma.organization.findFirst({
        where: { email: email }
    });

    if (!org) {
        console.log('Organization not found with email:', email);

        // List all orgs
        const allOrgs = await prisma.organization.findMany();
        console.log('\nAll organizations:');
        allOrgs.forEach(o => console.log(`- ${o.name} (${o.email})`));
        return;
    }

    console.log('Found organization:', org.name);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: { email: email }
    });

    if (existingUser) {
        console.log('User already exists!');
        return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(phone, 12);

    const user = await prisma.user.create({
        data: {
            username: email,
            email: email,
            passwordHash: passwordHash,
            fullName: `${org.name} Admin`,
            role: 'ADMIN',
            organizationId: org.id
        }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('Login: ' + email);
    console.log('Password: ' + phone);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

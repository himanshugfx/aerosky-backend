// Script to check for user and create org admin if missing
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'himanshu@aerosysaviation.in';
    const phone = '9110134408';

    console.log('Checking for user with email:', email);

    // Check if user exists
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { username: email }
            ]
        }
    });

    if (user) {
        console.log('User found:', user.username, user.role);
        console.log('User ID:', user.id);
        console.log('Organization ID:', user.organizationId);
    } else {
        console.log('User NOT found. Looking for organization...');

        // Check if org exists with this email
        const org = await prisma.organization.findFirst({
            where: { email: email }
        });

        if (org) {
            console.log('Organization found:', org.name);
            console.log('Creating admin user...');

            const passwordHash = await bcrypt.hash(phone, 12);

            user = await prisma.user.create({
                data: {
                    username: email,
                    email: email,
                    passwordHash: passwordHash,
                    fullName: `${org.name} Admin`,
                    role: 'ADMIN',
                    organizationId: org.id
                }
            });

            console.log('Admin user created successfully!');
            console.log('Login: ' + email);
            console.log('Password: ' + phone);
        } else {
            console.log('Organization with this email NOT found either.');
            console.log('Please create the organization first from the mobile app.');
        }
    }

    // List all users
    console.log('\n--- All Users in Database ---');
    const allUsers = await prisma.user.findMany({
        select: {
            username: true,
            email: true,
            role: true,
            organizationId: true
        }
    });
    console.table(allUsers);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

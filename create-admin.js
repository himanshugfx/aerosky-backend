const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'himanshu@aerosysaviation.in';
    const password = 'Golu,4184';

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { username: email },
        update: { passwordHash },
        create: {
            username: email,
            passwordHash,
        },
    });

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('User ID:', user.id);
}

main()
    .catch((e) => {
        console.error('Error creating admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

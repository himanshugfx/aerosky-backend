// Debug login issue
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'himanshu@aerosysaviation.in';
    const password = '9110134408';

    // Find user
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { username: email }
            ]
        }
    });

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    console.log('✅ User found:');
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   OrgId:', user.organizationId);
    console.log('   Password Hash:', user.passwordHash.substring(0, 20) + '...');

    // Test password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('\n🔐 Password check:');
    console.log('   Trying password:', password);
    console.log('   Is valid:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
        console.log('\n🔧 Resetting password to:', password);
        const newHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash }
        });
        console.log('✅ Password reset successfully!');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

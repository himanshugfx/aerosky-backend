const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Aerosky@2026', 10);
  
  const initialUsers = [
    { username: 'Avinash', fullName: 'Avinash', role: 'ADMINISTRATION' },
    { username: 'admin', fullName: 'System Admin', role: 'ADMINISTRATION' },
    { username: 'himanshu', fullName: 'Himanshu', role: 'ADMINISTRATION' },
    { username: 'rahul', fullName: 'Rahul', role: 'MANUFACTURING' },
    { username: 'nandan', fullName: 'Nandan', role: 'MANUFACTURING' },
    { username: 'varun', fullName: 'Varun', role: 'SOFTWARE' },
    { username: 'sudarshan', fullName: 'Sudarshan', role: 'DESIGN' },
  ];

  console.log('--- CREATING INITIAL USERS ---');
  for (const user of initialUsers) {
    try {
      await prisma.user.upsert({
        where: { username: user.username },
        update: {
          role: user.role,
        },
        create: {
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          passwordHash: passwordHash,
          isActive: true,
        },
      });
      console.log(`User ${user.username} created/updated with role ${user.role}`);
    } catch (error) {
      console.error(`Failed to seed user ${user.username}:`, error.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

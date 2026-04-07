const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const usersToUpdate = [
    { usernames: ['Avinash', 'admin', 'himanshu'], role: 'ADMINISTRATION' },
    { usernames: ['rahul', 'nandan'], role: 'MANUFACTURING' },
    { usernames: ['varun'], role: 'SOFTWARE' },
    { usernames: ['sudarshan'], role: 'DESIGN' },
  ];

  for (const { usernames, role } of usersToUpdate) {
    try {
        console.log(`Updating users ${usernames.join(', ')} to role ${role}...`);
        const result = await prisma.user.updateMany({
            where: {
                username: { in: usernames },
            },
            data: {
                role: role,
            },
        });
        console.log(`Successfully updated ${result.count} users with role ${role}`);
    } catch (error) {
        console.error(`Error updating users to ${role}:`, error.message);
    }
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

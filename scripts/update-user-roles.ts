import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersToUpdate = [
    { usernames: ['Avinash', 'admin', 'himanshu'], role: Role.ADMINISTRATION },
    { usernames: ['rahul', 'nandan'], role: Role.MANUFACTURING },
    { usernames: ['varun'], role: Role.SOFTWARE },
    { usernames: ['sudarshan'], role: Role.DESIGN },
  ];

  for (const { usernames, role } of usersToUpdate) {
    try {
        const result = await prisma.user.updateMany({
            where: {
                username: { in: usernames },
            },
            data: {
                role: role,
            },
        });
        console.log(`Updated ${result.count} users with role ${role}`);
    } catch (error) {
        console.error(`Error updating users to ${role}:`, error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

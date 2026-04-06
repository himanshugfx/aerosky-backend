const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      fullName: true,
      role: true,
    }
  });
  console.log('--- USER LIST ---');
  console.log(users);
  console.log('--- END ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());

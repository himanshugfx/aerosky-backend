const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany();
    console.log('Orders count:', orders.length);
    if (orders.length > 0) {
        console.log('Sample order:', orders[0]);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

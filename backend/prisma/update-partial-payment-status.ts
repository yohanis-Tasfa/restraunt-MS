import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating orders with PARTIAL payment status to UNPAID...');

  // Update all orders with PARTIAL status to UNPAID
  const result = await prisma.order.updateMany({
    where: {
      paymentStatus: 'PARTIAL' as any, // Cast to any to bypass type checking
    },
    data: {
      paymentStatus: 'UNPAID',
    },
  });

  console.log(`✅ Updated ${result.count} orders from PARTIAL to UNPAID`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating Waiter role permissions...');

  const waiterPermissions = [
    'menu.read',
    'orders.read',
    'orders.create',
    'orders.update',
    'tables.read',
    'tables.update',
    'reservations.read',
    'customers.read',
    'customers.create',
    'waiter-calls.read',
    'waiter-calls.update',
    'bill-requests.read',
    'bill-requests.update',
    'payments.create', // This is the missing permission!
  ];

  const result = await prisma.role.update({
    where: { name: 'Waiter' },
    data: {
      permissions: waiterPermissions,
    },
  });

  console.log('✅ Waiter role updated successfully!');
  console.log('📋 New permissions:', result.permissions);
}

main()
  .catch((e) => {
    console.error('❌ Error updating role:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

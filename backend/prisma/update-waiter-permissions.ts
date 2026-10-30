import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating Cashier and Waiter role permissions for clear role separation...');

  const cashierPermissions = [
    'menu.read',
    'orders.read',
    'orders.create',
    'orders.update',
    'payments.read',
    'payments.create',
    'customers.read',
    'customers.create',
    'customers.update',
    'tables.read',
    'reports.read',
    'bill-requests.read',
    'bill-requests.process',
    'bill-requests.complete',
    'reservations.read',
    'reservations.create',
    'reservations.update',
  ];

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
    'bill-requests.create',
    'payments.create',
  ];

  const cashierResult = await prisma.role.update({
    where: { name: 'Cashier' },
    data: {
      permissions: cashierPermissions,
    },
  });
  console.log('✅ Cashier role updated successfully!');
  console.log('📋 Cashier permissions:', cashierResult.permissions);

  const waiterResult = await prisma.role.update({
    where: { name: 'Waiter' },
    data: {
      permissions: waiterPermissions,
    },
  });
  console.log('✅ Waiter role updated successfully!');
  console.log('📋 Waiter permissions:', waiterResult.permissions);
}

main()
  .catch((e) => {
    console.error('❌ Error updating role:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

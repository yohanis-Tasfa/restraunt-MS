import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create roles
  console.log('Creating roles...');

  const roles = [
    {
      name: 'Owner',
      description: 'Restaurant owner with full system access and business oversight',
      isSystem: true,
      permissions: ['*'], // Wildcard for all permissions - Complete system control
    },
    {
      name: 'Manager',
      description: 'Branch manager with daily operations, inventory, and staff coordination',
      isSystem: true,
      permissions: [
        // Menu Management
        'menu.read',
        'menu.create',
        'menu.update',
        'menu.delete',
        // Order Management
        'orders.read',
        'orders.create',
        'orders.update',
        'orders.cancel',
        // Table & Reservation Management
        'tables.read',
        'tables.update',
        'reservations.read',
        'reservations.create',
        'reservations.update',
        'reservations.cancel',
        // Inventory Management (merged from Inventory Manager)
        'inventory.read',
        'inventory.create',
        'inventory.update',
        'inventory.delete',
        'suppliers.read',
        'suppliers.create',
        'suppliers.update',
        'purchases.read',
        'purchases.create',
        'purchases.update',
        // Customer Management
        'customers.read',
        'customers.create',
        'customers.update',
        // Employee Management
        'employees.read',
        'employees.update',
        'attendance.read',
        'attendance.create',
        // Expense Management
        'expenses.read',
        'expenses.create',
        'expenses.update',
        // Reports
        'reports.read',
        'reports.generate',
        // Basic User Viewing
        'users.read',
        'branches.read',
      ],
    },
    {
      name: 'Cashier',
      description: 'POS operator with order processing and payment handling',
      isSystem: true,
      permissions: [
        // Menu Viewing
        'menu.read',
        // Order Management
        'orders.read',
        'orders.create',
        'orders.update',
        // Payment Processing
        'payments.read',
        'payments.create',
        // Customer Management
        'customers.read',
        'customers.create',
        'customers.update',
        // Table Status Viewing
        'tables.read',
        // Basic Reports (own transactions)
        'reports.read',
      ],
    },
    {
      name: 'Kitchen Staff',
      description: 'Kitchen staff with order preparation and food fulfillment access',
      isSystem: true,
      permissions: [
        // Order Management (kitchen operations)
        'orders.read',
        'orders.update',
        // Menu & Recipe Viewing
        'menu.read',
        'recipes.read',
        // Inventory Viewing (ingredient availability)
        'inventory.read',
      ],
    },
    {
      name: 'Waiter',
      description: 'Waiter with customer service and table management',
      isSystem: true,
      permissions: [
        // Menu Viewing
        'menu.read',
        // Order Management
        'orders.read',
        'orders.create',
        'orders.update',
        // Table Management
        'tables.read',
        'tables.update',
        // Reservation Viewing
        'reservations.read',
        // Customer Management
        'customers.read',
        'customers.create',
        // Waiter Calls & Bill Requests
        'waiter-calls.read',
        'waiter-calls.update',
        'bill-requests.read',
        'bill-requests.update',
        // Payment Collection (for bill requests)
        'payments.create',
      ],
    },
  ];

  for (const roleData of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: roleData,
      });
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      console.log(`⏭️  Role already exists: ${roleData.name}`);
    }
  }

  // Create a demo restaurant
  console.log('\nCreating demo restaurant...');

  let restaurant = await prisma.restaurant.findFirst({
    where: { name: 'Demo Restaurant' },
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Demo Restaurant',
        description: 'A demo restaurant for testing',
        email: 'demo@restaurant.com',
        phone: '+251911234567',
        address: 'Bole, Addis Ababa',
        city: 'Addis Ababa',
        country: 'Ethiopia',
        taxRate: 2,
        vatRate: 15,
        serviceCharge: 10,
        currency: 'ETB',
      },
    });
    console.log(`✅ Created restaurant: ${restaurant.name}`);
  } else {
    console.log(`⏭️  Restaurant already exists: ${restaurant.name}`);
  }

  // Create a demo branch
  console.log('\nCreating demo branch...');

  let branch = await prisma.branch.findFirst({
    where: { code: 'MAIN-001' },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        code: 'MAIN-001',
        restaurantId: restaurant.id,
        address: 'Bole Road, Addis Ababa',
        phone: '+251911234567',
        isActive: true,
        openingTime: '08:00',
        closingTime: '22:00',
      },
    });
    console.log(`✅ Created branch: ${branch.name}`);
  } else {
    console.log(`⏭️  Branch already exists: ${branch.name}`);
  }

  // Create Owner user
  console.log('\nCreating Owner user...');

  const ownerRole = await prisma.role.findUnique({
    where: { name: 'Owner' },
  });

  if (!ownerRole) {
    throw new Error('Owner role not found');
  }

  const existingOwner = await prisma.user.findUnique({
    where: { email: 'owner@rms.com' },
  });

  if (!existingOwner) {
    const hashedPassword = await bcrypt.hash('owner123', 10);

    await prisma.user.create({
      data: {
        email: 'owner@rms.com',
        username: 'owner',
        password: hashedPassword,
        firstName: 'Restaurant',
        lastName: 'Owner',
        phone: '+251911111111',
        roleId: ownerRole.id,
        restaurantId: restaurant.id,
        branchId: branch.id,
        isActive: true,
        isLocked: false,
      },
    });
    console.log('✅ Created Owner user');
    console.log('   📧 Email: owner@rms.com');
    console.log('   🔑 Password: owner123');
  } else {
    console.log('⏭️  Owner user already exists');
  }

  // Create Manager user
  console.log('\nCreating Manager user...');

  const managerRole = await prisma.role.findUnique({
    where: { name: 'Manager' },
  });

  if (!managerRole) {
    throw new Error('Manager role not found');
  }

  const existingManager = await prisma.user.findUnique({
    where: { email: 'manager@rms.com' },
  });

  if (!existingManager) {
    const hashedPassword = await bcrypt.hash('manager123', 10);

    await prisma.user.create({
      data: {
        email: 'manager@rms.com',
        username: 'manager',
        password: hashedPassword,
        firstName: 'Branch',
        lastName: 'Manager',
        phone: '+251922222222',
        roleId: managerRole.id,
        restaurantId: restaurant.id,
        branchId: branch.id,
        isActive: true,
        isLocked: false,
      },
    });
    console.log('✅ Created Manager user');
    console.log('   📧 Email: manager@rms.com');
    console.log('   🔑 Password: manager123');
  } else {
    console.log('⏭️  Manager user already exists');
  }

  // Create Cashier user
  console.log('\nCreating Cashier user...');

  const cashierRole = await prisma.role.findUnique({
    where: { name: 'Cashier' },
  });

  if (!cashierRole) {
    throw new Error('Cashier role not found');
  }

  const existingCashier = await prisma.user.findUnique({
    where: { email: 'cashier@rms.com' },
  });

  if (!existingCashier) {
    const hashedPassword = await bcrypt.hash('cashier123', 10);

    await prisma.user.create({
      data: {
        email: 'cashier@rms.com',
        username: 'cashier',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Cashier',
        phone: '+251933333333',
        roleId: cashierRole.id,
        restaurantId: restaurant.id,
        branchId: branch.id,
        isActive: true,
        isLocked: false,
      },
    });
    console.log('✅ Created Cashier user');
    console.log('   📧 Email: cashier@rms.com');
    console.log('   🔑 Password: cashier123');
  } else {
    console.log('⏭️  Cashier user already exists');
  }

  // Create Kitchen Staff user
  console.log('\nCreating Kitchen Staff user...');

  const kitchenRole = await prisma.role.findUnique({
    where: { name: 'Kitchen Staff' },
  });

  if (!kitchenRole) {
    throw new Error('Kitchen Staff role not found');
  }

  const existingKitchen = await prisma.user.findUnique({
    where: { email: 'kitchen@rms.com' },
  });

  if (!existingKitchen) {
    const hashedPassword = await bcrypt.hash('kitchen123', 10);

    await prisma.user.create({
      data: {
        email: 'kitchen@rms.com',
        username: 'kitchen',
        password: hashedPassword,
        firstName: 'Chef',
        lastName: 'Cook',
        phone: '+251944444444',
        roleId: kitchenRole.id,
        restaurantId: restaurant.id,
        branchId: branch.id,
        isActive: true,
        isLocked: false,
      },
    });
    console.log('✅ Created Kitchen Staff user');
    console.log('   📧 Email: kitchen@rms.com');
    console.log('   🔑 Password: kitchen123');
  } else {
    console.log('⏭️  Kitchen Staff user already exists');
  }

  // Create Waiter user
  console.log('\nCreating Waiter user...');

  const waiterRole = await prisma.role.findUnique({
    where: { name: 'Waiter' },
  });

  if (!waiterRole) {
    throw new Error('Waiter role not found');
  }

  const existingWaiter = await prisma.user.findUnique({
    where: { email: 'waiter@rms.com' },
  });

  if (!existingWaiter) {
    const hashedPassword = await bcrypt.hash('waiter123', 10);

    await prisma.user.create({
      data: {
        email: 'waiter@rms.com',
        username: 'waiter',
        password: hashedPassword,
        firstName: 'Server',
        lastName: 'Waiter',
        phone: '+251955555555',
        roleId: waiterRole.id,
        restaurantId: restaurant.id,
        branchId: branch.id,
        isActive: true,
        isLocked: false,
      },
    });
    console.log('✅ Created Waiter user');
    console.log('   📧 Email: waiter@rms.com');
    console.log('   🔑 Password: waiter123');
  } else {
    console.log('⏭️  Waiter user already exists');
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📝 Summary:');
  console.log('   - 5 Roles created (Owner, Manager, Cashier, Kitchen Staff, Waiter)');
  console.log('   - 1 Restaurant created');
  console.log('   - 1 Branch created');
  console.log('   - 5 Demo users created');
  console.log('\n🔐 Login Credentials:');
  console.log('   Owner: owner@rms.com / owner123');
  console.log('   Manager: manager@rms.com / manager123');
  console.log('   Cashier: cashier@rms.com / cashier123');
  console.log('   Kitchen Staff: kitchen@rms.com / kitchen123');
  console.log('   Waiter: waiter@rms.com / waiter123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

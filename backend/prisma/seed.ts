import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create roles
  console.log('Creating roles...');

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      isSystem: true,
      permissions: ['*'], // Wildcard for all permissions
    },
    {
      name: 'Admin',
      description: 'Restaurant administrator with full management access',
      isSystem: true,
      permissions: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'restaurants.create',
        'restaurants.read',
        'restaurants.update',
        'restaurants.delete',
        'branches.create',
        'branches.read',
        'branches.update',
        'branches.delete',
        'menu.create',
        'menu.read',
        'menu.update',
        'menu.delete',
        'orders.read',
        'orders.create',
        'orders.update',
        'orders.cancel',
        'inventory.read',
        'inventory.update',
        'reports.read',
        'settings.read',
        'settings.update',
      ],
    },
    {
      name: 'Manager',
      description: 'Branch manager with operational access',
      isSystem: true,
      permissions: [
        'users.read',
        'branches.read',
        'menu.read',
        'menu.update',
        'orders.read',
        'orders.create',
        'orders.update',
        'orders.cancel',
        'inventory.read',
        'inventory.update',
        'customers.read',
        'customers.create',
        'reservations.read',
        'reservations.create',
        'reports.read',
        'employees.read',
        'employees.update',
      ],
    },
    {
      name: 'Cashier',
      description: 'POS operator with order and payment access',
      isSystem: true,
      permissions: [
        'menu.read',
        'orders.read',
        'orders.create',
        'orders.update',
        'payments.create',
        'customers.read',
        'customers.create',
      ],
    },
    {
      name: 'Waiter',
      description: 'Waiter with order taking capabilities',
      isSystem: true,
      permissions: [
        'menu.read',
        'orders.read',
        'orders.create',
        'orders.update',
        'tables.read',
        'tables.update',
        'reservations.read',
      ],
    },
    {
      name: 'Kitchen Staff',
      description: 'Kitchen staff with order preparation access',
      isSystem: true,
      permissions: [
        'orders.read',
        'orders.update',
        'menu.read',
      ],
    },
    {
      name: 'Delivery',
      description: 'Delivery personnel',
      isSystem: true,
      permissions: [
        'orders.read',
        'orders.update',
        'customers.read',
      ],
    },
    {
      name: 'Inventory Manager',
      description: 'Inventory and purchasing manager',
      isSystem: true,
      permissions: [
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
        'reports.read',
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

  // Create Super Admin user
  console.log('\nCreating Super Admin user...');

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@rms.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        email: 'admin@rms.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+251911111111',
        roleId: superAdminRole.id,
        restaurantId: restaurant.id,
        branchId: branch.id,
        isActive: true,
        isLocked: false,
      },
    });
    console.log('✅ Created Super Admin user');
    console.log('   📧 Email: admin@rms.com');
    console.log('   🔑 Password: admin123');
  } else {
    console.log('⏭️  Super Admin user already exists');
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

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📝 Summary:');
  console.log('   - 8 Roles created');
  console.log('   - 1 Restaurant created');
  console.log('   - 1 Branch created');
  console.log('   - 3 Demo users created');
  console.log('\n🔐 Login Credentials:');
  console.log('   Super Admin: admin@rms.com / admin123');
  console.log('   Manager: manager@rms.com / manager123');
  console.log('   Cashier: cashier@rms.com / cashier123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

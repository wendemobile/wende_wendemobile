import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function initializeDatabase() {
  console.log('Checking database initialization...');

  try {
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (adminExists) {
      console.log('Database already initialized. Skipping...');
      return;
    }

    console.log('Initializing database with default data...');

    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Full system access',
        permissions: ['*'],
      },
    });

    const cashierRole = await prisma.role.upsert({
      where: { name: 'CASHIER' },
      update: {},
      create: {
        name: 'CASHIER',
        description: 'POS and sales operations',
        permissions: ['sales', 'customers', 'items:read'],
      },
    });

    const basementManagerRole = await prisma.role.upsert({
      where: { name: 'BASEMENT_MANAGER' },
      update: {},
      create: {
        name: 'BASEMENT_MANAGER',
        description: 'Inventory and transfer management',
        permissions: ['inventory', 'transfers', 'items'],
      },
    });

    const salesmanRole = await prisma.role.upsert({
      where: { name: 'SALESMAN' },
      update: {},
      create: {
        name: 'SALESMAN',
        description: 'Sales attribution and transfers',
        permissions: ['sales:read', 'transfers:read'],
      },
    });

    // Create locations
    const showroom = await prisma.location.upsert({
      where: { name: 'Showroom' },
      update: {},
      create: {
        name: 'Showroom',
        type: 'SHOWROOM',
        description: 'Main showroom floor',
      },
    });

    const basement = await prisma.location.upsert({
      where: { name: 'Basement' },
      update: {},
      create: {
        name: 'Basement',
        type: 'BASEMENT',
        description: 'Basement storage',
      },
    });

    await prisma.location.upsert({
      where: { name: 'Warehouse' },
      update: {},
      create: {
        name: 'Warehouse',
        type: 'WAREHOUSE',
        description: 'Main warehouse',
      },
    });

    // Create admin user
    const adminHash = await hash('admin123', 12);
    
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@webpos.local',
        passwordHash: adminHash,
        fullName: 'System Administrator',
        roleId: adminRole.id,
        defaultLocationId: showroom.id,
      },
    });

    // Create cashier user
    const cashierHash = await hash('cashier123', 12);
    
    await prisma.user.upsert({
      where: { username: 'cashier' },
      update: {},
      create: {
        username: 'cashier',
        email: 'cashier@webpos.local',
        passwordHash: cashierHash,
        fullName: 'Default Cashier',
        roleId: cashierRole.id,
        defaultLocationId: showroom.id,
      },
    });

    // Create salesman user
    const salesmanHash = await hash('salesman123', 12);
    
    await prisma.user.upsert({
      where: { username: 'salesman' },
      update: {},
      create: {
        username: 'salesman',
        email: 'salesman@webpos.local',
        passwordHash: salesmanHash,
        fullName: 'Default Salesman',
        roleId: salesmanRole.id,
        defaultLocationId: showroom.id,
      },
    });

    // Create basement manager user
    const basementHash = await hash('basement123', 12);
    
    await prisma.user.upsert({
      where: { username: 'basement' },
      update: {},
      create: {
        username: 'basement',
        email: 'basement@webpos.local',
        passwordHash: basementHash,
        fullName: 'Basement Manager',
        roleId: basementManagerRole.id,
        defaultLocationId: basement.id,
      },
    });

    console.log('Database initialized successfully!');
    console.log('Default users:');
    console.log('  - admin / admin123 (Administrator)');
    console.log('  - cashier / cashier123 (Cashier)');
    console.log('  - salesman / salesman123 (Salesman)');
    console.log('  - basement / basement123 (Basement Manager)');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();

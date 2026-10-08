const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const rolesData = [
    { name: 'super_admin', description: 'Complete system access and operational management' },
    { name: 'admin', description: 'Store manager with access to inventory, reports, and catalog' },
    { name: 'cashier', description: 'POS operator processing orders and payments' },
    { name: 'kitchen', description: 'Kitchen display and production batch processor' }
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
  console.log('Roles seeded.');

  const permissionsData = [
    'users.manage', 'roles.manage',
    'inventory.view', 'inventory.manage',
    'products.view', 'products.manage',
    'production.view', 'production.manage',
    'orders.view', 'orders.create', 'orders.cancel',
    'reports.view'
  ];

  for (const name of permissionsData) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Permissions seeded.');

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();

  const getRole = (name) => roles.find((r) => r.name === name);
  const getPermissions = (names) => permissions.filter((p) => names.includes(p.name));

  const rolePermissionMap = {
    'super_admin': permissions.map(p => p.name),
    'admin': [
      'inventory.view', 'inventory.manage',
      'products.view', 'products.manage',
      'production.view',
      'orders.view', 'orders.create', 'orders.cancel',
      'reports.view'
    ],
    'cashier': ['products.view', 'orders.view', 'orders.create'],
    'kitchen': ['products.view', 'production.view', 'production.manage']
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
    const role = getRole(roleName);
    const perms = getPermissions(permNames);

    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id
        }
      });
    }
  }
  console.log('Role permissions seeded.');

  const usersData = [
    { roleName: 'super_admin', name: 'Super Administrator', email: 'superadmin@example.com' },
    { roleName: 'admin', name: 'Store Manager', email: 'admin@example.com' },
    { roleName: 'cashier', name: 'POS Cashier', email: 'cashier@example.com' },
    { roleName: 'kitchen', name: 'Kitchen Staff', email: 'kitchen@example.com' },
  ];

  const defaultPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

  for (const u of usersData) {
    const role = getRole(u.roleName);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        roleId: role.id,
        name: u.name,
      },
      create: {
        roleId: role.id,
        name: u.name,
        email: u.email,
        password: defaultPassword,
      }
    });
  }
  console.log('Users seeded.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed successfully.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

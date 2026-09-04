const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const USERS = [
  {
    username: 'admin',
    primaryEmail: 'admin@techzone.dev',
    firstName: 'Admin',
    lastName: 'Techzone',
    displayName: 'Administrateur',
    password: 'Admin@2026!',
    roleCode: 'iam-admin',
    roleName: 'IAM Administrator',
    permissionCodes: [
      'iam.users.read',
      'iam.users.write',
      'iam.roles.read',
      'iam.roles.write',
      'iam.policies.read',
      'iam.policies.write',
      'iam.sessions.read',
      'iam.sessions.revoke',
    ],
  },
  {
    username: 'manager',
    primaryEmail: 'manager@techzone.dev',
    firstName: 'Manager',
    lastName: 'Techzone',
    displayName: 'Manager',
    password: 'Manager@2026!',
    roleCode: 'iam-manager',
    roleName: 'IAM Manager',
    permissionCodes: [
      'iam.users.read',
      'iam.users.write',
      'iam.roles.read',
      'iam.sessions.read',
    ],
  },
  {
    username: 'user',
    primaryEmail: 'user@techzone.dev',
    firstName: 'User',
    lastName: 'Techzone',
    displayName: 'Utilisateur',
    password: 'User@2026!',
    roleCode: 'iam-viewer',
    roleName: 'IAM Viewer',
    permissionCodes: ['iam.users.read'],
  },
];

async function upsertPermission(code, resource, action, name) {
  return prisma.permission.upsert({
    where: { code },
    update: {},
    create: { code, resource, action, name, active: true },
  });
}

async function upsertRole(tenantId, code, name) {
  return prisma.role.upsert({
    where: { tenantId_code: { tenantId, code } },
    update: { name, status: 'ACTIVE' },
    create: { tenantId, code, name, status: 'ACTIVE', system: false },
  });
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { code: 'techzone-demo' },
    update: {},
    create: { code: 'techzone-demo', name: 'Techzone Demo Tenant', status: 'ACTIVE' },
  });

  const organization = await prisma.organization.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'org-demo' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'org-demo',
      name: 'Techzone Demo Org',
      status: 'ACTIVE',
    },
  });

  const allPermissionCodes = new Set();
  for (const u of USERS) for (const p of u.permissionCodes) allPermissionCodes.add(p);

  for (const code of allPermissionCodes) {
    const [resource, action] = code.replace(/^iam\./, '').split('.');
    await upsertPermission(code, resource || 'iam', action || 'read', code);
  }

  const roleByCode = {};
  for (const u of USERS) {
    if (roleByCode[u.roleCode]) continue;
    roleByCode[u.roleCode] = await upsertRole(tenant.id, u.roleCode, u.roleName);
  }

  for (const role of Object.values(roleByCode)) {
    for (const code of USERS.find((u) => u.roleCode === role.code).permissionCodes) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  const created = [];
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);

    const identity = await prisma.identity.upsert({
      where: { provider_subject: { provider: 'local', subject: u.username } },
      update: { email: u.primaryEmail, status: 'ACTIVE' },
      create: {
        type: 'HUMAN',
        status: 'ACTIVE',
        provider: 'local',
        subject: u.username,
        email: u.primaryEmail,
        confidence: 1.0,
      },
    });

    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        primaryEmail: u.primaryEmail,
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: u.displayName,
        status: 'ACTIVE',
        defaultTenantId: tenant.id,
      },
      create: {
        username: u.username,
        primaryEmail: u.primaryEmail,
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: u.displayName,
        status: 'ACTIVE',
        defaultTenantId: tenant.id,
      },
    });

    await prisma.userIdentity.upsert({
      where: { userId_identityId: { userId: user.id, identityId: identity.id } },
      update: { isPrimary: true, unlinkedAt: null },
      create: { userId: user.id, identityId: identity.id, isPrimary: true },
    });

    await prisma.credential.upsert({
      where: { id: `cred-${user.id}-password` },
      update: { secretHash: passwordHash, status: 'ACTIVE', revokedAt: null },
      create: {
        id: `cred-${user.id}-password`,
        userId: user.id,
        type: 'PASSWORD',
        status: 'ACTIVE',
        secretHash: passwordHash,
        identifier: u.primaryEmail,
      },
    });

    await prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash },
    });

    await prisma.membership.upsert({
      where: { id: `mem-${user.id}-${tenant.id}` },
      update: { status: 'ACTIVE', revokedAt: null },
      create: {
        id: `mem-${user.id}-${tenant.id}`,
        userId: user.id,
        tenantId: tenant.id,
        organizationId: organization.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });

    const role = roleByCode[u.roleCode];
    await prisma.roleAssignment.upsert({
      where: { id: `ra-${user.id}-${role.id}` },
      update: { revokedAt: null },
      create: {
        id: `ra-${user.id}-${role.id}`,
        roleId: role.id,
        userId: user.id,
        tenantId: tenant.id,
        organizationId: organization.id,
      },
    });

    created.push({ username: u.username, email: u.primaryEmail });
  }

  console.log('Utilisateurs validés :');
  for (const c of created) console.log(`  - ${c.username} / ${c.email}`);
  console.log('Mots de passe :');
  console.log('  admin   → Admin@2026!');
  console.log('  manager → Manager@2026!');
  console.log('  user    → User@2026!');
}

main()
  .catch((err) => {
    console.error('Seed users failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

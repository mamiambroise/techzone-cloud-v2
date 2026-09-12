const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('TestPassword123!', 12);

  const tenant = await prisma.tenant.upsert({
    where: { code: 'techzone-demo' },
    update: {},
    create: {
      code: 'techzone-demo',
      name: 'Techzone Demo Tenant',
      status: 'ACTIVE',
    },
  });

  const organization = await prisma.organization.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'org-demo',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'org-demo',
      name: 'Techzone Demo Org',
      status: 'ACTIVE',
    },
  });

  const identity = await prisma.identity.upsert({
    where: {
      provider_subject: {
        provider: 'local',
        subject: 'nassa.test',
      },
    },
    update: {},
    create: {
      type: 'HUMAN',
      status: 'ACTIVE',
      provider: 'local',
      subject: 'nassa.test',
      email: 'nassa.test@techzone.dev',
      confidence: 1.0,
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'nassa.test' },
    update: {
      primaryEmail: 'nassa.test@techzone.dev',
      firstName: 'Nassa',
      lastName: 'Test',
      status: 'ACTIVE',
    },
    create: {
      username: 'nassa.test',
      primaryEmail: 'nassa.test@techzone.dev',
      firstName: 'Nassa',
      lastName: 'Test',
      status: 'ACTIVE',
    },
  });

  const existingLink = await prisma.userIdentity.findFirst({
    where: { userId: user.id, identityId: identity.id },
  });
  if (!existingLink) {
    await prisma.userIdentity.create({
      data: { userId: user.id, identityId: identity.id, isPrimary: true },
    });
  }

  const existingCredential = await prisma.credential.findFirst({
    where: { userId: user.id, type: 'PASSWORD' },
  });
  if (!existingCredential) {
    await prisma.credential.create({
      data: {
        userId: user.id,
        type: 'PASSWORD',
        status: 'ACTIVE',
        secretHash: passwordHash,
      },
    });
  }

  const passwordHistory = await prisma.passwordHistory.findFirst({
    where: { userId: user.id },
  });
  if (!passwordHistory) {
    await prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash },
    });
  }

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id, tenantId: tenant.id },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        organizationId: organization.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });
  }

  const permissionCodes = [
    'iam.context.test.read',
    'iam.sessions.manage',
    'iam.users.manage',
    'iam.security.manage',
    'iam.context.manage',
    'billing.features.manage',
    'billing.entitlements.manage',
    'billing.plans.manage',
    'billing.subscriptions.manage',
    'billing.invoices.manage',
    'billing.webhooks.manage',
    'billing.payments.manage',
    'admin.users.manage',
    'admin.tenants.manage',
    'admin.governance.manage',
    'admin.delegations.manage',
    'admin.monitoring.manage',
    'admin.actions.manage',
  ];

  const permissions = {};
  for (const code of permissionCodes) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { active: true },
      create: {
        code,
        resource: code.split('.')[1] || 'general',
        action: 'manage',
        name: code,
      },
    });
    permissions[code] = permission;
  }

  const role = await prisma.role.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'demo-viewer',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'demo-viewer',
      name: 'Demo Viewer',
      status: 'ACTIVE',
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: permissions['iam.context.test.read'].id,
      },
    },
    update: {},
    create: {
      roleId: role.id,
      permissionId: permissions['iam.context.test.read'].id,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'demo-admin',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'demo-admin',
      name: 'Demo Admin',
      status: 'ACTIVE',
    },
  });

  for (const code of [
    'iam.sessions.manage',
    'iam.users.manage',
    'iam.security.manage',
    'iam.context.manage',
    'billing.features.manage',
    'billing.entitlements.manage',
    'billing.plans.manage',
    'billing.subscriptions.manage',
    'billing.invoices.manage',
    'billing.webhooks.manage',
    'billing.payments.manage',
    'admin.users.manage',
    'admin.tenants.manage',
    'admin.governance.manage',
    'admin.delegations.manage',
    'admin.monitoring.manage',
    'admin.actions.manage',
  ]) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permissions[code].id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permissions[code].id,
      },
    });
  }

  const roleAssignment = await prisma.roleAssignment.findFirst({
    where: { userId: user.id, roleId: role.id, tenantId: tenant.id },
  });
  if (!roleAssignment) {
    await prisma.roleAssignment.create({
      data: { roleId: role.id, userId: user.id, tenantId: tenant.id },
    });
  }

  const adminAssignment = await prisma.roleAssignment.findFirst({
    where: { userId: user.id, roleId: adminRole.id, tenantId: tenant.id },
  });
  if (!adminAssignment) {
    await prisma.roleAssignment.create({
      data: { roleId: adminRole.id, userId: user.id, tenantId: tenant.id },
    });
  } else if (adminAssignment.revokedAt) {
    await prisma.roleAssignment.update({
      where: { id: adminAssignment.id },
      data: {
        revokedAt: null,
        revokedBy: null,
        revokeReason: null,
      },
    });
  }

  await prisma.accessPolicy.upsert({
    where: {
      tenantId_code_version: {
        tenantId: tenant.id,
        code: 'demo-allow-context-read',
        version: 1,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'demo-allow-context-read',
      name: 'Allow context read (demo)',
      status: 'ACTIVE',
      effect: 'ALLOW',
      priority: 100,
      resource: 'context',
      action: 'read',
      version: 1,
    },
  });

  await prisma.feature.upsert({
    where: { code: 'api.access' },
    update: {},
    create: {
      code: 'api.access',
      name: 'Accès API',
      description: 'Accès aux endpoints API Techzone',
      metered: false,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seed terminé');
  console.log({
    tenantId: tenant.id,
    organizationId: organization.id,
    userId: user.id,
  });
}

main()
  .catch((err) => {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

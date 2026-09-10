const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("TestPassword123!", 12);

  const tenant = await prisma.tenant.create({
    data: {
      code: "techzone-demo",
      name: "Techzone Demo Tenant",
      status: "ACTIVE",
    },
  });

  const organization = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      code: "org-demo",
      name: "Techzone Demo Org",
      status: "ACTIVE",
    },
  });

  const identity = await prisma.identity.create({
    data: {
      type: "HUMAN",
      status: "ACTIVE",
      email: "nassa.test@techzone.dev",
      confidence: 1.0,
    },
  });

  const user = await prisma.user.create({
    data: {
      username: "nassa.test",
      primaryEmail: "nassa.test@techzone.dev",
      firstName: "Nassa",
      lastName: "Test",
      status: "ACTIVE",
    },
  });

  await prisma.userIdentity.create({
    data: { userId: user.id, identityId: identity.id, isPrimary: true },
  });

  await prisma.credential.create({
    data: {
      userId: user.id,
      type: "PASSWORD",
      status: "ACTIVE",
      secretHash: passwordHash,
    },
  });

  await prisma.passwordHistory.create({
    data: { userId: user.id, passwordHash },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      organizationId: organization.id,
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });

  const permission = await prisma.permission.create({
    data: {
      code: "iam.context.test.read",
      resource: "context",
      action: "read",
      name: "Lire le contexte de test",
    },
  });

  const role = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      code: "demo-viewer",
      name: "Demo Viewer",
      status: "ACTIVE",
    },
  });

  await prisma.rolePermission.create({
    data: { roleId: role.id, permissionId: permission.id },
  });

  await prisma.roleAssignment.create({
    data: { roleId: role.id, userId: user.id, tenantId: tenant.id },
  });

  await prisma.accessPolicy.create({
    data: {
      tenantId: tenant.id,
      code: "demo-allow-context-read",
      name: "Allow context read (demo)",
      status: "ACTIVE",
      effect: "ALLOW",
      priority: 100,
      resource: "context",
      action: "read",
    },
  });

  const adminPermissions = await Promise.all(
    [
      "iam.sessions.manage",
      "iam.users.manage",
      "iam.security.manage",
      "iam.context.manage",
    ].map((code) =>
      prisma.permission.create({
        data: {
          code,
          resource: code.split(".")[1],
          action: "manage",
          name: code,
        },
      }),
    ),
  );

  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      code: "demo-admin",
      name: "Demo Admin",
      status: "ACTIVE",
    },
  });

  await prisma.rolePermission.createMany({
    data: adminPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });

  await prisma.roleAssignment.create({
    data: { roleId: adminRole.id, userId: user.id, tenantId: tenant.id },
  });
  const featurePermission = await prisma.permission.create({
  data: { code: 'billing.features.manage', resource: 'features', action: 'manage', name: 'billing.features.manage' },
});
await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: featurePermission.id } });

await prisma.feature.create({
  data: { code: 'api.access', name: 'Accès API', description: 'Accès aux endpoints API Techzone', metered: false, status: 'ACTIVE' },
});
  const entitlementPermission = await prisma.permission.create({
    data: {
      code: "billing.entitlements.manage",
      resource: "entitlements",
      action: "manage",
      name: "billing.entitlements.manage",
    },
  });
  await prisma.rolePermission.create({
    data: { roleId: adminRole.id, permissionId: entitlementPermission.id },
  });
  const billingPermissions = await Promise.all(
    [
      "billing.plans.manage",
      "billing.subscriptions.manage",
      "billing.invoices.manage",
    ].map((code) =>
      prisma.permission.create({
        data: {
          code,
          resource: code.split(".")[1],
          action: "manage",
          name: code,
        },
      }),
    ),
  );

  await prisma.rolePermission.createMany({
    data: billingPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  const webhookPermission = await prisma.permission.create({
    data: {
      code: "billing.webhooks.manage",
      resource: "webhooks",
      action: "manage",
      name: "billing.webhooks.manage",
    },
  });
  await prisma.rolePermission.create({
    data: { roleId: adminRole.id, permissionId: webhookPermission.id },
  });
  const paymentPermission = await prisma.permission.create({
    data: {
      code: "billing.payments.manage",
      resource: "payments",
      action: "manage",
      name: "billing.payments.manage",
    },
  });
  await prisma.rolePermission.create({
    data: { roleId: adminRole.id, permissionId: paymentPermission.id },
  });

  console.log("✅ Seed terminé");
  console.log({
    tenantId: tenant.id,
    organizationId: organization.id,
    userId: user.id,
  });
}

main()
  .catch((err) => {
    console.error("❌ Erreur seed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

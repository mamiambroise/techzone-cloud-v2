import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Organisation de démo
  const org = await prisma.organisation.upsert({
    where: { code: "ORG-DEMO-001" },
    update: {},
    create: {
      code: "ORG-DEMO-001",
      name: "Techzone Demo SARL",
      type: "COMPANY",
      status: "ACTIVE",
      country: "MG",
      timezone: "Indian/Antananarivo",
      locale: "fr-MG",
    },
  });

  // 2. Tenant rattaché à l'organisation
  const tenant = await prisma.tenant.upsert({
    where: { code: "TEN-DEMO-001" },
    update: {},
    create: {
      code: "TEN-DEMO-001",
      name: "Boutique Demo",
      slug: "boutique-demo",
      type: "DEMO",
      status: "ACTIVE",
      provisioningStatus: "COMPLETED",
      timezone: "Indian/Antananarivo",
      locale: "fr-MG",
      currency: "MGA",
      organisationId: org.id,
    },
  });

  // 3. Utilisateur de démo
  const user = await prisma.user.upsert({
    where: { username: "lianah.demo" },
    update: {},
    create: {
      username: "lianah.demo",
      displayName: "Lianah (Demo)",
      firstName: "Lianah",
      lastName: "Demo",
      primaryEmail: "lianah.demo@techzone.mg",
      status: "ACTIVE",
      defaultTenantId: tenant.id,
    },
  });

  // 4. Membership OWNER + TenantOwner
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      type: "OWNER",
      status: "ACTIVE",
      source: "MANUAL",
      joinedAt: new Date(),
    },
  });

  await prisma.tenantOwner.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      status: "ACTIVE",
    },
  });

  console.log("Seed terminé :", { org: org.code, tenant: tenant.code, user: user.username });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
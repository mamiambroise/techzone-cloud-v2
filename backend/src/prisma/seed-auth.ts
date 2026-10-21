import * as bcrypt from 'bcrypt';
import { createSeedPrismaClient } from './seed-client';

const PLATFORM_TENANT_ID = '00000000-0000-4000-8000-000000000000';

async function main() {
  const password = process.env.SEED_AUTH_PASSWORD;
  if (!password || password.length < 10 || password.length > 128) {
    throw new Error('SEED_AUTH_PASSWORD doit être défini et contenir entre 10 et 128 caractères.');
  }

  const username = (process.env.SEED_AUTH_USERNAME || 'techzone.admin').trim();
  const email = (process.env.SEED_AUTH_EMAIL || 'admin@techzone.local').trim().toLowerCase();
  if (!username || !email) throw new Error('Nom ou email du compte admin vide.');

  const prisma = createSeedPrismaClient();
  try {
    await prisma.tenant.upsert({
      where: { id: PLATFORM_TENANT_ID },
      update: {},
      create: {
        id: PLATFORM_TENANT_ID,
        code: 'techzone-platform',
        name: 'TechZone Platform',
        status: 'ACTIVE',
      },
    });

    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    );
    const user = await prisma.iamUser.upsert({
      where: { username },
      update: {
        primaryEmail: email,
        status: 'ACTIVE',
        isAdmin: true,
        defaultTenantId: PLATFORM_TENANT_ID,
        updatedBy: 'prisma-seed',
      },
      create: {
        username,
        primaryEmail: email,
        firstName: 'Techzone',
        lastName: 'Administrator',
        displayName: 'Techzone Administrator',
        status: 'ACTIVE',
        isAdmin: true,
        defaultTenantId: PLATFORM_TENANT_ID,
        createdBy: 'prisma-seed',
      },
      select: { id: true },
    });

    const credential = await prisma.iamCredential.findFirst({
      where: { userId: user.id, type: 'PASSWORD', status: 'ACTIVE', revokedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (credential) {
      await prisma.iamCredential.update({
        where: { id: credential.id },
        data: { secretHash: passwordHash, status: 'ACTIVE' },
      });
    } else {
      await prisma.iamCredential.create({
        data: {
          userId: user.id,
          type: 'PASSWORD',
          status: 'ACTIVE',
          secretHash: passwordHash,
          createdBy: 'prisma-seed',
        },
      });
    }

    // Login creates a session in defaultTenantId when the client does not
    // submit an explicit tenant. IAM requires an active membership there.
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, tenantId: PLATFORM_TENANT_ID, revokedAt: null },
      select: { id: true },
    });
    if (membership) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: 'ACTIVE', validFrom: null, validUntil: null, joinedAt: new Date() },
      });
    } else {
      await prisma.membership.create({
        data: {
          userId: user.id,
          tenantId: PLATFORM_TENANT_ID,
          status: 'ACTIVE',
          joinedAt: new Date(),
          createdBy: 'prisma-seed',
        },
      });
    }

    console.log(`Compte administrateur prêt : ${username} (${email}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Échec du seed d’authentification :', error);
  process.exitCode = 1;
});

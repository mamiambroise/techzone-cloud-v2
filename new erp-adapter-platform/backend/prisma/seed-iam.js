/* eslint-disable no-console */
// Seed IAM admin - node -r dotenv/config prisma/seed-iam.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
  if (!process.env.DATABASE_URL && fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'));

const prisma = new PrismaClient();

const ADMIN_USERNAME = process.env.IAM_ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.IAM_ADMIN_EMAIL || 'admin@techcloud.com';
const ADMIN_PASSWORD = process.env.IAM_ADMIN_PASSWORD || 'AdminTechCloud2026!';

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

  let user = await prisma.iamUser.findFirst({
    where: { OR: [{ username: ADMIN_USERNAME }, { primaryEmail: ADMIN_EMAIL }] },
  });

  if (!user) {
    user = await prisma.iamUser.create({
      data: {
        username: ADMIN_USERNAME,
        primaryEmail: ADMIN_EMAIL,
        firstName: 'Administrateur',
        lastName: 'TechCloud',
        displayName: 'Administrateur TechCloud',
        status: 'ACTIVE',
        isAdmin: true,
        statusChangedAt: new Date(),
        statusChangedBy: 'seed',
        statusChangedReason: 'Seed initial',
      },
    });
    console.log(`[seed] Utilisateur IAM créé: id=${user.id} username=${user.username}`);
  } else {
    await prisma.iamUser.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', isAdmin: true, statusChangedAt: new Date() },
    });
    console.log(`[seed] Utilisateur IAM existant activé: username=${user.username}`);
  }

  await prisma.iamCredential.create({
    data: { userId: user.id, type: 'PASSWORD', status: 'ACTIVE', secretHash: hashed },
  });
  await prisma.iamPasswordHistory.create({
    data: { userId: user.id, passwordHash: hashed },
  });

  console.log(`[seed] Identifiants: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('[seed] Erreur:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
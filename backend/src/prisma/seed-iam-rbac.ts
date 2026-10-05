/**
 * Point d'entrée autonome du seed IAM/RBAC.
 *
 * `seed.ts` reste le seed complet, mais il dépend de fondations de plateforme
 * qui ne sont pas toutes reproductibles sur une base migrée (dérive
 * préexistante : la migration baseline impose `applications."tenantId" NOT NULL`
 * alors que `schema.prisma` le déclare nullable). Exécuter ce fichier permet
 * de réconcilier le RBAC sans dépendre de ce chemin.
 *
 * Idempotent : deux exécutions successives produisent le même état.
 *
 * Usage : cd backend && npx tsx src/prisma/seed-iam-rbac.ts
 */

import { seedIamRbac } from './iam-rbac-seed';
import { createSeedPrismaClient } from './seed-client';

async function main() {
  const prisma = createSeedPrismaClient();

  const summary = await seedIamRbac(prisma, {
    logger: (message) => console.log(`  ${message}`),
  });

  console.log(
    `IAM/RBAC seed completed: ${summary.permissions} permissions, ` +
      `${summary.roles} rôles, ${summary.rolePermissions} grants, ` +
      `${summary.revokedRolePermissions} révocations, ` +
      `${summary.assignments} affectations (${summary.createdAssignments} créées)`,
  );
}

main()
  .catch((error) => {
    console.error('❌ IAM/RBAC seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
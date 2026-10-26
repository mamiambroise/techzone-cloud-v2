import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { PERMISSIONS } from '../src/iam/iam.constants';
import { TENANT_ROLE_CODES } from '../src/iam/iam-tenant-roles';
import { seedIamRbac } from '../src/prisma/iam-rbac-seed';

const url = process.env.TEST_DATABASE_URL;
if (!url || !/test|e2e/i.test(new URL(url).pathname)) throw new Error('TEST_DATABASE_URL must target an isolated test database.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }, { schema: new URL(url).searchParams.get('schema') ?? 'public' }) });

async function main() {
  await prisma.$connect();
  try {
    const first = await seedIamRbac(prisma, { assignments: [] });
    const second = await seedIamRbac(prisma, { assignments: [] });
    if (second.rolePermissions !== 0 || second.revokedRolePermissions !== 0) throw new Error(`RBAC seed is not idempotent: ${JSON.stringify(second)}`);
    const required = Object.values(PERMISSIONS).filter((code) => code.startsWith('observability.'));
    const persisted = await prisma.permission.findMany({ where: { code: { in: required } }, select: { code: true } });
    if (persisted.length !== required.length) throw new Error('Observability permission catalogue was not persisted.');
    const role = await prisma.role.findFirst({ where: { tenantId: null, code: TENANT_ROLE_CODES.TENANT_ADMIN }, select: { id: true } });
    if (!role) throw new Error('tenant_admin role was not created.');
    const grants = await prisma.rolePermission.findMany({ where: { roleId: role.id, revokedAt: null }, include: { permission: { select: { code: true } } } });
    const codes = new Set(grants.map((grant) => grant.permission.code));
    for (const code of [PERMISSIONS.OBSERVABILITY_SETTINGS_MANAGE, PERMISSIONS.OBSERVABILITY_EXPORT, PERMISSIONS.OBSERVABILITY_AUDIT_READ]) if (!codes.has(code)) throw new Error(`tenant_admin missing ${code}`);
    if (codes.has(PERMISSIONS.IAM_ADMIN)) throw new Error('tenant_admin received platform administration.');
    console.log('Observability RBAC integration: PASS');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });

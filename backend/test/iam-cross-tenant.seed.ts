import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { encryptSecret } from '../src/iam/iam-totp.js';

export const E2E_IDS = {
  tenantA: 'f0000000-0000-4000-8000-000000000001',
  tenantB: 'f0000000-0000-4000-8000-000000000002',
  userA: 'f0000000-0000-4000-8000-000000000011',
  userB: 'f0000000-0000-4000-8000-000000000012',
  userLimited: 'f0000000-0000-4000-8000-000000000013',
  userMfa: 'f0000000-0000-4000-8000-000000000014',
  userMfaOther: 'f0000000-0000-4000-8000-000000000015',
  roleA: 'f0000000-0000-4000-8000-000000000021',
  roleB: 'f0000000-0000-4000-8000-000000000022',
  roleLimited: 'f0000000-0000-4000-8000-000000000023',
  permissionRead: 'f0000000-0000-4000-8000-000000000031',
  permissionWrite: 'f0000000-0000-4000-8000-000000000032',
  applicationA: 'f0000000-0000-4000-8000-000000000041',
  applicationB: 'f0000000-0000-4000-8000-000000000042',
  versionA: 'f0000000-0000-4000-8000-000000000051',
  versionB: 'f0000000-0000-4000-8000-000000000052',
  pageA: 'f0000000-0000-4000-8000-000000000061',
  pageB: 'f0000000-0000-4000-8000-000000000062',
  sessionA: 'f0000000-0000-4000-8000-000000000071',
  sessionB: 'f0000000-0000-4000-8000-000000000072',
} as const;

export const E2E_USERS = {
  a: { id: E2E_IDS.userA, username: 'iam-e2e-user-a', email: 'iam-e2e-user-a@tests.invalid' },
  b: { id: E2E_IDS.userB, username: 'iam-e2e-user-b', email: 'iam-e2e-user-b@tests.invalid' },
  limited: { id: E2E_IDS.userLimited, username: 'iam-e2e-user-limited', email: 'iam-e2e-user-limited@tests.invalid' },
  mfa: { id: E2E_IDS.userMfa, username: 'iam-e2e-user-mfa', email: 'iam-e2e-user-mfa@tests.invalid' },
  mfaOther: { id: E2E_IDS.userMfaOther, username: 'iam-e2e-user-mfa-other', email: 'iam-e2e-user-mfa-other@tests.invalid' },
} as const;

export const E2E_PASSWORD = 'IamE2e!Pass2026';
export const E2E_MFA_SECRET = 'JBSWY3DPEHPK3PXP';
export const E2E_MFA_OTHER_SECRET = 'KRSXG5DSNFXGOIDB';

const tenantIds = [E2E_IDS.tenantA, E2E_IDS.tenantB];
const userIds = Object.values(E2E_USERS).map((user) => user.id);
const roleIds = [E2E_IDS.roleA, E2E_IDS.roleB, E2E_IDS.roleLimited];
const applicationIds = [E2E_IDS.applicationA, E2E_IDS.applicationB];
const versionIds = [E2E_IDS.versionA, E2E_IDS.versionB];
const pageIds = [E2E_IDS.pageA, E2E_IDS.pageB];

function assertTestDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url || !process.env.TEST_DATABASE_URL || url !== process.env.TEST_DATABASE_URL) {
    throw new Error('IAM E2E fixtures require DATABASE_URL to be exactly TEST_DATABASE_URL.');
  }
  const databaseName = new URL(url).pathname.replace(/^\/+/, '');
  if (!/(?:^|[_-])(test|e2e)(?:$|[_-])/i.test(databaseName)) {
    throw new Error(`Refusing to seed non-test database "${databaseName || 'unknown'}".`);
  }
}

export async function clearIamCrossTenantFixtures(prisma: PrismaService) {
  assertTestDatabase();
  await prisma.auditEvent.deleteMany({
    where: { OR: [{ tenantId: { in: tenantIds } }, { actorId: { in: userIds } }, { effectiveUserId: { in: userIds } }] },
  });
  await prisma.securityEvent.deleteMany({ where: { OR: [{ tenantId: { in: tenantIds } }, { userId: { in: userIds } }] } });
  await prisma.contextSnapshot.deleteMany({ where: { OR: [{ tenantId: { in: tenantIds } }, { userId: { in: userIds } }] } });
  await prisma.contextInvalidation.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.uiPage.deleteMany({ where: { id: { in: pageIds } } });
  await prisma.applicationVersion.deleteMany({ where: { id: { in: versionIds } } });
  await prisma.application.deleteMany({ where: { id: { in: applicationIds } } });
  await prisma.roleAssignment.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { roleId: { in: roleIds } }] } });
  await prisma.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
  await prisma.iamUser.deleteMany({ where: { id: { in: userIds } } });
  await prisma.role.deleteMany({ where: { id: { in: roleIds } } });
  await prisma.permission.deleteMany({ where: { id: { in: [E2E_IDS.permissionRead, E2E_IDS.permissionWrite] } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
}

async function createUser(prisma: PrismaService, user: (typeof E2E_USERS)[keyof typeof E2E_USERS], passwordHash: string) {
  await prisma.iamUser.create({
    data: {
      id: user.id,
      username: user.username,
      primaryEmail: user.email,
      status: 'ACTIVE',
      defaultTenantId:
        user.id === E2E_IDS.userB
          ? E2E_IDS.tenantB
          : user.id === E2E_IDS.userA || user.id === E2E_IDS.userLimited
            ? E2E_IDS.tenantA
            : null,
    },
  });
  await prisma.iamCredential.create({
    data: { userId: user.id, type: 'PASSWORD', status: 'ACTIVE', secretHash: passwordHash },
  });
}

export async function seedIamCrossTenantFixtures(prisma: PrismaService) {
  assertTestDatabase();
  await clearIamCrossTenantFixtures(prisma);
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);

  await prisma.tenant.createMany({
    data: [
      { id: E2E_IDS.tenantA, code: 'iam-e2e-tenant-a', name: 'IAM E2E Tenant A', status: 'ACTIVE' },
      { id: E2E_IDS.tenantB, code: 'iam-e2e-tenant-b', name: 'IAM E2E Tenant B', status: 'ACTIVE' },
    ],
  });
  for (const user of Object.values(E2E_USERS)) await createUser(prisma, user, passwordHash);

  await prisma.membership.createMany({
    data: [
      { userId: E2E_IDS.userA, tenantId: E2E_IDS.tenantA, status: 'ACTIVE', joinedAt: new Date() },
      { userId: E2E_IDS.userB, tenantId: E2E_IDS.tenantB, status: 'ACTIVE', joinedAt: new Date() },
      { userId: E2E_IDS.userLimited, tenantId: E2E_IDS.tenantA, status: 'ACTIVE', joinedAt: new Date() },
    ],
  });
  await prisma.permission.createMany({
    data: [
      { id: E2E_IDS.permissionRead, code: 'ui-builder:read', resource: 'ui-builder', action: 'read', name: 'UI Builder read' },
      { id: E2E_IDS.permissionWrite, code: 'ui-builder:write', resource: 'ui-builder', action: 'write', name: 'UI Builder write' },
    ],
  });
  await prisma.role.createMany({
    data: [
      { id: E2E_IDS.roleA, tenantId: E2E_IDS.tenantA, code: 'iam-e2e-role-a', name: 'IAM E2E Role A' },
      { id: E2E_IDS.roleB, tenantId: E2E_IDS.tenantB, code: 'iam-e2e-role-b', name: 'IAM E2E Role B' },
      { id: E2E_IDS.roleLimited, tenantId: E2E_IDS.tenantA, code: 'iam-e2e-role-limited', name: 'IAM E2E Limited Role' },
    ],
  });
  await prisma.rolePermission.createMany({
    data: [
      { roleId: E2E_IDS.roleA, permissionId: E2E_IDS.permissionRead },
      { roleId: E2E_IDS.roleA, permissionId: E2E_IDS.permissionWrite },
      { roleId: E2E_IDS.roleB, permissionId: E2E_IDS.permissionRead },
      { roleId: E2E_IDS.roleB, permissionId: E2E_IDS.permissionWrite },
      { roleId: E2E_IDS.roleLimited, permissionId: E2E_IDS.permissionRead },
    ],
  });
  await prisma.roleAssignment.createMany({
    data: [
      { userId: E2E_IDS.userA, roleId: E2E_IDS.roleA, tenantId: E2E_IDS.tenantA },
      { userId: E2E_IDS.userB, roleId: E2E_IDS.roleB, tenantId: E2E_IDS.tenantB },
      { userId: E2E_IDS.userLimited, roleId: E2E_IDS.roleLimited, tenantId: E2E_IDS.tenantA },
    ],
  });
  await prisma.application.createMany({
    data: [
      { id: E2E_IDS.applicationA, tenantId: E2E_IDS.tenantA, tenantScope: 'TENANT', code: 'iam-e2e-a', name: 'IAM E2E Resource A' },
      { id: E2E_IDS.applicationB, tenantId: E2E_IDS.tenantB, tenantScope: 'TENANT', code: 'iam-e2e-b', name: 'IAM E2E Resource B' },
    ],
  });
  await prisma.applicationVersion.createMany({
    data: [
      { id: E2E_IDS.versionA, applicationId: E2E_IDS.applicationA, tenantId: E2E_IDS.tenantA, version: '1.0.0', status: 'DRAFT' },
      { id: E2E_IDS.versionB, applicationId: E2E_IDS.applicationB, tenantId: E2E_IDS.tenantB, version: '1.0.0', status: 'DRAFT' },
    ],
  });
  await prisma.uiPage.createMany({
    data: [
      { id: E2E_IDS.pageA, applicationId: E2E_IDS.applicationA, applicationVersionId: E2E_IDS.versionA, tenantId: E2E_IDS.tenantA, key: 'iam-e2e-page-a', route: '/iam-e2e-a', title: 'IAM E2E Page A' },
      { id: E2E_IDS.pageB, applicationId: E2E_IDS.applicationB, applicationVersionId: E2E_IDS.versionB, tenantId: E2E_IDS.tenantB, key: 'iam-e2e-page-b', route: '/iam-e2e-b', title: 'IAM E2E Page B' },
    ],
  });
  await prisma.iamSession.createMany({
    data: [
      { id: E2E_IDS.sessionA, userId: E2E_IDS.userA, tenantId: E2E_IDS.tenantA, status: 'ACTIVE', authenticationLevel: 'PASSWORD', expiresAt: new Date(Date.now() + 60_000) },
      { id: E2E_IDS.sessionB, userId: E2E_IDS.userB, tenantId: E2E_IDS.tenantB, status: 'ACTIVE', authenticationLevel: 'PASSWORD', expiresAt: new Date(Date.now() + 60_000) },
    ],
  });
  await prisma.mfaMethod.createMany({
    data: [
      { userId: E2E_IDS.userMfa, type: 'TOTP', label: 'IAM E2E MFA', secretRef: encryptSecret(E2E_MFA_SECRET), enabled: true, verified: true, verifiedAt: new Date() },
      { userId: E2E_IDS.userMfaOther, type: 'TOTP', label: 'IAM E2E MFA Other', secretRef: encryptSecret(E2E_MFA_OTHER_SECRET), enabled: true, verified: true, verifiedAt: new Date() },
    ],
  });

  return { ...E2E_IDS, users: E2E_USERS };
}

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  try {
    await seedIamCrossTenantFixtures(prisma);
    console.log('IAM E2E fixtures seeded in TEST_DATABASE_URL.');
  } finally {
    await prisma.onModuleDestroy();
  }
}

if (process.argv[1]?.endsWith('iam-cross-tenant.seed.ts')) {
  void main();
}

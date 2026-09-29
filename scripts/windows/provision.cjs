const { environment, root } = require('./environment.cjs');
const { randomBytes } = require('node:crypto');
Object.assign(process.env, environment());
require(root + '/backend/node_modules/reflect-metadata');
const { PrismaService } = require(root + '/backend/dist/prisma/prisma.service');
const { IamAdminService } = require(root + '/backend/dist/iam/iam-admin.service');
const { IamTenantsService } = require(root + '/backend/dist/iam/iam-tenants.service');
const bcrypt = require(root + '/backend/node_modules/bcrypt');
(async () => {
  const db = new PrismaService();
  try {
    await db.$queryRaw`SELECT 1`;
    const username = process.env.TEST_USER_USERNAME || 'techzonetest';
    let password = process.env.TEST_USER_PASSWORD;
    let user = await db.iamUser.findUnique({ where: { username } });
    const generated = !password && !user;
    if (generated) {
      if (!process.stdout.isTTY) throw new Error('CONFIG_MISSING: TEST_USER_PASSWORD (interactive terminal required for generation)');
      password = randomBytes(24).toString('base64url');
    }
    if (!password) throw new Error('CONFIG_MISSING: TEST_USER_PASSWORD');
    if (!user) user = await new IamAdminService(db).createUser({ username, email: username + '@techzone.test', password, status: 'ACTIVE', isAdmin: false, displayName: 'Techzone Test' });
    if (user.isAdmin || user.status !== 'ACTIVE') throw new Error('TEST_USER_STATUS: expected ACTIVE non-admin; account not altered');
    const credential = await db.iamCredential.findFirst({ where: { userId: user.id, type: 'PASSWORD', status: 'ACTIVE' } });
    if (!credential || !await bcrypt.compare(password, credential.secretHash)) throw new Error('TEST_PASSWORD: INVALID; existing password not reset');
    const tenants = new IamTenantsService(db);
    let tenant = await db.tenant.findUnique({ where: { code: 'techzone-test' } });
    if (!tenant) tenant = await tenants.createTenant({ code: 'techzone-test', name: 'Techzone Test', status: 'ACTIVE' });
    if (tenant.status !== 'ACTIVE') throw new Error('TEST_TENANT: INACTIVE');
    let membership = await db.membership.findFirst({ where: { userId: user.id, tenantId: tenant.id } });
    if (!membership) membership = await tenants.createMembership(tenant.id, { userId: user.id, status: 'ACTIVE' }, user.id);
    if (membership.status !== 'ACTIVE' || (membership.validUntil && membership.validUntil < new Date())) throw new Error('TENANT_MEMBERSHIP: INACTIVE');
    const counts = await Promise.all([db.iamUser.count({ where: { username } }), db.tenant.count({ where: { code: tenant.code } }), db.membership.count({ where: { userId: user.id, tenantId: tenant.id } })]);
    if (counts.some(n => n !== 1)) throw new Error('PROVISIONING: duplicate fixture');
    console.log(JSON.stringify({ TEST_USER: username, TEST_USER_STATUS: user.status, TEST_PASSWORD: generated ? 'GENERATED' : 'CONFIGURED', TEST_TENANT: tenant.code, TENANT_MEMBERSHIP: membership.status, counts, role: 'USER' }));
    if (generated) console.log('Temporary password (shown once): ' + password);
  } catch (error) {
    // Prisma errors can include connection details. Only emit controlled diagnostics.
    console.error(/^(CONFIG_MISSING|TEST_|TENANT_|PROVISIONING)/.test(error.message) ? error.message : 'PROVISIONING_FAILED: database/schema unavailable; no migration applied');
    process.exitCode = 1;
  } finally { await db.$disconnect(); }
})();

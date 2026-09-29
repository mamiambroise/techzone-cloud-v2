const { Client } = require('pg');
const fs = require('fs');

const CONFIG = {
  host: '167.86.71.186',
  port: 28417,
  user: 'techzonecloud',
  password: 'tech-cloud-pass-db',
  database: 'techzonecloud',
  ssl: false,
};

const iamTables = [
  'User', 'Credential', 'Device', 'Session', 'RefreshToken', 'Identity',
  'UserIdentity', 'ExternalIdentityLink', 'Tenant', 'Organization', 'Site',
  'Membership', 'Group', 'GroupMember', 'Permission', 'Role', 'RolePermission',
  'RoleAssignment', 'AccessPolicy', 'PolicyCondition', 'AuthorizationDecision',
  'MfaMethod', 'RecoveryCode', 'ServiceAccount', 'ServiceAccountCredential',
  'SecurityEvent', 'ContextSnapshot', 'ContextSwitchEvent', 'ContextInvalidation',
  'AuditEvent', 'OutboxEvent', 'Plan', 'PlanEntitlement', 'Subscription',
  'SubscriptionEntitlementOverride', 'QuotaUsage', 'Invoice', 'InvoiceItem',
  'Payment', 'BillingEvent', 'AdminDelegation', 'AdministrativeAction',
  'PlatformService', 'PlatformDiagnostic', 'PlatformMaintenance', 'Feature',
  'WebhookEvent'
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function connectWithRetry(attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    try {
      const c = new Client(CONFIG);
      await c.connect();
      console.log('DB connected on attempt ' + (i + 1));
      return c;
    } catch (e) {
      console.log('Connect attempt ' + (i + 1) + ' failed: ' + e.message);
      if (i < attempts - 1) await sleep(3000 * (i + 1));
    }
  }
  throw new Error('All connection attempts failed');
}

async function queryWithRetry(client, sql, params, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { return await client.query(sql, params); }
    catch (e) {
      console.log('Query attempt ' + (i + 1) + ' failed: ' + e.message.substring(0, 100));
      if (i < attempts - 1) await sleep(5000);
    }
  }
  throw new Error('All query attempts failed: ' + sql.substring(0, 80));
}

async function main() {
  const c = await connectWithRetry();
  const output = {};

  // Enums
  console.log('\n=== ENUMS in auth_aim ===');
  const enums = await queryWithRetry(c,
    "SELECT t.typname as typname, STRING_AGG(e.enumlabel, ',' ORDER BY e.oid) as values FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typnamespace = 'auth_aim'::regnamespace GROUP BY t.typname ORDER BY t.typname"
  );
  output.enums = {};
  enums.rows.forEach((r) => {
    const vals = r.values.split(',');
    output.enums[r.typname] = vals;
    console.log(r.typname + ': [' + vals.join(', ') + ']');
  });

  // Get all columns for all auth_aim tables at once
  console.log('\n=== ALL COLUMNS in auth_aim ===');
  const allCols = await queryWithRetry(c,
    "SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'auth_aim' AND table_name != '_prisma_migrations' ORDER BY table_name, ordinal_position"
  );
  const colsByTable = {};
  allCols.rows.forEach((r) => {
    if (!colsByTable[r.table_name]) colsByTable[r.table_name] = [];
    colsByTable[r.table_name].push({ name: r.column_name, type: r.data_type, nullable: r.is_nullable, default: r.column_default });
  });
  for (const [tbl, cols] of Object.entries(colsByTable)) {
    output[tbl] = { columns: cols };
    console.log('\n--- ' + tbl + ' (' + cols.length + ' cols) ---');
    cols.forEach((col) => {
      console.log('  ' + col.name + ' | ' + col.type + ' | nullable=' + col.nullable + ' | default=' + (col.default || ''));
    });
  }

  // Get all constraints at once using format() for proper regclass casting
  console.log('\n=== ALL CONSTRAINTS in auth_aim ===');
  const allConstraints = await queryWithRetry(c,
    "SELECT c.conrelid::regclass::text as table_name, conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint c WHERE connamespace = 'auth_aim'::regnamespace ORDER BY conrelid::regclass::text, contype, conname"
  );
  allConstraints.rows.forEach((r) => {
    const tbl = r.table_name.split('.').pop();
    if (!output[tbl]) output[tbl] = {};
    if (!output[tbl].constraints) output[tbl].constraints = [];
    output[tbl].constraints.push({ name: r.conname, type: r.contype, def: r.def });
    console.log(tbl + ': ' + r.conname + ' | ' + r.contype + ' | ' + r.def);
  });

  // Get all indexes at once
  console.log('\n=== ALL INDEXES in auth_aim ===');
  const allIndexes = await queryWithRetry(c,
    "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'auth_aim' AND tablename != '_prisma_migrations' ORDER BY tablename, indexname"
  );
  allIndexes.rows.forEach((r) => {
    if (!output[r.tablename]) output[r.tablename] = {};
    if (!output[r.tablename].indexes) output[r.tablename].indexes = [];
    output[r.tablename].indexes.push({ name: r.indexname, def: r.indexdef });
    console.log(r.tablename + ': ' + r.indexname + ' | ' + r.indexdef);
  });

  // techzonetest user info
  console.log('\n=== techzonetest in auth_aim.User ===');
  const user = await queryWithRetry(c,
    'SELECT id, username, "primaryEmail", status, "defaultTenantId" FROM auth_aim."User" WHERE username = $1',
    ['techzonetest']
  );
  output.techzonetest = user.rows;
  console.log(JSON.stringify(user.rows, null, 2));

  if (user.rows.length > 0) {
    const uid = user.rows[0].id;
    console.log('\n=== Credentials for techzonetest ===');
    const creds = await queryWithRetry(c,
      'SELECT id, "userId", type, status FROM auth_aim."Credential" WHERE "userId" = $1',
      [uid]
    );
    output.credentials = creds.rows;
    console.log(JSON.stringify(creds.rows, null, 2));

    console.log('\n=== Memberships for techzonetest ===');
    const members = await queryWithRetry(c,
      'SELECT id, "tenantId", status FROM auth_aim."Membership" WHERE "userId" = $1',
      [uid]
    );
    output.memberships = members.rows;
    console.log(JSON.stringify(members.rows, null, 2));

    console.log('\n=== RoleAssignments for techzonetest ===');
    const roles = await queryWithRetry(c,
      'SELECT id, "roleId", "tenantId" FROM auth_aim."RoleAssignment" WHERE "userId" = $1',
      [uid]
    );
    output.roleAssignments = roles.rows;
    console.log(JSON.stringify(roles.rows, null, 2));

    console.log('\n=== GroupMembers for techzonetest ===');
    const groups = await queryWithRetry(c,
      'SELECT id, "groupId" FROM auth_aim."GroupMember" WHERE "userId" = $1',
      [uid]
    );
    output.groupMembers = groups.rows;
    console.log(JSON.stringify(groups.rows, null, 2));
  }

  console.log('\n=== All tenants ===');
  const tenants = await queryWithRetry(c, 'SELECT id, code, name, status FROM auth_aim."Tenant"');
  output.tenants = tenants.rows;
  console.log(JSON.stringify(tenants.rows, null, 2));

  console.log('\n=== All roles ===');
  const rolesAll = await queryWithRetry(c, 'SELECT id, "tenantId", code, name, status FROM auth_aim."Role"');
  output.roles = rolesAll.rows;
  console.log(JSON.stringify(rolesAll.rows, null, 2));

  console.log('\n=== _prisma_migrations in auth_aim ===');
  const migrations = await queryWithRetry(c,
    'SELECT migration_name, checksum, finished_at, applied_steps_count FROM auth_aim._prisma_migrations ORDER BY started_at'
  );
  output.migrations_auth_aim = migrations.rows;
  migrations.rows.forEach((r) => {
    console.log(r.migration_name + ' | steps=' + r.applied_steps_count + ' | ' + r.finished_at + ' | checksum=' + r.checksum);
  });

  console.log('\n=== _prisma_migrations in business_manager ===');
  const bmMigrations = await queryWithRetry(c,
    'SELECT migration_name, checksum, finished_at, applied_steps_count FROM business_manager._prisma_migrations ORDER BY started_at'
  );
  output.migrations_business_manager = bmMigrations.rows;
  bmMigrations.rows.forEach((r) => {
    console.log(r.migration_name + ' | steps=' + r.applied_steps_count + ' | ' + r.finished_at + ' | checksum=' + r.checksum);
  });

  // Save
  const outDir = 'docs/iam-reconciliation';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outDir + '/iam-database-inventory.json', JSON.stringify(output, null, 2));
  console.log('\n=== DONE - saved inventory ===');

  await c.end();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exitCode = 1;
});

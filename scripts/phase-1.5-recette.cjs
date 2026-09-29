const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://localhost:3003';
const credsPath = path.join(process.env.LOCALAPPDATA, 'TechzoneRecipe', 'test-login.json');
const account = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

async function main() {
  const result = {
    timestamp: new Date().toISOString(),
    steps: {},
  };

  // Step 1: Login
  const loginRes = await fetch(`${BASE}/api/iam/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: account.username,
      password: account.password,
      deviceFingerprint: 'techzone-recette-e2e',
    }),
  });
  result.steps.login = { status: loginRes.status };
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const cookies = loginRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const cookieHeader = { Cookie: cookies };

  // Step 2: Resolve context (to get userId)
  const ctxRes = await fetch(`${BASE}/api/iam/context/resolve`, {
    method: 'POST',
    headers: { ...cookieHeader, 'Content-Type': 'application/json' },
    body: '{}',
  });
  result.steps.context = { status: ctxRes.status };
  const ctxBody = await ctxRes.json();
  result.steps.context.data = ctxBody.data;
  const userId = ctxBody.data?.principal?.userId;
  result.steps.context.userId = userId;
  if (!userId) {
    console.error('No userId in context');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Step 3: Check if techzone-test tenant already exists
  const listRes = await fetch(`${BASE}/api/iam/admin/tenants?search=techzone-test`, {
    headers: cookieHeader,
  });
  result.steps.tenantList = { status: listRes.status };
  const listBody = await listRes.json();
  const existingTenant = listBody.data?.find((t) => t.code === 'techzone-test');

  let tenantId;

  if (existingTenant) {
    tenantId = existingTenant.id;
    result.steps.tenant = { status: 'EXISTS', tenantId, code: existingTenant.code, name: existingTenant.name };
    console.log('Tenant already exists, skipping creation');
  } else {
    // Step 3a: Create tenant
    const createRes = await fetch(`${BASE}/api/iam/admin/tenants`, {
      method: 'POST',
      headers: { ...cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'techzone-test',
        name: 'Techzone Test',
        description: 'Tenant de recette E2E pour la Phase 1.5',
        status: 'ACTIVE',
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
      }),
    });
    result.steps.tenantCreate = { status: createRes.status };
    if (!createRes.ok) {
      const errBody = await createRes.json().catch(() => ({}));
      result.steps.tenantCreate.error = errBody;
      console.error('Tenant creation failed:', createRes.status, JSON.stringify(errBody));
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const createBody = await createRes.json();
    tenantId = createBody.data?.id;
    result.steps.tenant = { status: 'CREATED', tenantId, code: 'techzone-test', name: 'Techzone Test' };
  }

  // Step 4: Check if membership already exists
  const membershipsRes = await fetch(`${BASE}/api/iam/admin/tenants/${tenantId}/memberships`, {
    headers: cookieHeader,
  });
  result.steps.membershipList = { status: membershipsRes.status };
  let hasMembership = false;
  if (membershipsRes.ok) {
    const membBody = await membershipsRes.json();
    hasMembership = membBody.data?.some((m) => m.userId === userId && m.status === 'ACTIVE');
    result.steps.membershipList.existing = membBody.data?.map((m) => ({ userId: m.userId, status: m.status }));
  }

  if (!hasMembership) {
    // Step 4a: Create membership
    const memRes = await fetch(`${BASE}/api/iam/admin/tenants/${tenantId}/memberships`, {
      method: 'POST',
      headers: { ...cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        status: 'ACTIVE',
        validFrom: new Date().toISOString(),
      }),
    });
    result.steps.membershipCreate = { status: memRes.status };
    if (!memRes.ok) {
      const errBody = await memRes.json().catch(() => ({}));
      result.steps.membershipCreate.error = errBody;
      console.error('Membership creation failed:', memRes.status, JSON.stringify(errBody));
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const memBody = await memRes.json();
    result.steps.membershipCreate.data = memBody.data;
  } else {
    result.steps.membershipCreate = { status: 'ALREADY_EXISTS' };
    console.log('Membership already exists, skipping creation');
  }

  // Step 5: Switch tenant
  const switchRes = await fetch(`${BASE}/api/iam/auth/tenant/switch`, {
    method: 'POST',
    headers: { ...cookieHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId }),
  });
  result.steps.switchTenant = { status: switchRes.status };
  if (switchRes.ok) {
    const switchBody = await switchRes.json();
    result.steps.switchTenant.data = { message: switchBody.message, activeTenant: switchBody.activeTenant };
    const newCookies = switchRes.headers.getSetCookie();
    if (newCookies && newCookies.length > 0) {
      const updatedCookies = newCookies.map((nc) => nc.split(';')[0]);
      cookieHeader.Cookie = updatedCookies.join('; ');
      result.steps.switchTenant.cookiesUpdated = true;
    }
  } else {
    const errBody = await switchRes.json().catch(() => ({}));
    result.steps.switchTenant.error = errBody;
  }

  // Step 6: Verify /auth/me
  const meRes = await fetch(`${BASE}/api/iam/auth/me`, {
    headers: cookieHeader,
  });
  result.steps.me = { status: meRes.status };
  if (meRes.ok) {
    const meBody = await meRes.json();
    result.steps.me.data = {
      user: meBody.data?.user?.username,
      activeTenant: meBody.data?.activeTenant,
      tenantCount: meBody.data?.tenants?.length,
      tenants: meBody.data?.tenants,
    };
  }

  // Step 7: Verify /auth/tenants
  const tenantsRes = await fetch(`${BASE}/api/iam/auth/tenants`, {
    headers: cookieHeader,
  });
  result.steps.authTenants = { status: tenantsRes.status };
  if (tenantsRes.ok) {
    const tenantsBody = await tenantsRes.json();
    result.steps.authTenants.data = tenantsBody.data;
  }

  // Step 8: Verify /api/business-manager/configurations (expect 403 -> 200)
  const configRes = await fetch(`${BASE}/api/business-manager/configurations`, {
    headers: cookieHeader,
  });
  result.steps.bmConfigurations = { status: configRes.status };
  if (configRes.ok) {
    const configBody = await configRes.json();
    result.steps.bmConfigurations.data = configBody.data;
    result.steps.bmConfigurations.message = configBody.message;
  } else {
    const errBody = await configRes.json().catch(() => ({}));
    result.steps.bmConfigurations.error = errBody;
  }

  // Step 9: Verify context after switch
  const ctxAfterRes = await fetch(`${BASE}/api/iam/context/resolve`, {
    method: 'POST',
    headers: { ...cookieHeader, 'Content-Type': 'application/json' },
    body: '{}',
  });
  result.steps.contextAfter = { status: ctxAfterRes.status };
  if (ctxAfterRes.ok) {
    const ctxAfterBody = await ctxAfterRes.json();
    result.steps.contextAfter.data = {
      tenantId: ctxAfterBody.data?.tenant?.tenantId,
      isSuperAdmin: ctxAfterBody.data?.isSuperAdmin,
      roles: ctxAfterBody.data?.roles,
      permissions: ctxAfterBody.data?.permissions,
    };
  }

  console.log(JSON.stringify(result, null, 2));

  const output = path.join(__dirname, '..', 'docs', 'postgresql-stability', 'phase-1.5-recette.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(output, output.replace('.json', `.${Date.now()}.json`));
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log('\nResults saved to:', output);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exitCode = 1;
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
const { databaseError } = require('../src/utils/database-error');

test('database failures have distinct safe categories', () => {
  for (const code of ['P1001', 'P1002', 'P1008', 'P1017']) {
    assert.equal(databaseError({ code }).code, 'DATABASE_UNAVAILABLE');
  }
  assert.equal(databaseError({ errorCode: 'P1001' }).statusCode, 503);
  assert.equal(databaseError({ name: 'PrismaClientInitializationError', message: "Can't reach database server" }).code, 'DATABASE_UNAVAILABLE');
  assert.equal(databaseError({ code: 'P2024' }).code, 'DATABASE_POOL_TIMEOUT');
  assert.equal(databaseError({ code: 'P1000' }).code, 'DATABASE_CONFIGURATION_ERROR');
  assert.equal(databaseError({ code: 'P2021' }).code, 'DATABASE_CONFIGURATION_ERROR');
  assert.equal(databaseError({ code: 'P2002' }), null);
});

test('middleware never exposes driver secrets and preserves credential failures', () => {
  const middleware = require('../src/middlewares/error.middleware');
  const { AppError } = require('../src/utils/response');
  const original = console.error;
  const logs = [];
  console.error = value => logs.push(value);
  try {
    for (const failure of [Object.assign(new Error('secret-query-argument'), { code: 'P1001' }), new Error('secret-query-argument')]) {
      let status, body;
      const res = { status(value) { status = value; return this; }, json(value) { body = value; return this; } };
      middleware(failure, { traceId: 'test-trace' }, res);
      assert.equal(status, failure.code ? 503 : 500);
      assert.ok(!JSON.stringify(body).includes('secret-query-argument'));
      assert.equal(body.details, undefined);
    }
    assert.ok(!JSON.stringify(logs).includes('secret-query-argument'));
    let status;
    middleware(new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS'), {}, { status(value) { status = value; return this; }, json(body) { assert.equal(body.code, 'INVALID_CREDENTIALS'); } });
    assert.equal(status, 401);
  } finally { console.error = original; }
});

test('readiness checks SQL and fails closed while liveness stays available', async () => {
  const { prisma } = require('../src/config/database');
  const original = prisma.$queryRaw;
  const app = require('../src/app');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    prisma.$queryRaw = async () => [{ value: 1 }];
    assert.equal((await fetch(base + '/ready')).status, 200);
    prisma.$queryRaw = async () => { throw Object.assign(new Error('private detail'), { code: 'P1001' }); };
    const response = await fetch(base + '/ready');
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, 'DATABASE_UNAVAILABLE');
    assert.ok(!JSON.stringify(body).includes('private detail'));
    assert.equal((await fetch(base + '/health')).status, 200);
  } finally {
    prisma.$queryRaw = original;
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});

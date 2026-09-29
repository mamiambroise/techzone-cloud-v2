const { environment, root } = require('./environment.cjs');
const { Client } = require(root + '/backend/node_modules/pg');
(async () => {
  let client;
  try {
    const env = environment();
    client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 5000 });
    await client.connect();
    await client.query('SELECT 1');
    console.log('DATABASE_READY');
  } catch (error) {
    console.log(error.message.startsWith('CONFIG_MISSING') ? error.message : /timeout|timed out/i.test(error.message) ? 'DATABASE_TIMEOUT' : 'DATABASE_UNAVAILABLE');
    process.exitCode = 1;
  } finally { if (client) await client.end().catch(() => {}); }
})();

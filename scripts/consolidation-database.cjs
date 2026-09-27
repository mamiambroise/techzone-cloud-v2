const fs = require('fs');
const net = require('net');
const dotenv = require('../backend/node_modules/dotenv');
const { Client } = require('../backend/node_modules/pg');
const services = ['backend', ];
(async () => {
  const results = [];
  for (const service of services) {
    const env = dotenv.parse(fs.readFileSync(`${service}/.env`));
    const raw = process.env.DATABASE_URL || env.DATABASE_URL;
    const u = raw ? new URL(raw) : null;
    const info = { service, env: `${service}/.env`, source: process.env.DATABASE_URL ? 'process override' : '.env', DATABASE_URL: raw ? 'PRESENT' : 'MISSING', host: u?.hostname, port: u?.port || '5432', database: u?.pathname.slice(1), schema: u?.searchParams.get('schema') || 'public', prisma: `${service}/prisma/schema.prisma` };
    if (!u) { results.push(info); continue; }
    info.tcp = await new Promise(resolve => {
      const socket = net.connect({ host: u.hostname, port: Number(u.port || 5432) });
      socket.setTimeout(6000);
      socket.once('connect', () => { socket.destroy(); resolve('LISTENING'); });
      socket.once('timeout', () => { socket.destroy(); resolve('TIMEOUT'); });
      socket.once('error', error => resolve(error.code));
    });
    const client = new Client({ connectionString: raw, connectionTimeoutMillis: 8000, query_timeout: 8000 });
    try {
      await client.connect();
      info.sql = 'CONNECTED';
      info.version = (await client.query('select version()')).rows[0].version;
      const tables = (await client.query('select table_name from information_schema.tables where table_schema=$1', [info.schema])).rows.map(r => r.table_name);
      info.tableCount = tables.length;
      const schemaText = fs.readFileSync(info.prisma, 'utf8');
      const expected = [...schemaText.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map(m => /@@map\("([^"]+)"\)/.exec(m[2])?.[1] || m[1]);
      info.missingTables = expected.filter(name => !tables.includes(name));
      info.localMigrations = fs.existsSync(`${service}/prisma/migrations`) ? fs.readdirSync(`${service}/prisma/migrations`).filter(n => fs.statSync(`${service}/prisma/migrations/${n}`).isDirectory()) : [];
      if (tables.includes('_prisma_migrations')) info.appliedMigrations = (await client.query(`SELECT migration_name, finished_at, rolled_back_at FROM "${info.schema.replaceAll('"','""')}"."_prisma_migrations"`)).rows;
    } catch (error) {
      info.sql = 'FAILED';
      info.errorCode = error.code || (/timeout/i.test(error.message) ? 'TIMEOUT' : /password must be a string/.test(error.message) ? 'AUTHENTICATION_CONFIG_INVALID' : 'OTHER');
    } finally { await client.end().catch(() => {}); }
    results.push(info);
    console.log(JSON.stringify(info));
  }
  fs.writeFileSync('docs/consolidation/database-results.json', JSON.stringify(results, null, 2));
})();

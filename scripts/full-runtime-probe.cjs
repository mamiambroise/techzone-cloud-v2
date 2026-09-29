// Read-only database probe. Never print connection strings or database error messages.
const fs = require('node:fs');
const net = require('node:net');
const { Client } = require('../backend/node_modules/pg');
const dotenv = require('../backend/node_modules/dotenv');
const out = 'docs/full-runtime-review';
fs.mkdirSync(out, { recursive: true });
const env = fs.existsSync('backend/.env') ? dotenv.parse(fs.readFileSync('backend/.env')) : {};
const raw = process.env.DATABASE_URL || env.DATABASE_URL;
const results = { timestamp: new Date().toISOString(), configuration: {}, attempts: [] };
results.configuration = { database: !!raw, iam: Object.keys(env).filter(k => /JWT|IAM|SECRET/.test(k)).map(k => ({ key: k, present: !!env[k] })), erp: Object.keys(env).filter(k => /ERP|DOLIBARR/.test(k)).map(k => ({key:k,present:!!env[k]})) };
function classify(e) { return /timeout|timed out/i.test(e.message) ? 'NETWORK_TIMEOUT' : e.code === '28P01' ? 'AUTH_ERROR' : e.code === '3D000' ? 'DATABASE_NOT_FOUND' : e.code === '3F000' ? 'SCHEMA_ERROR' : 'OTHER'; }
(async () => {
 if (!raw) { results.error = 'CONFIG_ERROR'; } else {
  const u = new URL(raw);
  for (let i = 0; i < 3; i++) {
   const attempt = { number: i + 1 };
   attempt.tcp = await new Promise(resolve => { const s = net.connect({host:u.hostname,port:Number(u.port || 5432)}); s.setTimeout(5000); s.once('connect',()=>{s.destroy();resolve('PASS');}); s.once('timeout',()=>{s.destroy();resolve('NETWORK_TIMEOUT');}); s.once('error',e=>resolve(e.code)); });
   const c = new Client({connectionString:raw,connectionTimeoutMillis:7000,query_timeout:7000});
   try { await c.connect(); attempt.handshake='PASS'; attempt.sql=(await c.query('SELECT 1 AS ok')).rows[0].ok === 1 ? 'PASS':'FAIL'; attempt.schemas=(await c.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = ANY($1)",[['auth_aim','business_manager','erp_adapter']])).rows.map(x=>x.schema_name); }
   catch(e){attempt.sql=classify(e);attempt.code=e.code || null;} finally {await c.end().catch(()=>{});}
   results.attempts.push(attempt);
  }
 }
 fs.writeFileSync(`${out}/database.json`, JSON.stringify(results,null,2)); console.log(JSON.stringify(results));
})().catch(e=>{console.error(JSON.stringify({error:classify(e)}));process.exitCode=1;});

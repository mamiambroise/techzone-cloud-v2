// Read-only measurements against the configured remote database; no URL changes.
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const dotenv = require('../Auth_AIM/backend/node_modules/dotenv');
const { Client } = require('../backend/node_modules/pg');
const output = path.resolve(__dirname, '../docs/postgresql-stability');
fs.mkdirSync(output, { recursive: true });
const root = path.resolve(__dirname, '..');
const services = [
  ['IAM', 'Auth_AIM/backend', 'auth_aim'],
  ['PLATFORM', 'backend', 'business_manager'],
  ['ERP', 'new erp-adapter-platform/backend', 'erp_adapter'],
];
function configuration(dir) {
  const env = dotenv.parse(fs.readFileSync(path.join(root, dir, '.env')));
  const url = process.env.DATABASE_URL || env.DATABASE_URL;
  const parsed = new URL(url);
  if (parsed.hostname !== '167.86.71.186' || parsed.port !== '28417' || parsed.pathname !== '/techzonecloud') throw Error('Unexpected database target; refusing probe');
  return { url, host: parsed.hostname, port: Number(parsed.port) };
}
function category(error) {
  if (['28P01', '28000'].includes(error.code)) return 'AUTH_ERROR';
  if (['53300', '53400'].includes(error.code)) return 'CONNECTION_POOL';
  if (['3F000', '42P01', '42703'].includes(error.code)) return 'SCHEMA_ERROR';
  if (/timeout|timed out/i.test(error.message) || error.code === 'ETIMEDOUT') return 'NETWORK_TIMEOUT';
  if (['ECONNREFUSED','ECONNRESET','ENETUNREACH','EHOSTUNREACH'].includes(error.code)) return error.code;
  return error.code || 'APPLICATION_ERROR';
}
async function timed(work) {
  const start = performance.now();
  try { return { result: 'PASS', ms: Math.round(performance.now()-start), ...await work() }; }
  catch (error) { return { result: 'FAIL', ms: Math.round(performance.now()-start), category: category(error) }; }
}
function socketProbe(config, protocol) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const socket = net.connect({ host: config.host, port: config.port });
    const timer = setTimeout(() => finish(new Error('Probe timeout')), 6000);
    function finish(error, extra = {}) {
      clearTimeout(timer); socket.destroy();
      if (error) reject(error); else resolve({ ms: Math.round(performance.now()-start), ...extra });
    }
    socket.once('error', error => finish(error));
    socket.once('connect', () => {
      if (!protocol) return finish();
      const packet = Buffer.alloc(8); packet.writeInt32BE(8,0); packet.writeInt32BE(80877103,4);
      socket.write(packet); // PostgreSQL SSLRequest; no credentials.
    });
    socket.once('data', bytes => {
      const reply = bytes.toString('ascii',0,1);
      if (!['S','N'].includes(reply)) return finish(new Error('Unexpected PostgreSQL response'));
      finish(null, { protocol: 'PostgreSQL_SSLRequest', sslOffered: reply === 'S' });
    });
  });
}
async function sqlProbe(config, schema, repeat = 1) {
  const client = new Client({ connectionString: config.url, application_name: 'techzone-stability-probe', connectionTimeoutMillis: 8000, query_timeout: 6000 });
  const result = {};
  let stage = 'SQL_CONNECT';
  const start = performance.now();
  for (const event of ['authenticationSASL','authenticationMD5Password','authenticationCleartextPassword','authenticationOk']) {
    client.connection.once(event, () => { result.authenticationProtocolReached = true; });
  }
  client.on('error', () => {});
  try {
    await client.connect();
    result.SQL_CONNECT = { result: 'PASS', ms: Math.round(performance.now()-start) };
    stage = 'SELECT_1';
    result.SELECT_1 = [];
    for (let i=0; i<repeat; i++) {
      const t = performance.now(); await client.query('SELECT 1');
      result.SELECT_1.push({ result: 'PASS', ms: Math.round(performance.now()-t) });
      if (i+1<repeat) await new Promise(resolve => setTimeout(resolve,1000));
    }
    stage = 'SELECT_VERSION';
    const t = performance.now(); const version = await client.query('SELECT version()');
    result.SELECT_VERSION = { result: 'PASS', ms: Math.round(performance.now()-t), version: version.rows[0].version };
    stage = 'SCHEMA';
    const tables = await client.query('SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema=$1', [schema]);
    result.SCHEMA = { schema, tableCount: tables.rows[0].count, result: tables.rows[0].count ? 'PASS':'FAIL' };
    stage = 'POOL_OBSERVATION';
    const connections = await client.query("SELECT state, count(*)::int AS count FROM pg_stat_activity WHERE datname=current_database() GROUP BY state");
    const limits = await client.query("SELECT current_setting('max_connections') AS max_connections");
    result.POOL_OBSERVATION = { connections: connections.rows, ...limits.rows[0], visibility: 'subject to monitoring privileges; includes this probe' };
  } catch(error) { result[stage] = { result:'FAIL', category:category(error), ms:Math.round(performance.now()-start) }; }
  finally { await client.end().catch(()=>{}); }
  return result;
}
async function main() {
  const serviceMode = process.argv.includes('--services');
  const cyclesArg = process.argv.find(value => value.startsWith('--cycles='));
  const cycles = cyclesArg ? Number(cyclesArg.split('=')[1]) : 5;
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 100) throw Error('Invalid cycle count');
  const file = path.join(output, serviceMode ? 'service-database-probes.json' : 'network-attempts.json');
  if (fs.existsSync(file)) fs.copyFileSync(file, file.replace('.json', `.${Date.now()}.json`));
  const records = [];
  if (serviceMode) {
    for (const [name, dir, schema] of services) {
      const row={timestamp:new Date().toISOString(),service:name,...await sqlProbe(configuration(dir),schema,5)};
      records.push(row); fs.writeFileSync(file,JSON.stringify(records,null,2)); console.log(JSON.stringify(row));
    }
  } else {
    const config=configuration(services[0][1]);
    for(let attempt=1;attempt<=cycles;attempt++) {
      const row={attempt,timestamp:new Date().toISOString(),TCP_CONNECT:await timed(()=>socketProbe(config,false)),POSTGRES_HANDSHAKE:await timed(()=>socketProbe(config,true)),...await sqlProbe(config,'auth_aim',3)};
      records.push(row);fs.writeFileSync(file,JSON.stringify(records,null,2));console.log(JSON.stringify(row));
      if(attempt<cycles)await new Promise(resolve=>setTimeout(resolve,10000));
    }
  }
}
main().catch(error=>{console.error(JSON.stringify({category:category(error)}));process.exitCode=1;});

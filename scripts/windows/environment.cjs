const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const root = path.resolve(__dirname, '../..');
function environment(mode = process.env.APP_ENV || 'local') {
  if (!['local', 'remote'].includes(mode)) throw new Error('CONFIG_MISSING: APP_ENV');
  const files = mode === 'local' ? ['.env', '.env.local'] : ['.env.remote'];
  const values = {};
  for (const file of files) {
    const name = path.join(root, 'backend', file);
    if (fs.existsSync(name)) Object.assign(values, parseEnv(fs.readFileSync(name, 'utf8')));
  }
  // Explicit shell configuration wins over profile files.
  const env = { ...values, ...process.env, APP_ENV: mode, PORT: '3003' };
  for (const key of ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!env[key]) throw new Error('CONFIG_MISSING: ' + key);
  }
  try { new URL(env.DATABASE_URL); } catch { throw new Error('CONFIG_MISSING: DATABASE_URL'); }
  return env;
}
module.exports = { environment, root };

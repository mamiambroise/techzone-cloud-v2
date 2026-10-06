#!/usr/bin/env node
/** Project services: frontend (3000), backend (3003), Dolibarr (8080). */
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PID_FILE = path.join(root, 'logs', '.dev-pids.json');
const LOG_DIR = path.join(root, 'logs');
const APP_ENV = process.env.APP_ENV || 'local';

if (!['local', 'remote'].includes(APP_ENV)) {
  throw new Error(`CONFIG_MISSING: APP_ENV must be "local" or "remote" (received ${APP_ENV})`);
}

/** Keep the cross-platform launcher aligned with scripts/windows/environment.cjs. */
const backendEnvFiles = APP_ENV === 'remote' ? ['.env.remote'] : ['.env', '.env.local'];
const backendEnvArgs = backendEnvFiles.flatMap((file) => [`--env-file-if-exists=${file}`]);

const NODE = process.execPath;
function npmCli() {
  return [
    process.env.npm_execpath,
    path.resolve(path.dirname(NODE), 'node_modules/npm/bin/npm-cli.js'),
    path.resolve(path.dirname(NODE), '..', 'lib/node_modules/npm/bin/npm-cli.js'),
  ].find((file) => file && fs.existsSync(file)) || null;
}
let PHP_BIN = null;
function phpBin() {
  if (PHP_BIN) return PHP_BIN;
  for (const cand of ['php', '/usr/local/bin/php', '/opt/homebrew/bin/php', '/usr/bin/php']) {
    try {
      const r = spawnSync(cand, ['-v'], { stdio: 'ignore' });
      if (r.status === 0) {
        PHP_BIN = cand;
        return cand;
      }
    } catch {}
  }
  return null;
}

const COLORS = {
  AUTH: '\x1b[38;5;51m',
  ERP: '\x1b[38;5;141m',
  CONSOLE: '\x1b[38;5;120m',
  BUSINESS: '\x1b[38;5;215m',
  JASMINE: '\x1b[38;5;202m',
  DOLIB: '\x1b[38;5;214m',
  INFO: '\x1b[38;5;245m',
  DONE: '\x1b[38;5;40m',
  WARN: '\x1b[38;5;214m',
  ERR: '\x1b[38;5;196m',
  RESET: '\x1b[0m',
};
const c = (color, m) => `${COLORS[color]}${m}${COLORS.RESET}`;

const SERVICES = [
  {
    name: 'FRONTEND', tag: 'BUSINESS', port: 3000,
    cwd: path.join(root, 'frontend'),
    cmd: () => ({ cmd: NODE, args: [path.join(root, 'frontend/node_modules/vite/bin/vite.js'), '--mode', APP_ENV, '--port', '3000', '--host', '0.0.0.0', '--strictPort'] }),
    url: 'http://localhost:3000',
  },
  {
    name: 'BACKEND',
    tag: 'JASMINE',
    port: 3003,
    cwd: path.join(root, 'backend'),
    cmd: () => ({ cmd: NODE, args: [...backendEnvArgs, path.join(root, 'backend/dist/main.js')] }),
    build: (npm) => ({ cmd: NODE, args: [npm, 'run', 'build'] }),
    dist: ['dist/main.js'],
    url: 'http://localhost:3003',
  },
  {
    name: 'DOLIBARR',
    tag: 'DOLIB',
    port: 8080,
    cwd: root,
    cmd: () => ({
      cmd: phpBin(),
      args: [
        '-d', 'display_errors=1',
        '-d', 'error_reporting=E_ALL',
        '-S', '127.0.0.1:8080',
        '-t', path.join(root, 'techzone', 'htdocs'),
      ],
    }),
    url: 'http://127.0.0.1:8080',
  },
];

const isWin = process.platform === 'win32';

function killTree(pid, signal = 'SIGTERM') {
  if (!Number.isInteger(pid) || pid <= 0) return;
  if (isWin) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    try { process.kill(-pid, signal); } catch {}
  }
}

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ host: '127.0.0.1', port });
    s.setTimeout(600);
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => resolve(false));
  });
}

function httpOk(port, pathname = '/') {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathname, timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
  });
}

function loadPids() {
  try { return JSON.parse(fs.readFileSync(PID_FILE, 'utf8')); } catch { return {}; }
}
function savePids(pids) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
}

function windowsLifecycle(args) {
  const result = spawnSync('powershell.exe', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    path.join(root, 'scripts/windows/stop-project.ps1'),
    '-CallerPid', String(process.pid), ...args,
  ], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', windowsHide: true });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    throw new Error('LIFECYCLE_FAILED: ' + (result.error?.message || result.signal || result.status));
  }
}

async function stopAll() {
  if (isWin) {
    windowsLifecycle([]);
    return;
  }
  const targets = [...new Set(Object.values(loadPids()))];
  for (const pid of targets) killTree(pid);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  for (const pid of targets) killTree(pid, 'SIGKILL');
  const busy = [];
  for (const service of SERVICES) if (await portOpen(service.port)) busy.push(service.port);
  if (busy.length) throw new Error('STOP_FAILED: ports encore occupes : ' + busy.join(', '));
  fs.rmSync(PID_FILE, { force: true });
  console.log('Projet arrete. Ports 3000, 3003 et 8080 libres.');
}

async function status() {
  for (const s of SERVICES) {
    const up = await portOpen(s.port);
    console.log(`  ${up ? c('DONE', '[UP]  ') : c('ERR', '[DOWN]')} ${s.name.padEnd(12)} :${String(s.port).padEnd(5)} ${s.url}`);
  }
}

async function run(rebuilt) {
  const npm = npmCli();
  if (!npm) {
    console.log(c('ERR', "Tsy hita ny npm-cli. Mampiasà node/d.nvm ary andramo indray."));
    process.exit(1);
  }
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const children = [];
  if (isWin) {
    windowsLifecycle(['-RegisterLauncher']);
  }
  const pids = loadPids();
  let stopping = false;
  const retries = new Set();
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    for (const timer of retries) clearTimeout(timer);
    console.log('Arret du projet...');
    try { await stopAll(); process.exit(0); }
    catch (error) { console.error(error.message); process.exit(1); }
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  const savePidsNow = () => {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  };

  const launch = (s, attempt = 1) => {
    if (stopping) return;
    const { cmd, args } = s.cmd(npm);
    const child = spawn(cmd, args, {
      cwd: s.cwd,
      detached: true,
      windowsHide: true,
      env: { ...process.env, APP_ENV, BROWSER: 'none' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    pids[s.name] = child.pid;
    savePidsNow();
    if (!children.includes(child)) children.push(child);
    console.log(c(s.tag, `[${s.name}] voadinika (pid ${child.pid}, essai ${attempt}) → ${s.url}`));

    const tail = (buf) => {
      for (const ln of buf.toString().split(/\r?\n/)) {
        if (ln) console.log(`${c(s.tag, `[${s.name}]`)} ${ln}`);
      }
    };
    child.stdout.on('data', tail);
    child.stderr.on('data', (buf) => {
      for (const ln of buf.toString().split(/\r?\n/)) {
        if (ln) console.log(`${c('ERR', `[${s.name}]`)} ${ln}`);
      }
    });

    const graceUntil = Date.now() + 15000;
    child.once('error', (error) => console.error('[' + s.name + '] ' + error.message));
    child.once('exit', (code) => {
      if (stopping) return;
      if (Date.now() < graceUntil && code !== 0 && attempt < 3 && s.name !== 'ERP-CONSOLE') {
        console.log(c('WARN', `[${s.name}] noraiketana (exit ${code}) → averiana indray aorian'ny 3s …`));
        const timer = setTimeout(() => { retries.delete(timer); launch(s, attempt + 1); }, 3000);
        retries.add(timer);
      } else {
        console.log(c('ERR', `[${s.name}] nijanona (exit ${code}).`));
      }
    });

    return child;
  };

  for (const s of SERVICES) {
    const busy = await portOpen(s.port);
    if (busy) {
      console.log(c('WARN', `[${s.name}] efa mandeha (${s.port}) → sady skip.`));
      continue;
    }
    if (s.name === 'DOLIBARR' && !phpBin()) {
      console.log(c('ERR', '[DOLIBARR] PHP tsy hita amin\'ny PATH → tsy afaka milance. Asio php na start azy misaraka.'));
      continue;
    }
    // build raha ilaina
    if (s.build) {
      const rebuildNeeded = rebuilt || (s.dist || []).some((d) => !fs.existsSync(path.join(s.cwd, d)));
      if (rebuildNeeded) {
        console.log(c('INFO', `[${s.name}] ${rebuilt ? 'rebuild' : 'build'} …`));
        const build = s.build(npm);
        const r = spawnSync(build.cmd, build.args, { cwd: s.cwd, stdio: 'inherit', windowsHide: true });
        if (r.status !== 0) {
          console.log(c('ERR', `[${s.name}] build nanao error ${r.status} → skip.`));
          continue;
        }
      }
    }

    launch(s);
  }

  if (children.length === 0) {
    console.log(c('WARN', 'Tsy nisy na iray azo voadinika (efa mandeha daholo).'));
    await status();
    return;
  }
  savePids(pids);

  // Fandraisan-kenatra: miandry mandra-pahavitan'ny ports rehetra
  const waiting = SERVICES.filter((s) => pids[s.name]);
  const started = new Set();
  const deadline = Date.now() + 90000;
  while (started.size < waiting.length && Date.now() < deadline) {
    for (const s of waiting) {
      if (started.has(s.name)) continue;
      const up = s.name === 'DOLIBARR' ? await httpOk(s.port, '/index.php') : await portOpen(s.port);
      if (up) {
        started.add(s.name);
        console.log(c('DONE', `[${s.name}] vonona ✅ → ${s.url}`));
      }
    }
    if (started.size < waiting.length) await new Promise((r) => setTimeout(r, 1500));
  }

  console.log('');
  console.log(c('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c(started.size === waiting.length ? 'DONE' : 'WARN',
    `Techzone Cloud : ${started.size}/${waiting.length} services lancés répondent. Vérifiez les erreurs de base de données dans les logs.`));
  console.log(c('DONE', "Mpoditra ao amin'ny navigateur:"));
  // http://localhost:3000
  console.log(c('BUSINESS', '  ▶ Console canonique → http://localhost:3000'));
  console.log(c('ERP', '  ▶ ERP / Platform API → http://localhost:3003/api'));
  console.log(c('DOLIB', '  ▶ Dolibarr (techzone) → http://127.0.0.1:8080'));
  console.log(c('INFO', '────────────────────────────────────────────────'));
  console.log(c('INFO', '(Ctrl+C hampijanona daholo · npm run stop mamono koa)'));
  console.log(c('INFO', `Profil d'environnement : ${APP_ENV} (${backendEnvFiles.join(' + ')})`));
}

const flags = new Set(process.argv.slice(2));
try {
  if (flags.has('--stop')) {
    await stopAll();
  } else if (flags.has('--status')) {
    await status();
  } else {
    if (flags.has('--restart') || flags.has('--rebuild')) await stopAll();
    await run(flags.has('--rebuild'));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

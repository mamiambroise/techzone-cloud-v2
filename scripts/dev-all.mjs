#!/usr/bin/env node
/**
 * Techzone Cloud — launcher unique.
 *
 * Mamerina amin'ny baiko tokana ny 5 services rehetra:
 *   AUTH_AIM (5001), ERP-API (3002), FRONTEND (3000),
 *   PLATFORM API (3003), DOLIBARR (8080).
 *
 *   npm run dev          → lance tout
 *   npm run dev:rebuild  → build ERP API + Jasmina aloha, dia lance
 *   npm run stop         → mamono ny service rehetra avy ato
 *   npm run status       → fampisehoana ny état
 */
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
    name: 'AUTH_AIM',
    tag: 'AUTH',
    port: 5001,
    cwd: path.join(root, 'Auth_AIM/backend'),
    cmd: () => ({ cmd: NODE, args: ['src/server.js'] }),
    url: 'http://localhost:5001',
  },
  {
    name: 'ERP-API',
    tag: 'ERP',
    port: 3002,
    cwd: path.join(root, 'new erp-adapter-platform/backend'),
    cmd: () => ({ cmd: NODE, args: ['--env-file=.env', 'dist/src/main.js'] }),
    build: (npm) => ({ cmd: NODE, args: [npm, 'run', 'build'] }),
    dist: ['dist/src/main.js'],
    url: 'http://localhost:3002/api/erp/health?erp=DOLIBARR',
  },
  {
    name: 'FRONTEND', tag: 'BUSINESS', port: 3000,
    cwd: path.join(root, 'frontend'),
    cmd: (npm) => ({ cmd: NODE, args: [npm, 'run', 'dev'] }),
    url: 'http://localhost:3000',
  },
  {
    name: 'JASMINA',
    tag: 'JASMINE',
    port: 3003,
    cwd: path.join(root, 'backend'),
    cmd: () => ({ cmd: NODE, args: ['--env-file=.env', 'dist/main.js'] }),
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

function stopAll() {
  const pids = loadPids();
  const targets = [...new Set(Object.values(pids))];
  if (targets.length === 0) {
    console.log(c('INFO', 'Tsy misy service ataoko (PNY .dev-pids.json).'));
    return;
  }
  console.log(c('INFO', `Mamono service ${targets.length}:\t${Object.keys(pids).join(', ')}`));
  for (const pid of targets) {
    killTree(pid);
  }
  // fanampiny: miadana tany
  setTimeout(() => {
    for (const pid of targets) {
      if (!isWin) killTree(pid, 'SIGKILL');
    }
    fs.rmSync(PID_FILE, { force: true });
  }, 3500);
}

async function status() {
  for (const s of SERVICES) {
    const up = s.name === 'DOLIBARR' ? await httpOk(s.port, '/index.php') : await portOpen(s.port);
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
  const pids = loadPids();

  const savePidsNow = () => {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  };

  const launch = (s, attempt = 1) => {
    const { cmd, args } = s.cmd(npm);
    const child = spawn(cmd, args, {
      cwd: s.cwd,
      detached: true,
      windowsHide: true,
      env: { ...process.env, BROWSER: 'none' },
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
    child.once('exit', (code) => {
      if (Date.now() < graceUntil && code !== 0 && attempt < 3 && s.name !== 'ERP-CONSOLE') {
        console.log(c('WARN', `[${s.name}] noraiketana (exit ${code}) → averiana indray aorian'ny 3s …`));
        setTimeout(() => launch(s, attempt + 1), 3000);
      } else {
        console.log(c('ERR', `[${s.name}] nijanona (exit ${code}).`));
      }
    });

    return child;
  };

  for (const s of SERVICES) {
    const busy = s.name === 'DOLIBARR' ? await httpOk(8080, '/index.php') : await portOpen(s.port);
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

  const stop = () => {
    console.log(c('INFO', "\nMijanon'ny dev (Ctrl+C) …"));
    for (const p of Object.values(pids)) {
      killTree(p);
    }
    setTimeout(() => {
      for (const p of Object.values(pids)) {
        if (!isWin) killTree(p, 'SIGKILL');
      }
      fs.rmSync(PID_FILE, { force: true });
      process.exit(0);
    }, 3000);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

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
  console.log(c('ERP', '  ▶ ERP API → http://localhost:3002/api'));
  console.log(c('AUTH', '  ▶ Auth_AIM → http://localhost:5001/api'));
  console.log(c('DOLIB', '  ▶ Dolibarr (techzone) → http://127.0.0.1:8080'));
  console.log(c('INFO', '────────────────────────────────────────────────'));
  console.log(c('INFO', '(Ctrl+C hampijanona daholo · npm run stop mamono koa)'));
}

const flag = process.argv[2];
if (flag === '--stop') {
  stopAll();
} else if (flag === '--status') {
  await status();
} else {
  await run(flag === '--rebuild');
}

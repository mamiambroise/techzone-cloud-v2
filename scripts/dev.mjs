#!/usr/bin/env node
/**
 * Techzone Cloud — launcher unique et multiplateforme (Windows / macOS / Linux).
 *
 * Lance ensemble : Dolibarr (PHP) + ERP API + Business Manager API + les 2 frontends.
 * Pré-requis : Node.js, MySQL local (Dolibarr), PHP (sur le PATH).
 *
 *   npm run all
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const SERVICES = [
  {
    name: 'DOLIBARR',
    color: '\x1b[38;5;214m',
    port: 8080,
    create: () =>
      spawn('php', ['-d', 'display_errors=1', '-d', 'error_reporting=E_ALL', '-S', '127.0.0.1:8080', '-t', path.join(root, 'techzone/htdocs')], {
        cwd: root,
        stdio: 'pipe',
        shell: isWin,
      }),
  },
  {
    name: 'ERP-API',
    color: '\x1b[38;5;39m',
    port: 3002,
    create: () =>
      spawn(nodeBin(), ['--enable-source-maps', 'dist/src/main'], {
        cwd: path.join(root, 'new erp-adapter-platform/backend'),
        env: { ...process.env, PORT: '3002' },
        stdio: 'pipe',
        shell: false,
      }),
  },
  {
    name: 'BM-API',
    color: '\x1b[38;5;201m',
    port: 3000,
    create: () =>
      spawn(nodeBin(), ['dist/main.js'], {
        cwd: path.join(root, 'team4-platform-api/backend'),
        env: { ...process.env, PORT: '3000' },
        stdio: 'pipe',
        shell: false,
      }),
  },
  {
    name: 'ERP-WEB',
    color: '\x1b[38;5;114m',
    port: 3003,
    create: () =>
      spawn(npmCmd, ['run', 'dev'], {
        cwd: path.join(root, 'new erp-adapter-platform/frontend'),
        env: { ...process.env, PORT: '3003', CI: 'false' },
        stdio: 'pipe',
        shell: isWin,
      }),
  },
  {
    name: 'BM-WEB',
    color: '\x1b[38;5;227m',
    port: 3007,
    create: () =>
      spawn(npmCmd, ['run', 'dev'], {
        cwd: path.join(root, 'team4-platform-api/frontend'),
        env: { ...process.env, PORT: '3007' },
        stdio: 'pipe',
        shell: isWin,
      }),
  },
];

function nodeBin() {
  return isWin ? 'node.exe' : 'node';
}

const children = [];
let shutting = false;

function stopAll(code) {
  if (shutting) return;
  shutting = true;
  for (const c of children) {
    try {
      c.kill();
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(code ?? 0), 300);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

function pipe(proc, name, color) {
  const prefix = (stream, text) => {
    const lines = String(text).replace(/\n$/, '').split('\n');
    for (const l of lines) {
      console.log(`${color}[${name}] \x1b[0m${l}`);
    }
  };
  proc.stdout?.on('data', (d) => prefix('out', d));
  proc.stderr?.on('data', (d) => prefix('err', d));
  proc.on('exit', (code) => {
    if (!shutting) {
      console.log(`${color}[${name}] \x1b[31mexited (code ${code})\x1b[0m`);
    }
  });
}

async function waitReady(service, msTimeout = 90000) {
  const start = Date.now();
  while (Date.now() - start < msTimeout) {
    try {
      const res = await fetch(`http://localhost:${service.port}/`);
      if (res.status < 500) return true;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('\x1b[1;34m=== Techzone Cloud — démarrage de toutes les plateformes ===\x1b[0m\n');
  const order = [0, 1, 2, 4, 3]; // DOLI -> ERP-API -> BM-API -> BM-WEB -> ERP-WEB
  for (const idx of order) {
    const svc = SERVICES[idx];
    const proc = svc.create();
    children.push(proc);
    pipe(proc, svc.name, svc.color);
    console.log(`${svc.color}[${svc.name}] \x1b[0mstarting on ${svc.port}...`);
    const ok = await waitReady(svc);
    console.log(
      ok
        ? `${svc.color}[${svc.name}] \x1b[32mOK http://localhost:${svc.port} \x1b[0m`
        : `${svc.color}[${svc.name}] \x1b[33mtimeout — check logs above\x1b[0m`,
    );
  }

  console.log('\n\x1b[1;32m=== Tout est en cours d\'exécution ===\x1b[0m');
  console.log('  Dolibarr        http://localhost:8080');
  console.log('  ERP API/Swagger http://localhost:3002/api/docs');
  console.log('  BM API/Swagger  http://localhost:3000/swagger');
  console.log('  ERP Web         http://localhost:3003');
  console.log('  Business Manager http://localhost:3007');
  console.log('  Appuyez sur Ctrl+C pour tout arrêter.\n');
}

main().catch((e) => {
  console.error(e);
  stopAll(1);
});
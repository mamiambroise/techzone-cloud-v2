import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const scripts = path.dirname(fileURLToPath(import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const listening = (port) => new Promise((resolve) => {
  const socket = net.connect({ port, host: '127.0.0.1' });
  socket.on('connect', () => { socket.destroy(); resolve(true); });
  socket.on('error', () => resolve(false));
});
async function waitFor(check) {
  for (let i = 0; i < 100; i++) {
    if (await check()) return;
    await delay(100);
  }
  throw new Error('Timed out waiting for fixture');
}

test('Windows stop: orphan recovery, supervisor shutdown, repeat stop and foreign port protection', {
  skip: process.platform !== 'win32', timeout: 60000,
}, async (t) => {
  for (const port of [3000, 3003, 8080]) {
    if (await listening(port)) return t.skip(`Stop the project before testing (port ${port} is busy)`);
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'techzone lifecycle '));
  const write = (relative, source) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
    return file;
  };
  const helper = write('scripts/windows/stop-project.ps1', fs.readFileSync(path.join(scripts, 'stop-project.ps1')));
  const stop = () => spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', helper], {
    encoding: 'utf8', windowsHide: true, timeout: 25000,
  });
  const children = [];
  const start = (args) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: 'ignore', windowsHide: true });
    children.push(child);
    return child;
  };
  try {
    const worker = write('worker.cjs', "require('net').createServer().listen(3000, '127.0.0.1');");
    const backend = write('backend/dist/main.js', `
      require('child_process').spawn(process.execPath, [${JSON.stringify(worker)}], {stdio:'ignore'});
      require('net').createServer().listen(3003, '127.0.0.1');
    `);
    write('scripts/dev-all.mjs', `
      import { spawn } from 'node:child_process';
      function launch() {
        const child = spawn(process.execPath, [${JSON.stringify(backend)}], {stdio:'ignore'});
        child.on('exit', () => setTimeout(launch, 100));
      }
      launch();
    `);
    const supervisor = start(['scripts/dev-all.mjs']);
    await waitFor(async () => await listening(3000) && await listening(3003));
    // No PID files: identify the backend by path and its relative-path supervisor.
    let result = stop();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    await waitFor(() => supervisor.exitCode !== null || supervisor.signalCode !== null);
    await delay(500);
    assert.equal(await listening(3000), false);
    assert.equal(await listening(3003), false);
    assert.equal(stop().status, 0, 'Stopping twice must succeed');

    // A recycled/stale PID must not grant ownership of an unrelated IPv6 listener.
    const outsider = start(['-e', "require('net').createServer().listen(3000, '::');"]);
    await waitFor(() => listening(3000));
    write('logs/.dev-pids.json', JSON.stringify({ FRONTEND: outsider.pid }));
    write('.runtime/frontend.pid', JSON.stringify({ pid: outsider.pid, created: 'stale', executable: process.execPath, commandLine: 'stale' }));
    // Use the real restart entrypoint: a failed stop must prevent any new launch.
    const launcher = write('scripts/dev-all.mjs', fs.readFileSync(path.join(scripts, '../dev-all.mjs')));
    result = spawnSync(process.execPath, [launcher, '--restart'], {
      cwd: root, encoding: 'utf8', windowsHide: true, timeout: 25000,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /STOP_FAILED/);
    assert.equal(await listening(3000), true, 'Foreign listener must survive');
    assert.equal(fs.existsSync(path.join(root, '.runtime/frontend.pid')), true, 'Failed stop retains evidence');
    assert.equal(fs.existsSync(path.join(root, '.runtime/dev-launcher.pid')), false, 'Restart must not launch after failed stop');
  } finally {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      }
    }
    // Only remove our explicitly created temporary fixture, never the workspace.
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    stop(); // Recover detached fixture children even if an assertion failed.
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

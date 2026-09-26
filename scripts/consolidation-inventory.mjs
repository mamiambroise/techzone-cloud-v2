import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
const root = process.cwd();
const out = path.join(root, 'docs/consolidation');
fs.mkdirSync(out, { recursive: true });
const ignored = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'logs', '.kilo']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => ignored.has(e.name) ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const all = walk(root).map(f => path.relative(root, f).replaceAll('\\', '/'));
fs.writeFileSync(path.join(out, 'repository-files.json'), JSON.stringify(all, null, 2));
const pairs = [['frontend', 'team4-platform-api/frontend'], ['backend', 'team4-platform-api/backend'], ['frontend', 'Auth_AIM/frontend'], ['frontend', 'new erp-adapter-platform/frontend']];
const comparisons = pairs.map(([canonical, other]) => {
  const files = all.filter(f => f.startsWith(other + '/') && !f.includes('/generated/'));
  const result = { canonical, other, identical: [], different: [], unique: [] };
  for (const f of files) {
    const relative = f.slice(other.length + 1);
    const target = `${canonical}/${relative}`;
    if (!fs.existsSync(target)) result.unique.push(relative);
    else {
      const hash = name => crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');
      result[hash(f) === hash(target) ? 'identical' : 'different'].push(relative);
    }
  }
  return result;
});
fs.writeFileSync(path.join(out, 'duplicate-comparison.json'), JSON.stringify(comparisons, null, 2));
const packages = ['frontend', 'backend', 'Auth_AIM/backend', 'Auth_AIM/frontend', 'new erp-adapter-platform/backend', 'new erp-adapter-platform/frontend', 'team4-platform-api/backend', 'team4-platform-api/frontend'];
const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
if (!process.argv.includes('--reports-only')) await Promise.all(packages.map(p => new Promise(resolve => {
  const child = spawn(process.execPath, [npm, 'audit', '--json'], { cwd: p, windowsHide: true });
  let output = ''; let errors = '';
  child.stdout.on('data', b => output += b);
  child.stderr.on('data', b => errors += b);
  child.on('close', code => {
    const name = p.replaceAll(/[ /]/g, '-');
    fs.writeFileSync(path.join(out, `audit-${name}.json`), output || JSON.stringify({ code, error: errors }));
    let parsed; try { parsed = JSON.parse(output); } catch {}
    console.log(p, code, JSON.stringify(parsed?.metadata?.vulnerabilities || parsed?.error || errors));
    resolve();
  });
})));
console.log(comparisons.map(({canonical,other,identical,different,unique}) => ({canonical,other,identical:identical.length,different:different.length,unique:unique.length})));
let auditReport = '# npm audit — inventaire détaillé\n\nAucune correction majeure forcée. Les résultats détaillés et advisories sont dans les JSON voisins.\n\n| Projet | Package | Sévérité | Type | Correction npm | Risque |\n|---|---|---|---|---|---|\n';
for (const file of fs.readdirSync(out).filter(f => f.startsWith('audit-') && f.endsWith('.json'))) {
  const audit = JSON.parse(fs.readFileSync(path.join(out, file), 'utf8'));
  for (const [name, finding] of Object.entries(audit.vulnerabilities || {})) {
    auditReport += `| ${file.slice(6,-5)} | ${name} | ${finding.severity} | ${finding.isDirect ? 'DIRECT' : 'TRANSITIVE'} | ${JSON.stringify(finding.fixAvailable)} | ${finding.fixAvailable?.isSemVerMajor ? 'BREAKING' : finding.fixAvailable ? 'À tester' : 'Pas de correctif annoncé'} |\n`;
  }
}
fs.writeFileSync(path.join(out, 'NPM_AUDIT.md'), auditReport);

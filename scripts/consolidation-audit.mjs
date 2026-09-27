import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd();
const out = 'docs/code-consolidation';
fs.mkdirSync(out, { recursive: true });
const skip = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'logs', '.kilo', '.run']);
export function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => skip.has(e.name) || e.isSymbolicLink() ? [] : e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name).replaceAll('\\','/')]);
}
const files = walk('.');
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const inventory = files.map(file => ({file, bytes:fs.statSync(file).size, sha256:hash(file)}));
fs.writeFileSync(`${out}/inventory-before.json`,JSON.stringify(inventory,null,2));
const groups = new Map();
for(const f of inventory.filter(f=>/\.(jsx?|tsx?|css)$/.test(f.file)&&!f.file.startsWith('techzone/'))){
  const normalized=fs.readFileSync(f.file,'utf8').replace(/\r/g,'').trim();
  const key=crypto.createHash('sha256').update(normalized).digest('hex');
  groups.set(key,[...(groups.get(key)||[]),f.file]);
}
fs.writeFileSync(`${out}/identical-code.json`,JSON.stringify([...groups.values()].filter(g=>g.length>1),null,2));
const apps=['frontend','backend','techzone'];
fs.writeFileSync(`${out}/applications.json`,JSON.stringify(apps.map(p=>({path:p,package:JSON.parse(fs.readFileSync(`${p}/package.json`,'utf8')),files:files.filter(f=>f.startsWith(p+'/')).length})),null,2));
console.log(`Inventoried ${inventory.length} files; ${[...groups.values()].filter(g=>g.length>1).length} identical code groups.`);

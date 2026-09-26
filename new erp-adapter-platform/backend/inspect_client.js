const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const keys = Object.keys(p).filter((k) => k[0] !== '$' && k[0] !== '_');
console.log('models:', keys.slice(0, 40));
const sample = p.eRPRegistry.findUnique.toString();
console.log('findUnique sample:', sample.slice(0, 500));
p.$disconnect().then(() => console.log('done')).catch(() => console.log('disc err'));
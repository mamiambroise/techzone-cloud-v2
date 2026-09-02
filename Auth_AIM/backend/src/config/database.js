const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
  } catch (err) {
    console.error('❌ Échec de connexion à la base de données:', err.message);
    process.exit(1);
  }
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma, connectDatabase };
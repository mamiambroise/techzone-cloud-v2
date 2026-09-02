const { prisma, connectDatabase } = require('../config/database');

async function main() {
  await connectDatabase();
  await prisma.$disconnect();
  console.log('✅ Connexion fermée proprement — la base est bien accessible.');
}

main().catch(async (err) => {
  console.error('❌ Erreur pendant le test:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
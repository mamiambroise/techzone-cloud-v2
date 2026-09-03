const app = require('./app');
const config = require('./config/env');
const { connectDatabase, prisma } = require('./config/database');

async function start() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`✅ Auth+IAM+Context API démarrée sur le port ${config.port} (${config.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} reçu, arrêt en cours...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('❌ Échec du démarrage du serveur:', err);
  process.exit(1);
});
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.$queryRaw`SELECT 1 as result`
  .then((r) => {
    console.log('DB OK:', JSON.stringify(r));
    process.exit(0);
  })
  .catch((e) => {
    console.log('DB ERROR:', e.message);
    process.exit(1);
  });

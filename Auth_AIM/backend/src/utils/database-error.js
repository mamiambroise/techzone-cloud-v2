// Public errors must not contain Prisma query arguments, connection URLs or stacks.
function databaseError(error) {
  const code = error?.code || error?.errorCode;
  // Prisma may omit errorCode on queries following a failed initial connect.
  if (error?.name === 'PrismaClientInitializationError' && !code) {
    const unreachable = /can't reach database server|timed out|timeout|connection.*closed/i.test(error.message || '');
    return unreachable
      ? { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Base de données temporairement inaccessible. Réessayez dans quelques instants.' }
      : { statusCode: 503, code: 'DATABASE_CONFIGURATION_ERROR', message: 'La configuration du service nécessite une intervention.' };
  }
  if (['P1001', 'P1002', 'P1008', 'P1017', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(code)) {
    return { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Base de données temporairement inaccessible. Réessayez dans quelques instants.' };
  }
  if (code === 'P2024') {
    return { statusCode: 503, code: 'DATABASE_POOL_TIMEOUT', message: 'Service temporairement saturé. Réessayez dans quelques instants.' };
  }
  if (['P1000', 'P1003', 'P1010', 'P2021', 'P2022'].includes(code)) {
    return { statusCode: 503, code: 'DATABASE_CONFIGURATION_ERROR', message: 'La configuration du service nécessite une intervention.' };
  }
  return null;
}

module.exports = { databaseError };

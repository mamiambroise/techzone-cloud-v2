const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { hashPassword, verifyPassword } = require('../utils/password');

const PASSWORD_POLICY = {
  minLength: 10,
  maxLength: 128,
  historyCount: 5,
};

function validatePasswordStrength(password) {
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    throw new AppError(
      `Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`,
      422,
      'PASSWORD_TOO_SHORT'
    );
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    throw new AppError('Mot de passe trop long', 422, 'PASSWORD_TOO_LONG');
  }
}

async function createPasswordCredential({ userId, password, client = prisma }) {
  validatePasswordStrength(password);
  const secretHash = await hashPassword(password);

  const credential = await client.credential.create({
    data: {
      userId,
      type: 'PASSWORD',
      status: 'ACTIVE',
      secretHash,
      lastUsedAt: null,
    },
  });

  await client.passwordHistory.create({
    data: { userId, passwordHash: secretHash },
  });

  return credential;
}

async function getActivePasswordCredential(userId) {
  return prisma.credential.findFirst({
    where: { userId, type: 'PASSWORD', status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}

async function verifyPasswordCredential(userId, plainPassword) {
  const credential = await getActivePasswordCredential(userId);
  if (!credential) return false;

  const isValid = await verifyPassword(plainPassword, credential.secretHash);
  if (isValid) {
    await prisma.credential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });
  }
  return isValid;
}

async function assertPasswordNotReused(userId, plainPassword) {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: PASSWORD_POLICY.historyCount,
  });

  for (const entry of history) {
    const matches = await verifyPassword(plainPassword, entry.passwordHash);
    if (matches) {
      throw new AppError(
        `Ce mot de passe a déjà été utilisé récemment (les ${PASSWORD_POLICY.historyCount} derniers sont interdits)`,
        422,
        'PASSWORD_REUSED'
      );
    }
  }
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const isCurrentValid = await verifyPasswordCredential(userId, currentPassword);
  if (!isCurrentValid) {
    throw new AppError('Mot de passe actuel incorrect', 401, 'INVALID_CURRENT_PASSWORD');
  }

  validatePasswordStrength(newPassword);
  await assertPasswordNotReused(userId, newPassword);

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.credential.updateMany({
      where: { userId, type: 'PASSWORD', status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'PASSWORD_CHANGED' },
    });
    const credential = await tx.credential.create({
      data: { userId, type: 'PASSWORD', status: 'ACTIVE', secretHash: newHash },
    });
    await tx.passwordHistory.create({
      data: { userId, passwordHash: newHash },
    });
    return credential;
  });
}

async function resetPassword({ userId, newPassword }) {
  validatePasswordStrength(newPassword);
  await assertPasswordNotReused(userId, newPassword);

  const newHash = await hashPassword(newPassword);

  return prisma.$transaction(async (tx) => {
    await tx.credential.updateMany({
      where: { userId, type: 'PASSWORD', status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'PASSWORD_RESET' },
    });
    const credential = await tx.credential.create({
      data: { userId, type: 'PASSWORD', status: 'ACTIVE', secretHash: newHash },
    });
    await tx.passwordHistory.create({ data: { userId, passwordHash: newHash } });
    return credential;
  });
}

module.exports = {
  PASSWORD_POLICY,
  validatePasswordStrength,
  createPasswordCredential,
  getActivePasswordCredential,
  verifyPasswordCredential,
  assertPasswordNotReused,
  changePassword,
  resetPassword,
};
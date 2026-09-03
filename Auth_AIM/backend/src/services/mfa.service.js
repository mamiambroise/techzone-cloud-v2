const { authenticator } = require('otplib');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { hashToken, generateRecoveryCode } = require('../utils/password');

const RECOVERY_CODES_COUNT = 10;

function generateTotpSecret() {
  return authenticator.generateSecret();
}

async function enrollMfaMethod({ userId, type, label }) {
  const secretRef = type === 'TOTP' ? generateTotpSecret() : null;

  const method = await prisma.mfaMethod.create({
    data: {
      userId,
      type,
      label,
      secretRef,
      enabled: false,
      verified: false,
    },
  });

  return { method, secretRef };
}

async function verifyMfaEnrollment({ methodId, code }) {
  const method = await prisma.mfaMethod.findUnique({ where: { id: methodId } });
  if (!method) {
    throw new AppError('Méthode MFA introuvable', 404, 'MFA_METHOD_NOT_FOUND');
  }
  if (method.type !== 'TOTP') {
    throw new AppError('Type MFA non supporté pour cette vérification', 400, 'MFA_TYPE_UNSUPPORTED');
  }

  const isValid = authenticator.verify({ token: code, secret: method.secretRef });
  if (!isValid) {
    throw new AppError('Code MFA invalide', 401, 'MFA_CODE_INVALID');
  }

  return prisma.mfaMethod.update({
    where: { id: methodId },
    data: { enabled: true, verified: true, verifiedAt: new Date(), lastUsedAt: new Date() },
  });
}

async function verifyMfaCode({ userId, methodId, code }) {
  const method = await prisma.mfaMethod.findFirst({
    where: { id: methodId, userId, enabled: true, verified: true },
  });
  if (!method) {
    throw new AppError('Méthode MFA invalide ou non activée', 403, 'MFA_METHOD_INVALID');
  }

  const isValid = authenticator.verify({ token: code, secret: method.secretRef });
  if (!isValid) {
    throw new AppError('Code MFA invalide', 401, 'MFA_CODE_INVALID');
  }

  await prisma.mfaMethod.update({
    where: { id: methodId },
    data: { lastUsedAt: new Date() },
  });

  return true;
}

async function listMfaMethods(userId) {
  return prisma.mfaMethod.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

async function hasMfaEnabled(userId) {
  const count = await prisma.mfaMethod.count({
    where: { userId, enabled: true },
  });
  return count > 0;
}

async function disableMfaMethod(methodId) {
  return prisma.mfaMethod.update({
    where: { id: methodId },
    data: { enabled: false, disabledAt: new Date() },
  });
}

async function generateRecoveryCodes(userId) {
  await prisma.recoveryCode.deleteMany({ where: { userId, usedAt: null } });

  const rawCodes = Array.from({ length: RECOVERY_CODES_COUNT }, () => generateRecoveryCode());

  await prisma.recoveryCode.createMany({
    data: rawCodes.map((code) => ({
      userId,
      codeHash: hashToken(code),
    })),
  });

  return rawCodes;
}

async function verifyRecoveryCode({ userId, code }) {
  const codeHash = hashToken(code);
  const entry = await prisma.recoveryCode.findFirst({
    where: { userId, codeHash, usedAt: null },
  });

  if (!entry) {
    throw new AppError('Code de récupération invalide ou déjà utilisé', 401, 'RECOVERY_CODE_INVALID');
  }
  if (entry.expiresAt && entry.expiresAt < new Date()) {
    throw new AppError('Code de récupération expiré', 401, 'RECOVERY_CODE_EXPIRED');
  }

  await prisma.recoveryCode.update({
    where: { id: entry.id },
    data: { usedAt: new Date() },
  });

  return true;
}

module.exports = {
  enrollMfaMethod,
  verifyMfaEnrollment,
  verifyMfaCode,
  listMfaMethods,
  hasMfaEnabled,
  disableMfaMethod,
  generateRecoveryCodes,
  verifyRecoveryCode,
};
const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const credentialService = require('./credential.service');

async function findUserByIdentifier(identifier) {
  return prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { primaryEmail: identifier }],
    },
  });
}

async function getUserById(userId, { includeIdentities = false } = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: includeIdentities ? { identities: { include: { identity: true } } } : undefined,
  });
  if (!user) {
    throw new AppError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
  }
  return user;
}

function assertUserIsActive(user) {
  if (user.status === 'SUSPENDED') {
    throw new AppError('Compte suspendu', 403, 'USER_SUSPENDED');
  }
  if (user.status === 'LOCKED') {
    throw new AppError('Compte verrouillé', 423, 'USER_LOCKED');
  }
  if (user.status === 'DISABLED' || user.status === 'ARCHIVED') {
    throw new AppError('Compte désactivé', 403, 'USER_DISABLED');
  }
  if (user.status === 'PENDING') {
    throw new AppError('Compte en attente de validation', 403, 'USER_PENDING');
  }
}

async function registerUser({ username, email, phone, firstName, lastName, password }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { primaryEmail: email }] },
  });
  if (existing) {
    throw new AppError('Nom d\'utilisateur ou email déjà utilisé', 409, 'USER_ALREADY_EXISTS');
  }

  return prisma.$transaction(async (tx) => {
    const identity = await tx.identity.create({
      data: {
        type: 'HUMAN',
        status: 'ACTIVE',
        email,
        phone,
        confidence: 1.0,
        verifiedAt: null,
      },
    });

    const user = await tx.user.create({
      data: {
        username,
        primaryEmail: email,
        phone,
        firstName,
        lastName,
        status: 'PENDING',
      },
    });

    await tx.userIdentity.create({
      data: { userId: user.id, identityId: identity.id, isPrimary: true },
    });

    await credentialService.createPasswordCredential({ userId: user.id, password, client: tx });

    return user;
  });
}
async function listUsers({ status, search } = {}) {
  return prisma.user.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { primaryEmail: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateUser(userId, patch) {
  await getUserById(userId);
  return prisma.user.update({ where: { id: userId }, data: patch });
}

async function setUserStatus({ userId, status, changedBy, reason }) {
  await getUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: { status, statusChangedAt: new Date(), statusChangedBy: changedBy, statusChangedReason: reason },
  });
}

module.exports = {
  findUserByIdentifier,
  getUserById,
  assertUserIsActive,
  registerUser,
  listUsers,
  updateUser,
  setUserStatus,
};
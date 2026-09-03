const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { hashToken } = require('../utils/password');

async function registerOrUpdateDevice({ userId, rawFingerprint, name, deviceType }) {
  const fingerprintHash = hashToken(rawFingerprint);

  const existing = await prisma.device.findFirst({
    where: { userId, fingerprintHash },
  });

  if (existing) {
    return prisma.device.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return prisma.device.create({
    data: {
      userId,
      fingerprintHash,
      name,
      deviceType,
      trustLevel: 'UNKNOWN',
    },
  });
}

async function getUserDevices(userId) {
  return prisma.device.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
  });
}

async function getDeviceById(deviceId, userId) {
  const device = await prisma.device.findFirst({ where: { id: deviceId, userId } });
  if (!device) {
    throw new AppError('Appareil introuvable', 404, 'DEVICE_NOT_FOUND');
  }
  return device;
}

async function trustDevice({ deviceId, userId, trustedBy }) {
  await getDeviceById(deviceId, userId);
  return prisma.device.update({
    where: { id: deviceId },
    data: { trustLevel: 'TRUSTED', trustedAt: new Date(), trustedBy },
  });
}

async function untrustDevice({ deviceId, userId }) {
  await getDeviceById(deviceId, userId);
  return prisma.device.update({
    where: { id: deviceId },
    data: { trustLevel: 'UNTRUSTED' },
  });
}

async function revokeDevice({ deviceId, userId, revokedBy, revokeReason }) {
  await getDeviceById(deviceId, userId);
  return prisma.device.update({
    where: { id: deviceId },
    data: { revokedAt: new Date(), revokedBy, revokeReason, trustLevel: 'UNTRUSTED' },
  });
}

function isDeviceUsable(device) {
  if (!device) return false;
  if (device.revokedAt) return false;
  return true;
}

module.exports = {
  registerOrUpdateDevice,
  getUserDevices,
  getDeviceById,
  trustDevice,
  untrustDevice,
  revokeDevice,
  isDeviceUsable,
};
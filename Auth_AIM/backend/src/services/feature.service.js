const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');

async function createFeature({ code, name, description, metered, quotaCode, metadata }) {
  const existing = await prisma.feature.findUnique({ where: { code } });
  if (existing) {
    throw new AppError('Une feature avec ce code existe déjà', 409, 'FEATURE_CODE_ALREADY_EXISTS');
  }
  return prisma.feature.create({
    data: { code, name, description, metered, quotaCode, metadata, status: 'ACTIVE' },
  });
}

async function listFeatures({ status } = {}) {
  return prisma.feature.findMany({ where: { ...(status ? { status } : {}) }, orderBy: { code: 'asc' } });
}

async function getFeatureByCode(code) {
  const feature = await prisma.feature.findUnique({ where: { code } });
  if (!feature) {
    throw new AppError('Feature introuvable', 404, 'FEATURE_NOT_FOUND');
  }
  return feature;
}

async function updateFeature(code, patch) {
  await getFeatureByCode(code);
  return prisma.feature.update({ where: { code }, data: patch });
}

async function deprecateFeature(code) {
  await getFeatureByCode(code);
  return prisma.feature.update({ where: { code }, data: { status: 'DEPRECATED' } });
}

async function assertFeatureUsable(code) {
  const feature = await getFeatureByCode(code);
  if (feature.status !== 'ACTIVE') {
    throw new AppError('Cette feature n\'est plus active', 409, 'FEATURE_NOT_ACTIVE');
  }
  return feature;
}

module.exports = { createFeature, listFeatures, getFeatureByCode, updateFeature, deprecateFeature, assertFeatureUsable };
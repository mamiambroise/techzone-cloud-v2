const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');

async function searchTenants({ search, status } = {}) {
  return prisma.tenant.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getTenantById(id) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw new AppError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
  }
  return tenant;
}

async function getTenantMemberships(tenantId) {
  return prisma.membership.findMany({
    where: { tenantId },
    include: { user: { select: { id: true, username: true, primaryEmail: true, status: true } } },
  });
}

async function setTenantStatus({ tenantId, status, changedBy, reason }) {
  await getTenantById(tenantId);
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { status, statusChangedAt: new Date(), statusChangedBy: changedBy, statusChangedReason: reason },
  });
}

module.exports = { searchTenants, getTenantById, getTenantMemberships, setTenantStatus };
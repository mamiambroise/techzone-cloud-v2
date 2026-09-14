const adminTenantService = require('../services/adminTenant.service');
const { success } = require('../utils/response');

async function search(req, res, next) {
  try {
    const tenants = await adminTenantService.searchTenants({ search: req.query.search, status: req.query.status });
    return success(res, { data: tenants });
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const tenant = await adminTenantService.getTenantProfile(req.params.id);
    return success(res, { data: tenant });
  } catch (err) {
    return next(err);
  }
}

async function getMemberships(req, res, next) {
  try {
    const memberships = await adminTenantService.getTenantMemberships(req.params.id);
    return success(res, { data: memberships });
  } catch (err) {
    return next(err);
  }
}

async function getSubscriptions(req, res, next) {
  try {
    const subscriptions = await adminTenantService.getTenantSubscriptions(req.params.id);
    return success(res, { data: subscriptions });
  } catch (err) {
    return next(err);
  }
}

async function getUsage(req, res, next) {
  try {
    const usage = await adminTenantService.getTenantUsage(req.params.id);
    return success(res, { data: usage });
  } catch (err) {
    return next(err);
  }
}

async function getIncidents(req, res, next) {
  try {
    const incidents = await adminTenantService.getTenantIncidents(req.params.id);
    return success(res, { data: incidents });
  } catch (err) {
    return next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const tenant = await adminTenantService.changeTenantStatus({
      tenantId: req.params.id,
      status: req.body.status,
      actorId: req.auth.userId,
      reason: req.body.reason,
    });
    return success(res, { data: tenant, message: 'Statut tenant mis à jour' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { search, getProfile, getMemberships, getSubscriptions, getUsage, getIncidents, changeStatus };
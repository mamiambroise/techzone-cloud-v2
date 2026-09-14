const featureService = require('../services/feature.service');
const { success } = require('../utils/response');

async function create(req, res, next) {
  try {
    const feature = await featureService.createFeature(req.body);
    return success(res, { data: feature, statusCode: 201, message: 'Feature créée' });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const features = await featureService.listFeatures({ status: req.query.status });
    return success(res, { data: features });
  } catch (err) {
    return next(err);
  }
}

async function getByCode(req, res, next) {
  try {
    const feature = await featureService.getFeatureByCode(req.params.code);
    return success(res, { data: feature });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const feature = await featureService.updateFeature(req.params.code, req.body);
    return success(res, { data: feature, message: 'Feature mise à jour' });
  } catch (err) {
    return next(err);
  }
}

async function deprecate(req, res, next) {
  try {
    const feature = await featureService.deprecateFeature(req.params.code);
    return success(res, { data: feature, message: 'Feature dépréciée' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, getByCode, update, deprecate };
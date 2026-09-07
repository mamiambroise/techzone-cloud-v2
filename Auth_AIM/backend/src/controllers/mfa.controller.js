const mfaService = require('../services/mfa.service');
const { success } = require('../utils/response');

async function enroll(req, res, next) {
  try {
    const { method, secretRef } = await mfaService.enrollMfaMethod({
      userId: req.auth.userId,
      type: req.body.type,
      label: req.body.label,
    });
    return success(res, { data: { method, secretRef }, statusCode: 201, message: 'Méthode MFA enregistrée, à vérifier' });
  } catch (err) {
    return next(err);
  }
}

async function verifyEnrollment(req, res, next) {
  try {
    const method = await mfaService.verifyMfaEnrollment({
      methodId: req.body.methodId,
      code: req.body.code,
    });
    return success(res, { data: method, message: 'Méthode MFA activée' });
  } catch (err) {
    return next(err);
  }
}

async function listMethods(req, res, next) {
  try {
    const methods = await mfaService.listMfaMethods(req.auth.userId);
    return success(res, { data: methods });
  } catch (err) {
    return next(err);
  }
}

async function revokeMethod(req, res, next) {
  try {
    const method = await mfaService.disableMfaMethod(req.params.id);
    return success(res, { data: method, message: 'Méthode MFA désactivée' });
  } catch (err) {
    return next(err);
  }
}

async function regenerateRecoveryCodes(req, res, next) {
  try {
    const codes = await mfaService.generateRecoveryCodes(req.auth.userId);
    return success(res, { data: { recoveryCodes: codes }, message: 'Codes de récupération régénérés — à afficher une seule fois' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { enroll, verifyEnrollment, listMethods, revokeMethod, regenerateRecoveryCodes };

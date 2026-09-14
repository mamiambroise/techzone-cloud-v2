const { AppError } = require('../utils/response');
const contextService = require('../services/context.service');

function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      const context = await contextService.getContext({
        subjectType: 'USER',
        subjectId: req.auth.userId,
        sessionId: req.auth.sessionId,
        requestedTenantId: req.body?.tenantId || req.query?.tenantId,
        source: 'AUTHORIZATION_CHECK',
      });

      if (context.status !== 'RESOLVED') {
        throw new AppError('Contexte non résolu pour vérifier les permissions', 403, 'AUTHORIZATION_CONTEXT_UNRESOLVED');
      }

      const hasPermission = context.permissions.some((p) => p.code === permissionCode);
      if (!hasPermission) {
        throw new AppError('Permission refusée', 403, 'FORBIDDEN_PERMISSION');
      }

      req.iamContext = context;
      return next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      return next(new AppError('Vérification de permission échouée', 403, 'AUTHORIZATION_CHECK_FAILED'));
    }
  };
}

module.exports = { requirePermission };
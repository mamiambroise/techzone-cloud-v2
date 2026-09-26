const { AppError } = require('../utils/response');
const { error: errorResponse } = require('../utils/response');
const { databaseError } = require('../utils/database-error');

function errorMiddleware(err, req, res, next) {
  const databaseFailure = databaseError(err);
  if (databaseFailure) {
    console.error({ code: databaseFailure.code, traceId: req.traceId });
    return errorResponse(res, databaseFailure);
  }
  if (err instanceof AppError) {
    return errorResponse(res, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
    });
  }

  console.error({ code: 'INTERNAL_ERROR', type: err?.name, traceId: req.traceId });
  return errorResponse(res, {
    message: 'Erreur interne',
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    details: null,
  });
}

module.exports = errorMiddleware;

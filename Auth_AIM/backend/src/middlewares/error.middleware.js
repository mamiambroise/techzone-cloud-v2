const { AppError } = require('../utils/response');
const { error: errorResponse } = require('../utils/response');

function errorMiddleware(err, req, res, next) {
  if (err instanceof AppError) {
    return errorResponse(res, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
    });
  }

  console.error(err);

  const isProd = process.env.NODE_ENV === 'production';
  return errorResponse(res, {
    message: isProd ? 'Erreur interne' : err.message,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    details: isProd ? null : err.stack,
  });
}

module.exports = errorMiddleware;
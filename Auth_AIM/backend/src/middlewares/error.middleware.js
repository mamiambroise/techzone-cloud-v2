const { failure } = require('../utils/response');

function errorMiddleware(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  return failure(res, {
    statusCode,
    message,
    errors: err.errors || null,
  });
}

module.exports = errorMiddleware;
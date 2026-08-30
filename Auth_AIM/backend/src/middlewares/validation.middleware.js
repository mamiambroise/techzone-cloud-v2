const { validationResult } = require('express-validator');
const { failure } = require('../utils/response');

function validationMiddleware(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failure(res, {
      statusCode: 422,
      message: 'Erreur de validation',
      errors: errors.array(),
    });
  }
  next();
}

module.exports = validationMiddleware;
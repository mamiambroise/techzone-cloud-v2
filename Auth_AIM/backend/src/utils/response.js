class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function success(res, { data = null, message = 'OK', statusCode = 200, meta = null } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function error(res, { message = 'Erreur interne', statusCode = 500, code = 'INTERNAL_ERROR', details = null } = {}) {
  const body = { success: false, message, code };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

function denied(res, { message = 'Accès refusé', statusCode = 403, code = 'ACCESS_DENIED' } = {}) {
  return res.status(statusCode).json({ success: false, message, code });
}

module.exports = { success, error, denied, AppError };
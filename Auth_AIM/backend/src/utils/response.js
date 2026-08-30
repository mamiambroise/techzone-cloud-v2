/**
 * Enveloppe de réponse standardisée pour toute l'API Auth+IAM+Context.
 * Garantit un format homogène consommé par le front et par les autres
 * modules Techzone Cloud.
 */

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

/**
 * Cas spécifique IAM-CDC-06 §140 (Fail Closed) : pour toute décision
 * d'accès refusée par sécurité/risque, on ne doit jamais exposer
 * la raison technique précise au client.
 */
function denied(res, { message = 'Accès refusé', statusCode = 403, code = 'ACCESS_DENIED' } = {}) {
  return res.status(statusCode).json({ success: false, message, code });
}

module.exports = { success, error, denied };
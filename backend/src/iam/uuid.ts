/**
 * Validation d'identifiant UUID.
 *
 * Les identifiants applicatifs (`tenantId`, `applicationId`, `versionId`…) sont
 * des colonnes PostgreSQL de type `uuid`. Un identifiant malformé n'est pas une
 * panne : le laisser atteindre le pilote fait remonter une erreur de format que
 * le client reçoit en `500`, alors que sa requête est simplement invalide.
 *
 * On valide donc avant tout accès à la base, et la réponse devient un `400`
 * documenté au lieu d'une erreur serveur.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
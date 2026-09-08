/**
 * Platform Foundation Error Contract Catalog (PF-CDC-00 section 11)
 */

export const ErrorContracts = {
  PLATFORM_APPLICATION_NOT_FOUND: {
    code: 'PLATFORM_APPLICATION_NOT_FOUND',
    status: 404,
    description: "L'application spécifiée est introuvable ou n'appartient pas au tenant actif.",
    severity: 'ERROR',
  },
  PLATFORM_VERSION_INVALID: {
    code: 'PLATFORM_VERSION_INVALID',
    status: 400,
    description: "Le format de version ou la transition de cycle de vie est invalide.",
    severity: 'ERROR',
  },
  PLATFORM_ENVIRONMENT_NOT_FOUND: {
    code: 'PLATFORM_ENVIRONMENT_NOT_FOUND',
    status: 404,
    description: "L'environnement cible n'existe pas ou n'est pas accessible.",
    severity: 'ERROR',
  },
  PLATFORM_CONTRACT_INCOMPATIBLE: {
    code: 'PLATFORM_CONTRACT_INCOMPATIBLE',
    status: 409,
    description: "Rupture de contrat détectée. Le consumer et le provider sont incompatibles.",
    severity: 'CRITICAL',
  },
  PLATFORM_CONFIG_INVALID: {
    code: 'PLATFORM_CONFIG_INVALID',
    status: 422,
    description: "La valeur de configuration viole le schéma, le type ou les contraintes requises.",
    severity: 'WARNING',
  },
  PLATFORM_SNAPSHOT_INVALID: {
    code: 'PLATFORM_SNAPSHOT_INVALID',
    status: 400,
    description: "L'état du snapshot est incohérent ou son hash ne correspond pas au contenu canonique.",
    severity: 'ERROR',
  },
  PLATFORM_PERMISSION_DENIED: {
    code: 'PLATFORM_PERMISSION_DENIED',
    status: 403,
    description: "Le rôle IAM courant n'a pas les droits requis pour exécuter cette opération.",
    severity: 'CRITICAL',
  },
  PLATFORM_TENANT_VIOLATION: {
    code: 'PLATFORM_TENANT_VIOLATION',
    status: 403,
    description: "Tentative d'accès inter-tenant interdite sans autorisation explicite.",
    severity: 'CRITICAL',
  },
};

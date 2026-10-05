import { PERMISSIONS } from './iam.constants';

/**
 * Phase 8 — registre canonique des permissions.
 *
 * Source de vérité : `PERMISSIONS` (iam.constants.ts), c'est-à-dire les
 * libellés réellement passés à `@RequirePermission(...)` et `@Permissions(...)`
 * par les contrôleurs. Toute permission inventée ici mais absente de
 * `PERMISSIONS` — ou l'inverse — serait morte : `permission-registry.spec.ts`
 * verrouille cette parité dans les deux sens.
 *
 * La table `permission` est un miroir de ce catalogue : le RBAC lit la base,
 * mais la base ne peut pas contenir de permission inconnue du code.
 */

export type PermissionDefinition = {
  code: string;
  resource: string;
  action: string;
  name: string;
  description: string;
  critical: boolean;
  active: boolean;
};

/**
 * Permissions plateforme / sensibles : administration IAM, secrets
 * d'intégration, opérations de facturation reversant des fonds, export de
 * diagnostics runtime. Elles ne doivent jamais être accordées par un rôle
 * tenant — elles existent pour rendre explicite leur exclusion.
 */
const CRITICAL_PERMISSION_CODES = new Set<string>([
  PERMISSIONS.IAM_ADMIN,
  PERMISSIONS.INTEGRATION_CREDENTIAL_READ,
  PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE,
  PERMISSIONS.BILLING_MANAGE,
  PERMISSIONS.BILLING_PLAN_MANAGE,
  PERMISSIONS.BILLING_PAYMENT_RECORD,
  PERMISSIONS.BILLING_PAYMENT_REFUND,
  PERMISSIONS.BILLING_OVERRIDE_MANAGE,
  PERMISSIONS.RUNTIME_DIAGNOSTIC_EXPORT,
  PERMISSIONS.RUNTIME_CACHE_INVALIDATE,
]);

/**
 * Les codes sont soit `resource:action`, soit `resource.action.action`
 * (Pack / Runtime sont historiquement en point). On déduplique le préfixe pour
 * ne pas créer deux ressources différentes pour `runtime.resolution.read` et
 * `runtime.resolution.reresolve`.
 */
function splitCode(code: string): { resource: string; action: string } {
  if (code.includes(':')) {
    const [resource, action] = code.split(':');
    return { resource, action };
  }
  const parts = code.split('.');
  if (parts.length < 2) {
    return { resource: code, action: 'read' };
  }
  return { resource: parts[0], action: parts.slice(1).join('.') };
}

function toDefinition(code: string): PermissionDefinition {
  const { resource, action } = splitCode(code);
  return {
    code,
    resource,
    action,
    name: `${resource} ${action}`,
    description: `${action} sur ${resource}`,
    critical: CRITICAL_PERMISSION_CODES.has(code),
    active: true,
  };
}

/** Toutes les permissions déclarées par le code, dans l'ordre du registre. */
export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] =
  Object.freeze(
    Array.from(new Set(Object.values(PERMISSIONS))).map(toDefinition),
  );

export const PERMISSION_CODES: readonly string[] = Object.freeze(
  PERMISSION_DEFINITIONS.map((definition) => definition.code),
);

export function isCriticalPermission(code: string): boolean {
  return CRITICAL_PERMISSION_CODES.has(code);
}
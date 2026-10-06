import { PERMISSIONS } from './iam.constants';

/**
 * Phase 8 — rôles système tenant.
 *
 * Un rôle est un libellé porteur de sens ; l'autorisation, elle, vient des
 * tables `role` / `role_permission` / `role_assignment`. Ces définitions ne
 * servent qu'à répliquer un catalogue déterministe et rejouable en base
 * (`iam-rbac-seed.ts`) : le code n'accorde jamais un droit tout seul.
 *
 * Codes stables : ils sont référencés par le seed et par les tests, et
 * exposés à l'UI via `/auth/me`.
 */
export const TENANT_ROLE_CODES = {
  /** Lecture seule sur les surfaces métier du tenant. */
  TENANT_USER: 'tenant_user',
  /** Construit, exploite et publie les applications de SON tenant. */
  APPLICATION_MANAGER: 'application_manager',
  /** Tenue du tenant : rôles, membres, référentiel. */
  TENANT_ADMIN: 'tenant_admin',
} as const;

export type TenantRoleCode =
  (typeof TENANT_ROLE_CODES)[keyof typeof TENANT_ROLE_CODES];

/**
 * Permissions de lecture communes à tout membre d'un tenant. C'est exactement
 * l'historique `ROLE_PERMISSIONS[ROLES.USER]` : la Phase 8 ne doit ni retirer
 * ni ajouter de visibilité à un membre sans rôle.
 */
const TENANT_USER_PERMISSIONS: string[] = [
  PERMISSIONS.ERP_READ,
  PERMISSIONS.AUTOMATION_READ,
  PERMISSIONS.DATA_RUNTIME_READ,
  PERMISSIONS.DATA_RUNTIME_QUERY,
  PERMISSIONS.CONFIG_READ,
  PERMISSIONS.UI_BUILDER_READ,
  PERMISSIONS.BM_READ,
  PERMISSIONS.INTEGRATION_READ,
  PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ,
  PERMISSIONS.BILLING_READ,
  PERMISSIONS.BILLING_PLAN_READ,
  PERMISSIONS.BILLING_SUBSCRIPTION_READ,
  PERMISSIONS.BILLING_INVOICE_READ,
  PERMISSIONS.BILLING_PAYMENT_READ,
  PERMISSIONS.BILLING_USAGE_READ,
];

/**
 * APPLICATION_MANAGER : la chaîne complète de vie d'une application dans son
 * tenant — définition métier (BM), écrans (UI Builder), exécution des données
 * (Data Runtime), empaquetage et publication (Pack Manager), et exploitation
 * du pack publié (Pack Runtime).
 *
 * Le périmètre est calé sur les permissions réellement vérifiées par les
 * contrôleurs : chaque entrée est exigée par au moins une route.
 *
 * Volontairement exclus (moindre privilège) :
 *  - `iam:admin` : administration plateforme et gestion de tous les tenants ;
 *  - `integration:credential:*` : secrets plateforme ;
 *  - `integration:write` / `integration:execute` : le câblage ERP est une
 *    opération d'exploitation distincte de la construction d'application ;
 *  - `erp:write` : synchronisation bidirectionnelle, hors construction ;
 *  - `billing:manage`, `billing:payment:*`, `billing:override:manage` :
 *    facturation et mouvement de fonds ;
 *  - `runtime.cache.invalidate` et `runtime.diagnostic.export` : actions
 *    plateforme ;
 *  - `automation:execute` : déclenchement d'effets de bord, pas de construction.
 */
const APPLICATION_MANAGER_EXTRA_PERMISSIONS: string[] = [
  // Business Manager : définition du modèle métier, publication de version.
  PERMISSIONS.BM_WRITE,
  PERMISSIONS.BM_VALIDATE,
  PERMISSIONS.BM_PUBLISH,
  // UI Builder : pages, composants, validation du rendu.
  PERMISSIONS.UI_BUILDER_WRITE,
  PERMISSIONS.UI_BUILDER_VALIDATE,
  // Data Runtime : lecture des ressources et exécution d'opérations.
  PERMISSIONS.DATA_RUNTIME_EXECUTE,
  // Pack Manager : référentiel de packs et cycle de vie des versions.
  PERMISSIONS.PACK_READ,
  PERMISSIONS.PACK_CREATE,
  PERMISSIONS.PACK_UPDATE,
  PERMISSIONS.PACK_ARCHIVE,
  PERMISSIONS.PACK_RESTORE,
  PERMISSIONS.PACK_MODULE_READ,
  PERMISSIONS.PACK_MODULE_CREATE,
  PERMISSIONS.PACK_FEATURE_READ,
  PERMISSIONS.PACK_FEATURE_CREATE,
  PERMISSIONS.PACK_CAPABILITY_READ,
  PERMISSIONS.PACK_CAPABILITY_CREATE,
  PERMISSIONS.PACK_CAPABILITY_UPDATE,
  PERMISSIONS.PACK_CAPABILITY_ATTACH,
  PERMISSIONS.PACK_DEPENDENCY_READ,
  PERMISSIONS.PACK_DEPENDENCY_CREATE,
  PERMISSIONS.PACK_RULE_READ,
  PERMISSIONS.PACK_RULE_CREATE,
  PERMISSIONS.PACK_VERSION_READ,
  PERMISSIONS.PACK_VERSION_CREATE,
  PERMISSIONS.PACK_VERSION_UPDATE,
  PERMISSIONS.PACK_VERSION_VALIDATE,
  PERMISSIONS.PACK_VERSION_GENERATE_MANIFEST,
  PERMISSIONS.PACK_VERSION_PUBLISH,
  // Pack Runtime : consommation du pack publié dans le tenant.
  PERMISSIONS.RUNTIME_EFFECTIVE_MANIFEST_READ,
  PERMISSIONS.RUNTIME_RESOLVE,
  PERMISSIONS.RUNTIME_RESOLUTION_READ,
  PERMISSIONS.RUNTIME_RESOLUTION_RERESOLVE,
  PERMISSIONS.RUNTIME_CACHE_READ,
  PERMISSIONS.RUNTIME_PROVIDER_READ,
  PERMISSIONS.RUNTIME_PROVIDER_PROBE,
  PERMISSIONS.RUNTIME_RESILIENCE_READ,
  PERMISSIONS.RUNTIME_DIAGNOSTIC_READ,
];

const APPLICATION_MANAGER_PERMISSIONS: string[] = Array.from(
  new Set([...TENANT_USER_PERMISSIONS, ...APPLICATION_MANAGER_EXTRA_PERMISSIONS]),
);

/**
 * TENANT_ADMIN : ADMINISTRATION_MANAGER et, à terme, administration du
 * tenant (membres, rôles).
 *
 * Today this role is deliberately equivalent to APPLICATION_MANAGER: the
 * `PERMISSIONS` catalog exposes no tenant-scoped membership or role permission
 * (the only one, `iam:admin`, is platform-wide). Adding rights here before
 * those permissions exist would advertise a capability the RBAC cannot
 * deliver, so the extra set stays empty and the role is documented as the
 * tenant's future governance role.
 */
const TENANT_ADMIN_EXTRA_PERMISSIONS: string[] = [];

export type SystemRoleDefinition = {
  code: string;
  name: string;
  description: string;
  /** Rôles dont les permissions sont incluses dans celui-ci. */
  inherits: readonly string[];
  permissions: readonly string[];
  /** Accès plateforme : jamais accordé par un rôle tenant. */
  platform: boolean;
};

export const SYSTEM_ROLES: readonly SystemRoleDefinition[] = Object.freeze([
  {
    code: TENANT_ROLE_CODES.TENANT_USER,
    name: 'Utilisateur du tenant',
    description:
      'Lecture seule sur les surfaces métier du tenant (Business Manager, UI Builder, Data Runtime, intégrations, facturation).',
    inherits: [],
    permissions: Object.freeze([...TENANT_USER_PERMISSIONS]),
    platform: false,
  },
  {
    code: TENANT_ROLE_CODES.APPLICATION_MANAGER,
    name: 'Gestionnaire d’applications',
    description:
      'Construit, exploite et publie les applications du tenant : modèle métier, écrans, données, packs et runtime.',
    inherits: [TENANT_ROLE_CODES.TENANT_USER],
    permissions: Object.freeze(APPLICATION_MANAGER_PERMISSIONS),
    platform: false,
  },
  {
    code: TENANT_ROLE_CODES.TENANT_ADMIN,
    name: 'Administrateur du tenant',
    description:
      'Rôle de gouvernance du tenant. Identique à application_manager tant que le catalogue n’expose pas de permission tenant-scopée sur les membres et les rôles ; aucune administration plateforme.',
    inherits: [TENANT_ROLE_CODES.APPLICATION_MANAGER],
    permissions: Object.freeze(TENANT_ADMIN_EXTRA_PERMISSIONS),
    platform: false,
  },
]);

/**
 * Rôle plateforme de référence. Il n'est PAS accordé via `role_assignment` :
 * `iamUser.isAdmin` reste l'override superadmin explicite. Ce rôle sert à
 * documenter le périmètre complet et à garantir que le seed n'oublie aucune
 * permission dans le catalogue.
 */
export const PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';

export function systemRoleByCode(code: string): SystemRoleDefinition | undefined {
  return SYSTEM_ROLES.find((role) => role.code === code);
}

/**
 * Permissions effectives d'un rôle système, héritage résolu. La résolution est
 * récursive et détecte les cycles pour ne pas boucler indéfiniment si le
 * catalogue est mal renseigné.
 */
export function effectiveSystemRolePermissions(code: string): string[] {
  const resolved = new Set<string>();
  const seen = new Set<string>();

  const visit = (current: string) => {
    if (seen.has(current)) {
      return;
    }
    seen.add(current);
    const role = systemRoleByCode(current);
    if (!role) {
      return;
    }
    role.inherits.forEach(visit);
    role.permissions.forEach((permission) => resolved.add(permission));
  };

  visit(code);
  return Array.from(resolved);
}
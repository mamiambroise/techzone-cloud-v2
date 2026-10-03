/**
 * Périmètre tenant — invalidation des états tenant-scoped.
 *
 * Le magasin Redux mélange deux familles d'états :
 *  - globaux : identité, préférences d'affichage, toasts, url active ;
 *  - tenant-scoped : données serveur filtrées par tenant (applications,
 *    environnements, contrats, configurations, snapshots, intégration,
 *    déploiement, UI Builder, journal d'audit local).
 *
 * Sans invalidation, un changement de tenant laisse les données du tenant
 * précédent en mémoire jusqu'au prochain fetch : l'interface peut alors afficher
 * des données d'un autre tenant. On remet donc explicitement à zéro les slices
 * tenant-scoped, et uniquement eux.
 */

/** Slices dont l'état dépend du tenant actif. */
export const TENANT_SCOPED_SLICES = [
  'applications',
  'environments',
  'contracts',
  'config',
  'snapshots',
  'integration',
  'deployment',
  'uiBuilder',
  'audit',
];

/**
 * Slices explicitement Globaux, conservés lors d'un changement de tenant.
 * `platform` porte notamment `activeTenant`, `sidebarCollapsed`, `toasts` et
 * l'onglet actif : le vider ferait perdre l'état d'affichage et le tenant
 * qui vient d'être validé.
 */
export const GLOBAL_SLICES = ['platform'];

export const TENANT_SCOPE_RESET = 'tenant/scopeReset';

/**
 * Demande la purge des états tenant-scoped.
 * @param {string|null} tenantId tenant cible, conservé pour traçabilité.
 */
export const resetTenantScopedState = (tenantId = null) => ({
  type: TENANT_SCOPE_RESET,
  payload: { tenantId },
});

export const isTenantScopeReset = (action) => action?.type === TENANT_SCOPE_RESET;
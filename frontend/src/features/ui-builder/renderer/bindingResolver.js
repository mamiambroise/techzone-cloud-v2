/**
 * UI Builder — résolution structurée des bindings (CDC §6, mission §49 REAL DATA ONLY).
 *
 * Le preview ne fabrique AUCUNE donnée métier :
 *  - STATIC   → la valeur déclarée ;
 *  - CONTEXT  → données réelles du contexte (tenant actif, utilisateur courant) ;
 *  - ENTITY_FIELD / ENTITY_LIST → libellé réel du champ Business Manager
 *    (la donnée de ligne est du ressort de Data Runtime à l'exécution) ;
 *  - VARIABLE → valeur déclarée de la variable (structure) ;
 *  - inconnu  → null (jamais d'interpolation arbitraire).
 */
export function createBindingResolver({ businessContext, tenantName, userName, applicationName } = {}) {
  const fieldLabel = (entityCode, fieldCode) => {
    const entity = (businessContext?.entities || []).find((e) => e.code === entityCode);
    if (!entity) return null;
    if (!fieldCode) return entity.name || entity.code;
    const field = (entity.fields || []).find((f) => f.code === fieldCode);
    return field ? field.label || field.code : null;
  };

  return function resolveBinding(node, prop, fallback) {
    const binding = node?.bindings?.[prop];
    if (!binding) return fallback ?? null;
    switch (binding.kind) {
      case 'STATIC':
        return binding.value ?? fallback ?? null;
      case 'CONTEXT': {
        if (binding.context === 'currentTenant') return tenantName || 'CurrentTenant.name';
        if (binding.context === 'currentUser') return userName || 'CurrentUser.name';
        if (binding.context === 'currentApplication') return applicationName || 'CurrentApplication.name';
        return null;
      }
      case 'ENTITY_FIELD': {
        const label = fieldLabel(binding.entity, binding.field);
        // Référence réelle BM résolue ; jamais de valeur de ligne simulée.
        return label ? `⌗ ${binding.entity}.${binding.field}` : `⌗ ${binding.entity || '?'}.${binding.field || '?'}`;
      }
      case 'ENTITY_LIST': {
        const label = fieldLabel(binding.entity, null);
        return label ? `⌗ ${binding.entity}` : `⌗ ${binding.entity || '?'}`;
      }
      case 'VARIABLE':
        return binding.variable ? `{${binding.variable}}` : null;
      default:
        return fallback ?? null;
    }
  };
}

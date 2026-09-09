// packRuleEngine.js — Deterministic Rule & Condition Simulator (PM-CDC-07)

/**
 * Resolves a dotted field path from a nested state context (e.g. 'features.stock.items.barcode_scanning').
 */
export function getContextValue(context, path) {
  if (!context || !path) return undefined;
  const segments = path.split('.');
  let current = context;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    current = current[seg];
  }
  return current;
}

/**
 * Evaluates a single atomic condition predicate against the context.
 */
export function evaluatePredicate(predicate, context) {
  const { field, operator, value } = predicate;
  const actualValue = getContextValue(context, field);

  switch (operator) {
    case 'EQUALS':
      return actualValue === value;
    case 'NOT_EQUALS':
      return actualValue !== value;
    case 'IS_TRUE':
      return actualValue === true;
    case 'IS_FALSE':
      return actualValue === false;
    case 'IS_DEFINED':
      return actualValue !== undefined && actualValue !== null && actualValue !== '';
    case 'CONTAINS':
      if (typeof actualValue === 'string') {
        return actualValue.includes(String(value));
      }
      if (Array.isArray(actualValue)) {
        return actualValue.includes(value);
      }
      return false;
    case 'IN':
      if (Array.isArray(value)) {
        return value.includes(actualValue);
      }
      return false;
    case 'GREATER_THAN':
      return Number(actualValue) > Number(value);
    case 'LESS_THAN':
      return Number(actualValue) < Number(value);
    default:
      return actualValue === value;
  }
}

/**
 * Evaluates a condition group (with combinator AND/OR) against the context.
 */
export function evaluateCondition(condition, context) {
  if (!condition || !condition.predicates || condition.predicates.length === 0) {
    return true;
  }

  const combinator = (condition.combinator || 'AND').toUpperCase();

  if (combinator === 'OR') {
    return condition.predicates.some(pred => evaluatePredicate(pred, context));
  }

  // Default to AND
  return condition.predicates.every(pred => evaluatePredicate(pred, context));
}

/**
 * Simulates all active rules for a given pack version and returns applied effects.
 */
export function simulateRules({ rules = [], context = {} }) {
  const sortedRules = [...rules]
    .filter(r => r.isActive !== false)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const triggeredRules = [];
  const evaluatedPredicates = [];
  const activeEffects = [];
  const conflicts = [];
  const appliedMutations = {};

  sortedRules.forEach(rule => {
    const isTriggered = evaluateCondition(rule.condition, context);

    const conditionResults = (rule.condition?.predicates || []).map(p => ({
      field: p.field,
      operator: p.operator,
      expected: p.value,
      actual: getContextValue(context, p.field),
      passed: evaluatePredicate(p, context),
    }));

    evaluatedPredicates.push({
      ruleId: rule.id,
      ruleCode: rule.code,
      results: conditionResults,
      passed: isTriggered,
    });

    if (isTriggered) {
      triggeredRules.push(rule);
      const effect = rule.effect || {};

      activeEffects.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        type: effect.type,
        target: effect.target,
        message: effect.message || `Effet de la règle ${rule.name} activé.`,
        severity: effect.type === 'INCOMPATIBLE_CONFLICT' ? 'ERROR' : 'INFO',
      });

      if (effect.type === 'INCOMPATIBLE_CONFLICT') {
        conflicts.push({
          ruleId: rule.id,
          target: effect.target,
          message: effect.message || `Conflit d’incompatibilité détecté par la règle ${rule.name}`,
        });
      }

      if (effect.type === 'ENABLE_FEATURE') {
        appliedMutations[`features.${effect.target}.enabled`] = true;
      } else if (effect.type === 'DISABLE_FEATURE') {
        appliedMutations[`features.${effect.target}.enabled`] = false;
      } else if (effect.type === 'REQUIRE_MODULE') {
        appliedMutations[`modules.${effect.target}.required`] = true;
      }
    }
  });

  return {
    success: conflicts.length === 0,
    totalRulesEvaluated: sortedRules.length,
    triggeredCount: triggeredRules.length,
    triggeredRules,
    evaluatedPredicates,
    activeEffects,
    conflicts,
    appliedMutations,
  };
}

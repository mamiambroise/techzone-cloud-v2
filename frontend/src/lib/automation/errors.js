const ERROR_MESSAGES = {
  AUTOMATION_NOT_FOUND: 'Cette ressource Automation est introuvable.',
  AUTOMATION_TENANT_DENIED: 'Cette ressource n’est pas accessible pour votre espace.',
  AUTOMATION_PERMISSION_DENIED: 'Vous ne disposez pas des droits nécessaires.',
  AUTOMATION_RULE_INVALID: 'La règle contient des éléments invalides.',
  AUTOMATION_WORKFLOW_INVALID: 'Le workflow ne peut pas être validé.',
  AUTOMATION_SIMULATION_FORBIDDEN: 'La simulation n’est pas autorisée.',
  AUTOMATION_ACTION_FAILED: 'Une action Automation a échoué.',
  AUTOMATION_TIMEOUT: 'L’opération a dépassé le délai autorisé.',
  AUTOMATION_LOOP_DETECTED: 'Une boucle a été détectée dans le workflow.',
  AUTOMATION_PROVIDER_UNAVAILABLE: 'Un fournisseur requis est indisponible.',
  AUTOMATION_IDEMPOTENCY_CONFLICT: 'Une opération identique est déjà en cours.',
  AUTOMATION_RUNTIME_BLOCKED: 'Le Runtime bloque cette opération.',
};

const ERROR_ACTIONS = {
  AUTOMATION_NOT_FOUND: 'Vérifiez le lien ou actualisez la liste.',
  AUTOMATION_TENANT_DENIED: 'Vérifiez votre espace actif ou contactez un administrateur.',
  AUTOMATION_PERMISSION_DENIED: 'Demandez l’autorisation Automation correspondante.',
  AUTOMATION_RULE_INVALID: 'Corrigez les erreurs de validation de la règle.',
  AUTOMATION_WORKFLOW_INVALID: 'Ouvrez le workflow et corrigez ses diagnostics.',
  AUTOMATION_SIMULATION_FORBIDDEN: 'Demandez la permission de simulation Automation.',
  AUTOMATION_ACTION_FAILED: 'Consultez le détail de l’exécution avant de réessayer.',
  AUTOMATION_TIMEOUT: 'Vérifiez les dépendances puis relancez si nécessaire.',
  AUTOMATION_LOOP_DETECTED: 'Corrigez les transitions du workflow pour supprimer la boucle.',
  AUTOMATION_PROVIDER_UNAVAILABLE: 'Vérifiez la disponibilité du fournisseur requis.',
  AUTOMATION_IDEMPOTENCY_CONFLICT: 'Consultez l’exécution existante avant de réessayer.',
  AUTOMATION_RUNTIME_BLOCKED: 'Vérifiez les prérequis du Runtime et les diagnostics.',
};

export function getAutomationErrorCode(error) {
  return error?.normalized?.code || error?.response?.data?.code || error?.code || null;
}

export function mapErrorToMessage(error) {
  const code = getAutomationErrorCode(error);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  const status = error?.normalized?.statusCode || error?.response?.status;
  if (status === 401) return 'Votre session a expiré. Reconnectez-vous.';
  if (status === 403) return 'Vous ne disposez pas des droits nécessaires.';
  return 'Une erreur est survenue lors de la communication avec Automation.';
}

export function mapErrorToAction(error) {
  const code = getAutomationErrorCode(error);
  if (code && ERROR_ACTIONS[code]) return ERROR_ACTIONS[code];
  const status = error?.normalized?.statusCode || error?.response?.status;
  if (status === 401) return 'Reconnectez-vous puis réessayez.';
  if (status === 403) return 'Contactez un administrateur pour demander l’accès.';
  return 'Réessayez. Si le problème persiste, transmettez le code de suivi au support.';
}

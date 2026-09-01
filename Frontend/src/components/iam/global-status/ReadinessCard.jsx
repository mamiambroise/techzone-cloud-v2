// ReadinessCard.jsx — IAM Readiness Global Status Component (IAM-CDC-01 Section 10.3)
// Question: "La configuration IAM est-elle suffisamment complète et cohérente ?"

import React from 'react';
import { Sparkles, CheckSquare, Layers, UserCheck, AlertCircle } from 'lucide-react';
import { GlobalStatusCard } from './GlobalStatusCard';

export function ReadinessCard({
  readinessData,
  onInspect,
  className = '',
}) {
  const {
    status = 'READY',
    score = 88,
    roleCompleteness = 100,
    tenantCompleteness = 100,
    erpCompleteness = 85,
    policiesValidatedCount = 12,
    totalPoliciesCount = 12,
    blockersCount = 0,
    warningsCount = 1,
    question = 'La configuration IAM est-elle suffisamment complète et cohérente ?',
  } = readinessData || {};

  const metrics = [
    {
      label: 'Rôles & Tenants',
      value: `${roleCompleteness}%`,
      subtext: 'Couverture 100%',
      statusColor: 'text-emerald-600',
    },
    {
      label: 'Politiques d Accès',
      value: `${policiesValidatedCount}/${totalPoliciesCount}`,
      subtext: blockersCount === 0 ? '0 bloquant' : `${blockersCount} bloquant`,
      statusColor: blockersCount === 0 ? 'text-emerald-600' : 'text-rose-600',
    },
  ];

  return (
    <GlobalStatusCard
      title="IAM Readiness"
      question={question}
      status={status}
      category="readiness"
      score={score}
      scoreLabel="Indice de Complétude IAM"
      scoreSubtext={status === 'OPTIMAL' ? 'Prêt pour Production' : 'Production Recommandée'}
      icon={Sparkles}
      metrics={metrics}
      summaryText={`Liaison annuaire ERP: ${erpCompleteness}% • ${warningsCount} avertissement non-bloquant`}
      footerMeta={blockersCount === 0 ? 'Prêt au déploiement' : `${blockersCount} blocage à corriger`}
      onInspect={onInspect}
      inspectLabel="Matrice d éligibilité"
      className={className}
    />
  );
}

export default ReadinessCard;

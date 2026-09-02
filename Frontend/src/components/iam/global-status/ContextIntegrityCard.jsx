// ContextIntegrityCard.jsx — Context Integrity Global Status Component (IAM-CDC-01 Section 10.4)
// Question: "Les contextes sont-ils correctement résolus ?"

import React from 'react';
import { Compass, Network, Split, GitCommit, AlertTriangle } from 'lucide-react';
import { GlobalStatusCard } from './GlobalStatusCard';

export function ContextIntegrityCard({
  contextData,
  onInspect,
  className = '',
}) {
  const {
    status = 'VERIFIED',
    score = 98.4,
    resolvedCount = 284,
    partialCount = 4,
    conflictCount = 1,
    invalidCount = 0,
    staleCount = 0,
    totalEvaluations = 289,
    avgResolutionMs = 1.8,
    breakdown = [],
    question = 'Les contextes sont-ils correctement résolus ?',
  } = contextData || {};

  const metrics = [
    {
      label: 'Contextes Résolus',
      value: resolvedCount,
      subtext: `${score}% conformes`,
      statusColor: 'text-emerald-600',
    },
    {
      label: 'Conflits Détectés',
      value: conflictCount,
      subtext: avgResolutionMs ? `${avgResolutionMs}ms/eval` : '<2ms',
      statusColor: conflictCount === 0 ? 'text-emerald-600' : 'text-amber-600',
    },
  ];

  return (
    <GlobalStatusCard
      title="Context Integrity"
      question={question}
      status={status}
      category="context"
      score={score}
      scoreLabel="Taux d Intégrité Contextuelle"
      scoreSubtext={`${resolvedCount}/${totalEvaluations} validés`}
      icon={Compass}
      metrics={metrics}
      progressItems={breakdown}
      summaryText="Cloisonnement strict par Tenant actif • Résolution temps-réel continue"
      footerMeta={`Latence d évaluation: ${avgResolutionMs}ms`}
      onInspect={onInspect}
      inspectLabel="Inspecter les graphes"
      className={className}
    />
  );
}

export default ContextIntegrityCard;

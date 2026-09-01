// HealthCard.jsx — Platform Health Global Status Component (IAM-CDC-01 Section 10.1)
// Question: "Les services IAM fonctionnent-ils techniquement ?"

import React from 'react';
import { Activity, Server, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GlobalStatusCard } from './GlobalStatusCard';

export function HealthCard({
  healthData,
  onInspect,
  className = '',
}) {
  const {
    status = 'HEALTHY',
    score = 94,
    operationalCount = 8,
    totalCount = 9,
    avgLatencyMs = 18,
    p95LatencyMs = 32,
    degradedCount = 1,
    criticalCount = 0,
    lastChecked = 'À l instant',
    question = 'Les services IAM fonctionnent-ils techniquement ?',
  } = healthData || {};

  const metrics = [
    {
      label: 'Services Actifs',
      value: `${operationalCount}/${totalCount}`,
      subtext: degradedCount > 0 ? `${degradedCount} ralenti` : '100% OK',
      statusColor: degradedCount > 0 ? 'text-amber-600' : 'text-emerald-600',
    },
    {
      label: 'Latence Moyenne',
      value: `${avgLatencyMs}ms`,
      subtext: `p95: ${p95LatencyMs}ms`,
      statusColor: avgLatencyMs < 30 ? 'text-emerald-600' : 'text-amber-600',
    },
  ];

  return (
    <GlobalStatusCard
      title="Platform Health"
      question={question}
      status={status}
      category="health"
      score={score}
      scoreLabel="Indice de Santé Technique"
      scoreSubtext={`${operationalCount}/${totalCount} opérationnels`}
      icon={Activity}
      metrics={metrics}
      summaryText={`${operationalCount} services critiques nominaux • ${degradedCount} avertissement d adaptateur`}
      footerMeta={`Dernier check: ${lastChecked}`}
      onInspect={onInspect}
      inspectLabel="Détails des services"
      className={className}
    />
  );
}

export default HealthCard;

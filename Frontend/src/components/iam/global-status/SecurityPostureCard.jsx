// SecurityPostureCard.jsx — Security Posture Global Status Component (IAM-CDC-01 Section 10.2)
// Question: "Existe-t-il un risque de sécurité actif ?"

import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, AlertOctagon, KeyRound } from 'lucide-react';
import { GlobalStatusCard } from './GlobalStatusCard';

export function SecurityPostureCard({
  securityData,
  onInspect,
  className = '',
}) {
  const {
    status = 'SECURE',
    score = 96,
    level = 'Niveau 0 (Nominal)',
    suspiciousSessionsCount = 0,
    privilegedAccountsCount = 3,
    twoFactorCoverageRate = 66,
    adminTwoFactorCoverageRate = 100,
    failedLogins24h = 0,
    lockedAccountsCount = 0,
    question = 'Existe-t-il un risque de sécurité actif ?',
  } = securityData || {};

  const metrics = [
    {
      label: 'Sessions Suspectes',
      value: suspiciousSessionsCount,
      subtext: suspiciousSessionsCount === 0 ? 'Aucune' : 'Alerte',
      statusColor: suspiciousSessionsCount === 0 ? 'text-emerald-600' : 'text-rose-600',
    },
    {
      label: '2FA Comptes Admin',
      value: `${adminTwoFactorCoverageRate}%`,
      subtext: `${privilegedAccountsCount} super-admins`,
      statusColor: adminTwoFactorCoverageRate === 100 ? 'text-emerald-600' : 'text-amber-600',
    },
  ];

  return (
    <GlobalStatusCard
      title="Security Posture"
      question={question}
      status={status}
      category="security"
      score={score}
      scoreLabel="Niveau de Sécurité Global"
      scoreSubtext={level}
      icon={status === 'SECURE' ? ShieldCheck : ShieldAlert}
      metrics={metrics}
      summaryText="Déconnexion 15m active • Hachage SHA-256 avec sel • Anti-brute-force actif"
      footerMeta={lockedAccountsCount > 0 ? `${lockedAccountsCount} compte verrouillé` : 'Protection Zero-Trust'}
      onInspect={onInspect}
      inspectLabel="Audit des menaces"
      className={className}
    />
  );
}

export default SecurityPostureCard;

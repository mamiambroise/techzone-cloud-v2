import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCode2,
  Copy,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';

const DEP_SPECS = [
  {
    id: 'dep-00',
    code: 'DEP-CDC-00',
    title: 'Socle, Architecture & Deployment Contract',
    status: 'LOCKED_V1',
    statusLabel: 'Contrat v1 Scellé',
    summary:
      'Définit le contrat de déploiement universel, les manifestes signés par KMS, les politiques de non-régression et le cadre de sécurité inter-packs.',
    sections: [
      {
        title: '1. Objet & Positionnement',
        content:
          'La couche DEP Publication orchestre la mise en production des applications de Techzone Cloud. Toutes les équipes fournissent un manifeste scellé conforme au Deployment Contract v1.',
      },
      {
        title: '2. Responsabilités Fondamentales',
        content:
          'DOIT : Valider les empreintes SHA-256, orchestrer les bascules sans coupure, appliquer les portes de sécurité, garantir le rollback en moins de 10s.\nNE DOIT PAS : Modifier le code applicatif, bypasser les autorisations IAM, ni exécuter des déploiements sans Snapshot préalable.',
      },
      {
        title: '3. Critères d’Acceptation',
        content:
          'Deployment Contract v1 documenté et scellé. 100% des releases dotées d’un condensat SHA-256 vérifié. Zéro coupure de service garantie.',
      },
    ],
  },
  {
    id: 'dep-01',
    code: 'DEP-CDC-01',
    title: 'Vue d’ensemble / Deployment Cockpit',
    status: 'ACTIVE',
    statusLabel: 'Actif & Conforme',
    summary:
      'Console centrale de supervision en temps réel : indicateurs DORA (Taux de succès, MTTR, Lead Time, Déploiements), état des clusters et flux de livraison.',
    sections: [
      {
        title: '1. Objectif du Cockpit',
        content:
          'Donner une visibilité instantanée sur les versions actives sur chaque environnement (DEV, TEST, STAGING, PROD) et l’avancement des pipelines.',
      },
      {
        title: '2. Indicateurs Clés (KPIs)',
        content:
          'Taux de succès >= 99.5%, Temps de Rollback MTTR < 10s, Lead Time moyen < 30min, Disponibilité 100% pendant les bascules.',
      },
    ],
  },
  {
    id: 'dep-02',
    code: 'DEP-CDC-02',
    title: 'Release Manager & Manifest Sealing',
    status: 'ACTIVE',
    statusLabel: 'Actif & Conforme',
    summary:
      'Création et vérification formelle des releases semver, génération de l’empreinte cryptographique SHA-256 et signature KMS des artéfacts.',
    sections: [
      {
        title: '1. Modèle de Release',
        content:
          'releaseCode, version semver, applicationRef, sealedSnapshotRef, targetEnvironment, deploymentStrategy, artifactsChecksum, signatures.',
      },
      {
        title: '2. Immutabilité du Manifeste',
        content:
          'Une fois scellé, aucun paramètre ni artéfact ne peut être altéré. Tout correctif nécessite la génération d’une nouvelle version candidate.',
      },
    ],
  },
  {
    id: 'dep-03',
    code: 'DEP-CDC-03',
    title: 'Pipelines & Stratégies de Déploiement',
    status: 'ACTIVE',
    statusLabel: 'Actif & Conforme',
    summary:
      'Orchestration des stratégies 0-downtime : Blue/Green (commutation instantanée), Canary (ventilation progressive avec seuils), Rolling update.',
    sections: [
      {
        title: '1. Stratégie Blue/Green',
        content:
          'Déploiement sur cluster miroir passif. Validation des sondes HTTP 200 et bascule DNS/Reverse-Proxy en moins de 2 secondes sans perte de session.',
      },
      {
        title: '2. Stratégie Canary',
        content:
          'Acheminement progressif du trafic (ex: 5% puis 20% puis 100%). Interruption automatique et rollback si le taux d’erreurs dépasse 0.5% ou si la latence P99 dépasse 250ms.',
      },
    ],
  },
  {
    id: 'dep-04',
    code: 'DEP-CDC-04',
    title: 'Promotion Contrôlée & Portes de Sécurité (Gateways)',
    status: 'ACTIVE',
    statusLabel: 'Actif & Conforme',
    summary:
      'Gouvernance du passage d’environnement DEV → TEST → STAGING → PROD. Contrôle obligatoire des tests E2E, de l’audit SecOps et approbation CAB.',
    sections: [
      {
        title: '1. Règles de Promotion',
        content:
          'Aucune release ne peut être déployée en Production sans avoir franchi les 5 portes de sécurité : Tests E2E (100%), SLA p99, Audit SecOps, Snapshot PF-06, et Sign-off CAB.',
      },
    ],
  },
  {
    id: 'dep-05',
    code: 'DEP-CDC-05',
    title: 'Rollback & Disaster Recovery',
    status: 'ACTIVE',
    statusLabel: 'Actif & Conforme',
    summary:
      'Restauration logique immédiate vers un Snapshot plateforme immuable garanti en moins de 10 secondes (MTTR).',
    sections: [
      {
        title: '1. Engagement SLA Rollback',
        content:
          'Temps maximal de retour arrière : 10.0 secondes. Déclenché en 1 clic depuis la console ou automatiquement en cas de rupture de SLO.',
      },
    ],
  },
  {
    id: 'dep-06',
    code: 'DEP-CDC-06',
    title: 'Diagnostics, Télémétrie & Audit Trail',
    status: 'ACTIVE',
    statusLabel: 'Actif & Conforme',
    summary:
      'Traçabilité cryptographique complète : nonces d’exécution, logs d’étapes, métriques de latence et audit inviolable pour conformité ISO/SOC2.',
    sections: [
      {
        title: '1. Traçabilité par TraceId',
        content:
          'Chaque commande de déploiement génère un traceId unique et un nonce d’intégrité reporté dans les logs immuables de Techzone Cloud.',
      },
    ],
  },
];

export default function DepSpecificationsView() {
  const [selectedSpec, setSelectedSpec] = useState(DEP_SPECS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const filteredSpecs = DEP_SPECS.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(`${selectedSpec.code} - ${selectedSpec.title}\n\n${selectedSpec.summary}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-DOC
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>INDEX DES CAHIERS DES CHARGES (DEP-CDC-00 À 06)</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Spécifications Normatives de Déploiement & Publication
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Référentiel officiel de la Team 4 pour la couche DEP Publication.
              Chaque spécification définit les exigences techniques, les contrats d'interface et les critères d’acceptation.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copié !' : 'Copier Référence CDC'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Spec List, Right Spec Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher spécification (ex: 03, canary)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            {filteredSpecs.map((spec) => {
              const isSelected = selectedSpec.id === spec.id;
              return (
                <div
                  key={spec.id}
                  onClick={() => setSelectedSpec(spec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-50/60 border-amber-500/80 shadow-xs ring-1 ring-amber-500/20'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-700">{spec.code}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        spec.status === 'LOCKED_V1'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {spec.statusLabel}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">{spec.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {spec.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedSpec.code}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1.5">{selectedSpec.title}</h2>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {selectedSpec.statusLabel}
              </span>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
              {selectedSpec.summary}
            </p>

            <div className="space-y-4">
              {selectedSpec.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="font-mono font-bold text-xs text-slate-800">{sec.title}</h4>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-3 border-l-2 border-amber-400">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">Team 4 • Platform, API & Deployment</span>
              <span className="font-mono text-emerald-600 font-semibold">100% Conforme aux Normes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

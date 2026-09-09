import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../store/platformSlice.js';
import {
  FileCode2,
  CheckCircle2,
  Copy,
  BookOpen,
  Code,
  Shield,
  Layers,
  Lock,
  Boxes,
  Server,
  Sliders,
  Camera,
  ArrowRight,
  ArrowDown,
  Terminal,
  Activity,
  AlertCircle,
} from 'lucide-react';

const PF_CDCS = [
  {
    id: 'pf-00',
    code: 'PF-CDC-00',
    title: 'Socle, Architecture & Platform Contract v1',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-00 (v1.0)',
    objective: 'Définir le socle commun de Techzone Cloud : architecture, contrats transverses, conventions, configuration, environnements, versioning, snapshots, sécurité, observabilité et règles d\'intégration inter-packs.',
    positioning: `PLATFORM FOUNDATION
        ↓
Platform Contract v1 🔒
        ↓
┌─────────────┬─────────────┬─────────────┐
IAM        Business      ERP/Data      Pack/Runtime

Toutes les équipes dépendent du Platform Contract, jamais des détails internes de la Team 4.`,
    responsibilities: {
      do: [
        'Définir les objets plateforme communs',
        'Gérer applications et versions',
        'Gérer environnements isolés',
        'Gérer le registre de contrats',
        'Gérer configuration plateforme typée',
        'Gérer snapshots et historique immuable',
        'Fournir conventions d\'identification, versioning et erreurs',
      ],
      dont: [
        'Ne pas recréer IAM',
        'Ne pas recréer Business Manager',
        'Ne pas exécuter les workflows métier',
        'Ne pas gérer les règles internes Pack Manager',
        'Ne pas contenir les secrets métier des autres packs',
      ],
    },
    lifecycle: 'DRAFT → VALIDATING → READY → ACTIVE / RELEASED → SUPERSEDED → DEPRECATED → ARCHIVED',
    errors: [
      'PLATFORM_APPLICATION_NOT_FOUND',
      'PLATFORM_VERSION_INVALID',
      'PLATFORM_ENVIRONMENT_NOT_FOUND',
      'PLATFORM_CONTRACT_INCOMPATIBLE',
      'PLATFORM_CONFIG_INVALID',
      'PLATFORM_SNAPSHOT_INVALID',
      'PLATFORM_PERMISSION_DENIED',
      'PLATFORM_TENANT_VIOLATION',
    ],
    acceptance: [
      'Platform Contract v1 documenté et locké',
      'Modèles communs stables',
      'Versioning explicite',
      'Environnements isolés',
      'Configuration validée',
      'Snapshots reproductibles',
      'Contract Tests PASS',
      'Aucune dépendance directe aux détails internes Team 4',
    ],
  },
  {
    id: 'pf-01',
    code: 'PF-CDC-01',
    title: 'Vue d’ensemble / Platform Cockpit',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-01',
    objective: 'Fournir une vue globale de l\'état de la plateforme, des applications, versions, environnements, contrats, configurations et snapshots.',
    positioning: 'Le cockpit permet de comprendre en moins de quelques secondes quelles applications existent, quelles versions sont actives, quels environnements existent, quels contrats sont incompatibles, quelles configurations sont invalides et quels snapshots récents sont disponibles.',
    kpis: ['Applications', 'Versions actives', 'Environnements', 'Contrats actifs', 'Configurations invalides', 'Snapshots récents', 'Warnings', 'Errors'],
    sections: ['Applications', 'Versions', 'Environnements', 'Contrats', 'Configuration', 'Snapshots', 'Activité récente', 'Alertes'],
    states: ['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'UNKNOWN'],
    endpoints: [
      'GET /api/platform/dashboard',
      'GET /api/platform/applications',
      'GET /api/platform/environments',
      'GET /api/platform/contracts',
      'GET /api/platform/snapshots',
      'GET /api/platform/activity',
    ],
    acceptance: [
      'Compréhension de l\'état de la plateforme en moins de 3 secondes',
      'Cartes KPI temps réel avec calculs déterministes',
      'Respect strict IAM et masquage des secrets',
    ],
  },
  {
    id: 'pf-02',
    code: 'PF-CDC-02',
    title: 'Applications & Versions',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-02',
    objective: 'Gérer l\'identité technique des applications et leurs versions de plateforme.',
    positioning: 'Définit l\'identité stable, le cycle de vie immuable des versions et la traçabilité des modifications.',
    model: 'id, code, name, description, status, tenantScope, createdAt, updatedAt',
    versionModel: 'id, applicationId, version, status, releaseNotes, createdFrom, createdAt, publishedAt',
    lifecycle: 'DRAFT → CONFIGURING → VALIDATING → READY → ACTIVE → SUPERSEDED → DEPRECATED → ARCHIVED',
    rules: [
      'Code application stable dans le temps',
      'Version immuable après activation si elle sert de baseline',
      'Pas de suppression physique d\'une version utilisée en production',
      'Clonage autorisé pour préparer une nouvelle version',
      'Historique et concurrency control obligatoires',
    ],
    endpoints: [
      'GET    /api/platform/applications',
      'POST   /api/platform/applications',
      'GET    /api/platform/applications/:id',
      'PATCH  /api/platform/applications/:id',
      'POST   /api/platform/applications/:id/archive',
      'GET    /api/platform/applications/:id/versions',
      'POST   /api/platform/applications/:id/versions',
      'GET    /api/platform/versions/:id',
      'PATCH  /api/platform/versions/:id',
      'POST   /api/platform/versions/:id/clone',
    ],
    acceptance: [
      'CRUD contrôlé sur les applications',
      'Versioning sémantique cohérent',
      'Lifecycle respecté sans saut d\'étapes non autorisé',
      'Version active protégée contre les modifications silencieuses',
    ],
  },
  {
    id: 'pf-03',
    code: 'PF-CDC-03',
    title: 'Environnements Techniques',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-03',
    objective: 'Gérer les environnements techniques de Techzone Cloud et leur isolation logique et sécuritaire.',
    positioning: 'Isolation stricte des environnements standards : DEVELOPMENT, TEST, STAGING, PRODUCTION.',
    model: 'id, code, name, type, status, region, baseUrl, configurationRef, createdAt, updatedAt',
    states: ['ACTIVE', 'MAINTENANCE', 'DEGRADED', 'DISABLED', 'ARCHIVED'],
    securityMatrix: [
      { env: 'DEVELOPMENT', access: 'Accès développeur autorisé (lecture/écriture)' },
      { env: 'TEST', access: 'Accès QA automation autorisé (déploiement et tests)' },
      { env: 'STAGING', access: 'Accès restreint (homologation pré-production)' },
      { env: 'PRODUCTION', access: 'Accès fortement restreint (administrateurs avec MFA et traçabilité)' },
    ],
    endpoints: [
      'GET   /api/platform/environments',
      'POST  /api/platform/environments',
      'GET   /api/platform/environments/:id',
      'PATCH /api/platform/environments/:id',
      'GET   /api/platform/environments/:id/history',
    ],
    acceptance: [
      'Environnements isolés logiquement',
      'Aucune confusion possible entre configurations TEST et PROD',
      'Protection intégrale des secrets (non exposés dans les champs publics)',
    ],
  },
  {
    id: 'pf-04',
    code: 'PF-CDC-04',
    title: 'Contrats / Contract Registry',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-04',
    objective: 'Centraliser les contrats techniques versionnés utilisés entre packs et équipes.',
    positioning: `Provider → Contract 🔒 → Consumer
Le consumer dépend du contrat, jamais de l'implémentation du provider.
Toute rupture de compatibilité nécessite une nouvelle version majeure de contrat.`,
    model: 'contractCode, contractVersion, ownerTeam, status, schema, compatibilityPolicy, publishedAt, deprecatedAt, hash',
    states: ['DRAFT', 'VALIDATING', 'LOCKED', 'ACTIVE', 'DEPRECATED', 'RETIRED'],
    endpoints: [
      'GET  /api/platform/contracts',
      'POST /api/platform/contracts',
      'GET  /api/platform/contracts/:id',
      'POST /api/platform/contracts/:id/validate',
      'POST /api/platform/contracts/:id/lock',
      'GET  /api/platform/contracts/:id/compatibility',
    ],
    acceptance: [
      'Contrats versionnés et immuables une fois LOCKED',
      'Calcul automatique de la compatibilité ascendante',
      'Détection préventive des breaking changes',
      'Génération d\'un hash canonique vérifiable',
    ],
  },
  {
    id: 'pf-05',
    code: 'PF-CDC-05',
    title: 'Configuration Manager',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-05',
    objective: 'Gérer les paramètres techniques de la plateforme de manière typée, versionnée et sécurisée.',
    positioning: `Priorité hiérarchique d'héritage :
Platform Default → Application → Application Version → Environment → Tenant Override autorisé`,
    types: ['STRING', 'NUMBER', 'BOOLEAN', 'ENUM', 'JSON', 'URL', 'DURATION'],
    model: 'key, scope, scopeId, type, value, defaultValue, required, schema, version, status',
    endpoints: [
      'GET   /api/platform/config',
      'GET   /api/platform/config/:scope/:scopeId',
      'POST  /api/platform/config',
      'PATCH /api/platform/config/:id',
      'POST  /api/platform/config/:id/validate',
      'GET   /api/platform/config/:id/history',
    ],
    acceptance: [
      'Configuration strictement typée et validée par schéma JSON',
      'Héritage et surcharge des valeurs contrôlés',
      'Aucun secret stocké en clair (référencement sécurisé par vault/secrets manager)',
    ],
  },
  {
    id: 'pf-06',
    code: 'PF-CDC-06',
    title: 'Snapshots & Historique',
    pack: 'Platform Foundation',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'PF-CDC-06',
    objective: 'Capturer des états figés et reproductibles de la plateforme afin de permettre audit, comparaison, publication et rollback logique.',
    positioning: 'Un snapshot validé doit être immuable, canonique, hashable (SHA-256 déterministe), traçable, comparable et exportable.',
    model: 'application, applicationVersion, environment, contracts, configuration, metadata, createdBy, createdAt, hash',
    comparisons: ['ADDED', 'REMOVED', 'CHANGED', 'UNCHANGED'],
    endpoints: [
      'GET  /api/platform/snapshots',
      'POST /api/platform/snapshots',
      'GET  /api/platform/snapshots/:id',
      'GET  /api/platform/snapshots/:id/history',
      'GET  /api/platform/snapshots/compare?left=:idA&right=:idB',
      'POST /api/platform/snapshots/:id/validate',
    ],
    acceptance: [
      'Snapshot immuable et hashable',
      'Comparaison différentielle entre deux instantanés',
      'Rollback logique sans altération de l\'historique',
      'Prise en charge directe par Release / Deployment',
    ],
  },
];

export default function SpecificationsView() {
  const dispatch = useDispatch();
  const [selectedCdcId, setSelectedCdcId] = useState('pf-00');

  const selectedCdc = PF_CDCS.find((c) => c.id === selectedCdcId) || PF_CDCS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                PF-CDC SÉRIE OFFICIELLE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Platform Contract v1 🔒 Verrouillé</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
              Platform Foundation — Index des CDC
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Référentiel des spécifications normatives de la <strong>Team 4 — Platform, API & Deployment</strong> (Techzone Cloud).
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-slate-400">Flux :</span>
            <span className="text-blue-600 font-bold">APP</span>
            <span className="text-slate-300">→</span>
            <span className="text-indigo-600 font-bold">VER</span>
            <span className="text-slate-300">→</span>
            <span className="text-sky-600 font-bold">ENV</span>
            <span className="text-slate-300">→</span>
            <span className="text-purple-600 font-bold">CTR</span>
            <span className="text-slate-300">→</span>
            <span className="text-amber-600 font-bold">CFG</span>
            <span className="text-slate-300">→</span>
            <span className="text-emerald-600 font-bold">SNP</span>
          </div>
        </div>
      </div>

      {/* Main Grid: CDC Navigation Sidebar + Detailed Spec Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of 7 CDCs */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Série Officielle (PF-CDC-00 à 06)
          </div>

          <div className="space-y-1.5">
            {PF_CDCS.map((cdc) => {
              const isSelected = selectedCdc.id === cdc.id;

              return (
                <button
                  key={cdc.id}
                  onClick={() => setSelectedCdcId(cdc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cdc.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{cdc.team.split('—')[0]}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1.5 truncate">
                    {cdc.title}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {cdc.objective}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Document Viewer */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            {/* Spec Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                    {selectedCdc.code}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 font-mono">{selectedCdc.ref}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedCdc.title}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Projet : <strong>Techzone Cloud</strong> • Pack : <strong>{selectedCdc.pack}</strong> • Équipe : <strong>{selectedCdc.team}</strong>
                </div>
              </div>

              <button
                onClick={() =>
                  dispatch(
                    addToast({
                      type: 'info',
                      title: `Spécification ${selectedCdc.code} copiée`,
                      message: 'Le résumé normatif est copié dans le presse-papier.',
                    })
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium self-start sm:self-center"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier les specs</span>
              </button>
            </div>

            {/* 1. Objet */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Objet & Finalité</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                {selectedCdc.objective}
              </p>
            </div>

            {/* 2. Positionnement & Architecture */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Positionnement & Découplage</span>
              </h3>
              <div className="bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-800 whitespace-pre overflow-x-auto leading-relaxed">
                {selectedCdc.positioning}
              </div>
            </div>

            {/* Responsabilités (Do vs Don't) si PF-00 */}
            {selectedCdc.responsibilities && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-900 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Le pack doit :</span>
                  </div>
                  <ul className="space-y-1 text-xs text-emerald-800">
                    {selectedCdc.responsibilities.do.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-rose-900 font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Il ne doit pas :</span>
                  </div>
                  <ul className="space-y-1 text-xs text-rose-800">
                    {selectedCdc.responsibilities.dont.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Endpoints & Contrats d'API */}
            {selectedCdc.endpoints && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-600" />
                  <span>Endpoints Backend NestJS / API Contract</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCdc.endpoints.map((ep, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 flex items-center justify-between"
                    >
                      <span>{ep}</span>
                      <span className="text-[9px] px-1 rounded bg-slate-200 text-slate-600">REST</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Contracts si PF-00 */}
            {selectedCdc.errors && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Error Contract Transverse</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedCdc.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded-md bg-rose-50 border border-rose-150 font-mono text-[11px] text-rose-800"
                    >
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critères d'acceptation */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Critères d'Acceptation & Definition of Done</span>
              </h3>
              <div className="space-y-1.5">
                {selectedCdc.acceptance.map((crit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

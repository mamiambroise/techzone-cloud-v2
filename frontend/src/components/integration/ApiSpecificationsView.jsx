import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/platformSlice.js';
import {
  FileCode2,
  CheckCircle2,
  Copy,
  BookOpen,
  Code,
  Shield,
  Layers,
  Lock,
  Network,
  Cpu,
  Webhook,
  KeyRound,
  RefreshCw,
  Activity,
  Terminal,
  AlertCircle,
  Server,
  Zap,
  Check,
} from 'lucide-react';

const API_CDCS = [
  {
    id: 'api-00',
    code: 'API-CDC-00',
    title: 'Socle, Architecture & Integration Contracts',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-00 (v1.0)',
    objective: 'Définir le socle architectural de la couche d\'intégration de Techzone Cloud : APIs, connecteurs, webhooks, credentials, synchronisations, sécurité, résilience, observabilité et contrats d\'échange.',
    positioning: `PACKS INTERNES TECHZONE CLOUD
        ↓
API / INTEGRATION LAYER
        │
        ├── API Manager
        ├── Connector Manager
        ├── Webhook Manager
        ├── Credential Provider
        ├── Synchronization Manager
        └── Integration Diagnostics
        ↓
SYSTÈMES EXTERNES`,
    responsibilities: {
      do: [
        'Exposer des APIs contrôlées et versionnées',
        'Intégrer des systèmes externes via connecteurs normalisés',
        'Envoyer et recevoir des webhooks sécurisés et signés',
        'Gérer les références de credentials sans fuite frontend',
        'Orchestrer les synchronisations (pull, push, bi-directionnel)',
        'Standardiser erreurs, sécurité et diagnostics de bout en bout',
      ],
      dont: [
        'Ne pas contourner IAM',
        'Ne pas accéder directement aux tables internes des autres packs',
        'Ne pas exposer de secrets ou clés API au frontend',
        'Ne pas recréer Data Runtime ou ERP Adapter',
        'Ne pas coupler les consommateurs aux implémentations externes directes',
      ],
    },
    contractsV1: [
      'Integration Contract (Interface générique d\'échange)',
      'Connector Contract (Configuration, health, capabilities)',
      'API Contract (OpenAPI 3.1, validation schemas, idempotency)',
      'Webhook Contract (HMAC-SHA256 signature, anti-replay)',
      'Credential Reference Contract (KMS/Vault references only)',
      'Synchronization Contract (7-step pipeline, leases, conflict policy)',
      'Integration Error Contract (9 codes normalisés)',
    ],
    providerPattern: `IntegrationProvider
├── MockIntegrationProvider (Sandbox / Tests parallèles)
└── RealIntegrationProvider (Production / Passerelles sécurisées)`,
    security: 'IAM Context, isolation stricte des tenants, scopes de granularité fine, rate limiting dynamique, validation stricte des payloads, secrets backend-only, signature cryptographique des webhooks et piste d\'audit.',
    resilience: 'Timeouts déterministes, retry contrôlé avec backoff exponentiel, circuit breaker (seuil d\'échec + reset), idempotence par clé unique, déduplication et reprise sur checkpoint.',
    errors: [
      'INTEGRATION_PROVIDER_UNAVAILABLE',
      'INTEGRATION_AUTH_FAILED',
      'INTEGRATION_TIMEOUT',
      'INTEGRATION_RATE_LIMITED',
      'INTEGRATION_PAYLOAD_INVALID',
      'INTEGRATION_CONTRACT_UNSUPPORTED',
      'WEBHOOK_SIGNATURE_FAILED',
      'SYNCHRONIZATION_CONFLICT',
      'INTERNAL_INTEGRATION_ERROR',
    ],
    acceptance: [
      'Contracts v1 documentés et scellés (LOCKED)',
      'MockIntegrationProvider et RealIntegrationProvider conformes au même contrat',
      'IAM et isolation tenant appliqués sans exception',
      'Secrets masqués et protégés (zéro fuite DOM/Redux)',
      'Politiques d\'idempotence et de retry définies',
      'Suite de Contract Tests 100% PASS',
    ],
  },
  {
    id: 'api-01',
    code: 'API-CDC-01',
    title: 'Vue d’ensemble / Integration Cockpit',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-01',
    objective: 'Donner une vue globale et temps réel de l\'état des APIs, connecteurs, webhooks, synchronisations et erreurs d\'intégration de Techzone Cloud.',
    positioning: 'Permet aux opérateurs et développeurs d\'identifier en moins de 3 secondes les flux actifs, dégradés, en échec ou nécessitant une intervention immédiate.',
    kpis: [
      'Connectors Active',
      'APIs Active',
      'Webhooks Active',
      'Synchronizations Running',
      'Success Rate (%)',
      'Failures',
      'Timeouts',
      'Attention Required',
    ],
    sections: [
      'Connecteurs actifs & état de santé',
      'APIs exposées & métriques de trafic',
      'Webhooks & délivrabilité',
      'Credentials status & rotations',
      'Synchronisations en cours & checkpoints',
      'Activité récente & timeline',
      'Erreurs d\'intégration & codes normalisés',
      'Diagnostics & traces',
    ],
    states: ['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'UNKNOWN'],
    endpoints: [
      'GET /api/integrations/dashboard',
      'GET /api/integrations/activity',
      'GET /api/integrations/health',
      'GET /api/integrations/attention',
    ],
    acceptance: [
      'Identification visuelle immédiate des incidents et anomalies',
      'Cartes KPI calculées en continu avec taux de succès déterministe',
      'Filtrage combiné par tenant, provider, état et code d\'erreur',
      'Basculement transparent entre Mock et Real Provider',
    ],
  },
  {
    id: 'api-02',
    code: 'API-CDC-02',
    title: 'Connector Manager',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-02',
    objective: 'Gérer les connecteurs normalisés permettant à Techzone Cloud de communiquer avec des systèmes externes de manière sécurisée et modulaire.',
    positioning: 'Fournit une abstraction unifiée sur les protocoles externes (ERP, passerelles de paiement, CRM, bus d\'événements).',
    model: 'id, code, name, providerType, contractVersion, status, configurationSchema, credentialRef, capabilities, health, mode',
    types: [
      'REST (APIs HTTP/JSON conventionnelles)',
      'GRAPHQL (Requêtes structurées & schémas typés)',
      'DATABASE_ADAPTER (Connecteurs SQL/NoSQL directs)',
      'FILE (SFTP, S3, stockage d\'objets)',
      'MESSAGE_QUEUE (Kafka, RabbitMQ, EventBridge)',
      'CUSTOM_PROVIDER (Fournisseur spécifique enregistré plateforme)',
    ],
    lifecycle: 'DRAFT → CONFIGURING → VALIDATING → READY → ACTIVE → DEGRADED → DISABLED → ARCHIVED',
    capabilities: ['read', 'write', 'sync', 'webhook', 'batch', 'stream'],
    rules: [
      'Configuration strictement typée et validée par schéma JSON',
      'Les secrets sont obligatoirement référencés par credentialRef, jamais renvoyés au client',
      'Health check périodique testant connectivité, authentification et latence',
      'Capacités déclarées explicitement dans le modèle',
      'Mock Connector conforme au contrat pour les tests et la sandbox',
    ],
    endpoints: [
      'GET    /api/integrations/connectors',
      'POST   /api/integrations/connectors',
      'GET    /api/integrations/connectors/:id',
      'PATCH  /api/integrations/connectors/:id',
      'POST   /api/integrations/connectors/:id/ping',
      'POST   /api/integrations/connectors/:id/status',
    ],
    acceptance: [
      'CRUD contrôlé avec validation stricte du schéma',
      'Santé (Health) testée en direct avec latence et disponibilité calculées',
      'Credential sécurisé sans fuite dans la charge utile',
      'Capacités déclarées et vérifiées avant toute exécution',
    ],
  },
  {
    id: 'api-03',
    code: 'API-CDC-03',
    title: 'API Manager',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-03',
    objective: 'Gérer l\'exposition contrôlée, la documentation, la sécurité et le versioning des APIs publiques et partenaires de Techzone Cloud.',
    positioning: 'Agit comme la passerelle de gouvernance des APIs de la plateforme.',
    model: 'apiCode, version, basePath, operations, authentication, authorization, rateLimit, requestSchema, responseSchema, status',
    lifecycle: 'DRAFT → REVIEW → PUBLISHED → DEPRECATED → RETIRED',
    security: [
      'Authentification obligatoire (Bearer Token, OAuth 2.0, mTLS)',
      'Autorisation IAM par scopes granulaires',
      'Tenant context systématiquement injecté et validé',
      'Validation bidirectionnelle des schémas d\'entrée et de sortie',
      'Rate limiting par client/tenant avec headers standardisés',
      'CORS rigoureusement configuré',
    ],
    rules: [
      'Toute rupture de compatibilité impose une incrémentation majeure de version',
      'Une API publiée ne peut être modifiée silencieusement',
      'Support natif de l\'en-tête d\'idempotence (Idempotency-Key) sur les verbes mutables',
      'Pagination standardisée sur l\'ensemble des listes de ressources',
      'Format d\'erreur unifié avec traceId, code et message sans divulgation d\'informations sensibles',
    ],
    endpoints: [
      'GET   /api/integrations/apis',
      'POST  /api/integrations/apis',
      'GET   /api/integrations/apis/:id',
      'PATCH /api/integrations/apis/:id',
      'POST  /api/integrations/apis/:id/publish',
    ],
    acceptance: [
      'APIs versionnées de manière immuable',
      'Schémas JSON validés à chaque requête',
      'Rate limiting fonctionnel avec avertissement 429',
      'Idempotence testée et garantie',
    ],
  },
  {
    id: 'api-04',
    code: 'API-CDC-04',
    title: 'Webhook Manager',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-04',
    objective: 'Gérer de manière fiable, sécurisée et asynchrone l\'émission (Outbound) et la réception (Inbound) des webhooks inter-systèmes.',
    positioning: 'Pipeline événementiel découplé assurant la traçabilité des livraisons et la protection contre le rejeu.',
    model: 'code, direction (INBOUND/OUTBOUND), event, endpoint, status, secretRef, signaturePolicy, retryPolicy, timeout, filters',
    deliveryModel: 'deliveryId, eventId, attempt, status, httpStatus, duration, nextRetryAt, traceId',
    security: [
      'HTTPS obligatoire pour tous les points de terminaison externes',
      'Signature cryptographique HMAC-SHA256 avec clé secrète rotative',
      'Protection anti-rejeu via timestamp et fenêtre glissante de 5 minutes',
      'Secrets stockés exclusivement côté backend',
      'Validation de la structure du payload avant distribution',
      'Allowlist IP optionnelle pour les flux critiques',
    ],
    resilience: [
      'Retry automatique avec backoff exponentiel (jusqu\'à 5 tentatives)',
      'Déduplication stricte des événements entrants par identifiant unique d\'événement',
      'Historique complet des tentatives conservé avec code HTTP et temps de réponse',
    ],
    endpoints: [
      'GET  /api/integrations/webhooks',
      'POST /api/integrations/webhooks',
      'GET  /api/integrations/webhooks/:id',
      'POST /api/integrations/webhooks/:id/test',
      'GET  /api/integrations/webhooks/:id/deliveries',
      'POST /api/integrations/webhooks/deliveries/:id/retry',
    ],
    acceptance: [
      'Signature HMAC validée à la réception',
      'Rejet immédiat des payloads invalides ou non authentifiés',
      'Politique de retry respectée sans blocage de file d\'attente',
      'Déduplication confirmée sur événements identiques',
    ],
  },
  {
    id: 'api-05',
    code: 'API-CDC-05',
    title: 'Credentials & Secrets Manager',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-05',
    objective: 'Fournir une gestion cryptographiquement sûre des références d\'authentification nécessaires aux intégrations externes.',
    positioning: `ARCHITECTURE SECRÈTE STRICTE :
Frontend
   ↓ (référence anonyme : cred-ref-xxx)
Credential Reference
   ↓ (interne sécurisé, mTLS / KMS)
Backend Secure Provider
   ↓ (injection dynamique en mémoire)
Secret réel externe`,
    types: [
      'API_KEY (Clé API statique / token de service)',
      'BASIC_AUTH (Nom d\'utilisateur et mot de passe chiffré)',
      'BEARER_TOKEN (Jeton d\'accès temporaire ou rafraîchissable)',
      'OAUTH_CLIENT (Client ID, Secret, Auth URL, Token URL, Scopes)',
      'CERTIFICATE_REFERENCE (Certificat X.509 / mTLS)',
      'CUSTOM_SECRET_REFERENCE (Référence vers un gestionnaire de secrets tiers)',
    ],
    model: 'id, code, type, provider, status, lastRotatedAt, expiresAt, metadataSafe',
    rules: [
      'Le frontend ne reçoit JAMAIS la valeur réelle d\'un secret',
      'Toute valeur affichée dans l\'UI est masquée par défaut (ex: ••••••••)',
      'Les journaux applicatifs (logs) ne doivent sous aucun prétexte contenir de secrets',
      'Seuls les administrateurs avec le rôle IAM approprié peuvent initier une rotation',
      'Traçabilité systématique de chaque opération dans l\'Audit Log',
    ],
    noGoCriteria: [
      'Secret visible en clair dans le frontend ou le DOM',
      'Secret présent dans les logs ou les traces d\'erreur',
      'Accès ou référencement cross-tenant sans autorisation explicite',
      'Credential accessible sans validation stricte des permissions IAM',
    ],
    acceptance: [
      'Secrets stockés de manière sécurisée côté backend uniquement',
      'Rotation des credentials fonctionnelle et auditée',
      'Cloisonnement strict par tenant validé à 100%',
    ],
  },
  {
    id: 'api-06',
    code: 'API-CDC-06',
    title: 'Synchronization Manager',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-06',
    objective: 'Orchestrer les synchronisations de données batch et temps réel entre Techzone Cloud et les systèmes distants de manière résiliente et déterministe.',
    positioning: 'Moteur d\'orchestration assurant la cohérence transactionnelle et la gestion des conflits inter-systèmes.',
    types: [
      'PULL (Extraction périodique depuis le système source)',
      'PUSH (Envoi d\'enregistrements vers le système distant)',
      'BIDIRECTIONAL (Synchronisation bidirectionnelle avec conciliation)',
      'FULL (Réinitialisation et chargement intégral du jeu de données)',
      'INCREMENTAL (Extraction des seuls deltas modifiés depuis le dernier checkpoint)',
    ],
    pipeline: `PIPELINE 7 ÉTAPES NORMALISÉ :
1. START (Initialisation du job, acquisition du bail/lease)
   ↓
2. Load Configuration (Résolution des schémas et credentials)
   ↓
3. Authenticate (Établissement du canal sécurisé)
   ↓
4. Read Source (Lecture paginée par batchs)
   ↓
5. Validate / Transform (Mapping canonique et règles d'intégrité)
   ↓
6. Write Target (Écriture avec idempotence)
   ↓
7. Checkpoint & Summary (Mise à jour du curseur et rapport final)`,
    conflictPolicies: [
      'SOURCE_WINS (La source distante prévaut toujours)',
      'TARGET_WINS (L\'état local de Techzone Cloud prévaut)',
      'NEWEST_WINS (Le timestamp le plus récent détermine la valeur finale)',
      'MANUAL_REVIEW (Mise en quarantaine et alerte opérateur)',
    ],
    states: ['PENDING', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'PAUSED', 'CANCELLED'],
    endpoints: [
      'GET  /api/integrations/sync',
      'POST /api/integrations/sync',
      'GET  /api/integrations/sync/:id',
      'POST /api/integrations/sync/:id/trigger',
      'POST /api/integrations/sync/:id/pause',
      'POST /api/integrations/sync/:id/resume',
    ],
    acceptance: [
      'Mode Full et Incremental opérationnels avec persistance du curseur',
      'Reprise transparente sur checkpoint après incident',
      'Politique de résolution de conflits déterministe sans perte silencieuse',
      'Rapport d\'exécution détaillé disponible en fin de cycle',
    ],
  },
  {
    id: 'api-07',
    code: 'API-CDC-07',
    title: 'Integration Logs & Diagnostics',
    pack: 'API / Integration Layer',
    team: 'Team 4 — Platform, API & Deployment',
    ref: 'API-CDC-07',
    objective: 'Centraliser l\'historique d\'exécution, les métriques d\'observabilité et les outils d\'investigation de la couche d\'intégration.',
    positioning: 'Socle d\'observabilité et de détection précoce des incidents d\'intégration.',
    model: 'traceId, tenantId, connector, operation, direction, startedAt, finishedAt, duration, status, errorCode, attempt',
    diagnosticTaxonomy: [
      { code: 'INTEGRATION_AUTH_FAILED', label: 'Échec d\'authentification / Credentials révoqués' },
      { code: 'INTEGRATION_PROVIDER_UNAVAILABLE', label: 'Fournisseur distant inaccessible / Réseau en panne' },
      { code: 'INTEGRATION_TIMEOUT', label: 'Délai d\'attente dépassé (Timeout contractuel)' },
      { code: 'INTEGRATION_RATE_LIMITED', label: 'Plafond de requêtes atteint (HTTP 429)' },
      { code: 'INTEGRATION_CONTRACT_UNSUPPORTED', label: 'Incompatibilité de version ou de schéma' },
      { code: 'INTEGRATION_PAYLOAD_INVALID', label: 'Charge utile non conforme au schéma validateur' },
      { code: 'WEBHOOK_SIGNATURE_FAILED', label: 'Signature HMAC invalide ou tentative de rejeu' },
      { code: 'SYNCHRONIZATION_CONFLICT', label: 'Conflit de données nécessitant arbitrage' },
      { code: 'INTERNAL_INTEGRATION_ERROR', label: 'Erreur interne imprévue du runtime d\'intégration' },
    ],
    features: [
      'Recherche avancée multicritères (période, tenant, connector, code d\'erreur, traceId)',
      'Métriques temps réel : volumétrie de requêtes, taux de succès, latence médiane (P50/P99), timeouts',
      'Masquage et caviardage (redaction) automatique de toute donnée sensible ou token',
      'Corrélation de bout en bout via identifiant unique traceId sur l\'ensemble du flux',
    ],
    acceptance: [
      'Cause racine (Root Cause) identifiable en moins de 3 clics',
      'TraceId uniforme depuis la requête initiale jusqu\'à l\'accusé de réception',
      'Filtrage rapide et précis sur de gros volumes de logs',
      'Aucun secret présent dans les logs ou les traces d\'audit',
    ],
  },
];

export default function ApiSpecificationsView() {
  const dispatch = useDispatch();
  const [selectedCdcId, setSelectedCdcId] = useState('api-00');

  const selectedCdc = API_CDCS.find((c) => c.id === selectedCdcId) || API_CDCS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs">
                API-CDC SÉRIE OFFICIELLE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Integration Contracts v1 🔒 Scellé</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
              API / Integration Layer — Index des CDC
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Spécifications normatives de la couche d'intégration — <strong>Team 4 — Platform, API & Deployment</strong> (Techzone Cloud).
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-slate-400">Flux :</span>
            <span className="text-indigo-600 font-bold">API-00</span>
            <span className="text-slate-300">→</span>
            <span className="text-blue-600 font-bold">01</span>
            <span className="text-slate-300">→</span>
            <span className="text-sky-600 font-bold">02</span>
            <span className="text-slate-300">→</span>
            <span className="text-purple-600 font-bold">03</span>
            <span className="text-slate-300">→</span>
            <span className="text-pink-600 font-bold">04</span>
            <span className="text-slate-300">→</span>
            <span className="text-amber-600 font-bold">05</span>
            <span className="text-slate-300">→</span>
            <span className="text-emerald-600 font-bold">06</span>
            <span className="text-slate-300">→</span>
            <span className="text-rose-600 font-bold">07</span>
          </div>
        </div>
      </div>

      {/* Main Grid: CDC Navigation Sidebar + Detailed Spec Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of 8 CDCs */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Série Normative (API-CDC-00 à 07)
          </div>

          <div className="space-y-1.5">
            {API_CDCS.map((cdc) => {
              const isSelected = selectedCdc.id === cdc.id;

              return (
                <button
                  key={cdc.id}
                  onClick={() => setSelectedCdcId(cdc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cdc.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Team 4</span>
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
                  <span className="text-xs font-semibold text-indigo-600 font-mono">{selectedCdc.ref}</span>
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
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Objet & Finalité</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                {selectedCdc.objective}
              </p>
            </div>

            {/* 2. Positionnement & Architecture */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Positionnement Architectural</span>
              </h3>
              <div className="bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-800 whitespace-pre overflow-x-auto leading-relaxed">
                {selectedCdc.positioning}
              </div>
            </div>

            {/* Responsabilités (Do vs Don't) si API-00 */}
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

            {/* Contrats v1 & Provider Pattern si API-00 */}
            {selectedCdc.contractsV1 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Contrats Versionnés à Sceller (v1 🔒)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCdc.contractsV1.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs font-mono text-purple-900 flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Contract si présent */}
            {selectedCdc.errors && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Error Contract Transverse (9 Codes Normalisés)</span>
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

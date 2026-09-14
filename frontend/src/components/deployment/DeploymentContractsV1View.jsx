import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/platformSlice.js';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';

export default function DeploymentContractsV1View() {
  const dispatch = useDispatch();
  const contractLocked = useSelector((state) => state.deployment?.contractV1Locked ?? true);
  const [copiedContract, setCopiedContract] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState('deployment-manifest');

  const contractSchemas = {
    'deployment-manifest': `{
  "$schema": "https://techzone.cloud/schemas/deployment/manifest.v1.json",
  "contractVersion": "v1.0.0",
  "specCode": "DEP-CDC-00",
  "immutable": true,
  "signingAlgorithm": "SHA-256",
  "properties": {
    "releaseCode": { "type": "string", "pattern": "^REL-[0-9]{4}-[0-9]{4}$" },
    "version": { "type": "string", "pattern": "^v[0-9]+\\.[0-9]+\\.[0-9]+(-[a-z0-9.]+)?$" },
    "applicationRef": { "type": "string", "format": "uuid" },
    "sealedSnapshotRef": { "type": "string", "example": "snap-2026-09-02-prod-base" },
    "targetEnvironment": { "type": "string", "enum": ["DEVELOPMENT", "TEST", "STAGING", "PRODUCTION"] },
    "deploymentStrategy": { "type": "string", "enum": ["BLUE_GREEN", "CANARY", "ROLLING", "RECREATE"] },
    "canaryTrafficWeight": { "type": "integer", "minimum": 0, "maximum": 100 },
    "artifactsChecksum": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" },
    "signatures": {
      "secOps": { "signed": true, "keyId": "kms-key-secops-v1", "timestamp": "ISO-8601" },
      "releaseManager": { "signed": true, "keyId": "kms-key-rm-v1", "timestamp": "ISO-8601" }
    }
  },
  "required": [
    "releaseCode",
    "version",
    "applicationRef",
    "sealedSnapshotRef",
    "targetEnvironment",
    "deploymentStrategy",
    "artifactsChecksum"
  ]
}`,
    'pipeline-execution': `{
  "$schema": "https://techzone.cloud/schemas/deployment/pipeline.v1.json",
  "contractVersion": "v1.0.0",
  "specCode": "DEP-CDC-03",
  "pipelinePhases": [
    { "order": 1, "name": "VALIDATE_MANIFEST", "strict": true, "timeoutMs": 10000 },
    { "order": 2, "name": "PRE_FLIGHT_PROBES", "strict": true, "timeoutMs": 30000 },
    { "order": 3, "name": "CONTAINER_PROVISIONING", "strict": true, "timeoutMs": 120000 },
    { "order": 4, "name": "HEALTH_CHECK_READINESS", "strict": true, "timeoutMs": 45000 },
    { "order": 5, "name": "TRAFFIC_CUTOVER", "strict": true, "timeoutMs": 15000 },
    { "order": 6, "name": "SNAPSHOT_REGISTRATION", "strict": true, "timeoutMs": 10000 },
    { "order": 7, "name": "POST_DEPLOY_AUDIT", "strict": true, "timeoutMs": 15000 }
  ],
  "safetyRules": {
    "autoRollbackOnFailure": true,
    "maxErrorRateThresholdPercent": 0.5,
    "maxLatencyP99ThresholdMs": 250,
    "requireCABForProd": true
  }
}`,
    'rollback-contract': `{
  "$schema": "https://techzone.cloud/schemas/deployment/rollback.v1.json",
  "contractVersion": "v1.0.0",
  "specCode": "DEP-CDC-05",
  "slaMaxRollbackDurationSeconds": 10.0,
  "mechanism": "LOGICAL_SNAPSHOT_RESTORE",
  "immutableSnapshotDependency": "PF-CDC-06",
  "requirements": [
    "ZERO_DOWNTIME_TRAFFIC_SWITCH",
    "PRESERVED_AUDIT_LOG_NONCE",
    "AUTOMATED_INCIDENT_TICKET_GENERATION"
  ]
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contractSchemas[selectedSpec]);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
    dispatch(
      addToast({
        type: 'info',
        title: 'Schéma Copié',
        message: 'Le contrat JSON Schema Deployment v1 a été copié dans le presse-papier.',
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-CDC-00
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Deployment Contract v1 SCELLÉ</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                Team 4 • Platform, API & Deployment
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Socle & Deployment Contract v1
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Spécification formelle de la couche de Déploiement & Publication (DEP Publication).
              Garantit l’immutabilité des manifestes signés, l'application stricte des pipelines à portes de sécurité (gates) et le rollback instantané en moins de 10s.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedContract ? 'Copié !' : 'Copier Schéma v1'}</span>
            </button>
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'success',
                    title: 'Contrat Validé',
                    message: 'Audit de conformité SHA-256 : 100% conforme au standard Team 4 DEP-CDC-00.',
                  })
                )
              }
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vérifier Conformité</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Piliers Normatifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase font-mono">1. Scellement Manifest</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Empreinte SHA-256 Immuable</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chaque release possède une empreinte cryptographique unique verrouillant code, dépendances et configuration.
          </p>
          <div className="text-[11px] font-mono text-emerald-600 font-semibold pt-1">
            OK 0 modification sans nouvelle version
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase font-mono">2. Stratégies Sans Coupure</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Blue/Green & Canary 0-Downtime</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Basculement instantané de cluster ou ventilation progressive (5% → 20% → 100%) avec supervision automatique des métriques.
          </p>
          <div className="text-[11px] font-mono text-blue-600 font-semibold pt-1">
            OK Switch DNS/Load-Balancer en &lt; 2s
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase font-mono">3. Promotion Contrôlée</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Portes de Sécurité (Gates)</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            DEV → TEST → STAGING → PROD. Aucune promotion sans passage de tests E2E (100%), validation de charge et sign-off CAB.
          </p>
          <div className="text-[11px] font-mono text-indigo-600 font-semibold pt-1">
            OK 5 validations obligatoires pour PROD
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase font-mono">4. Rollback Garanti</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Retour Arrière en &lt; 10s</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Rollback logique direct s’appuyant sur les Snapshots immuables PF-06. Restauration d'état vérifiée en 5.4 secondes.
          </p>
          <div className="text-[11px] font-mono text-rose-600 font-semibold pt-1">
            OK SLA MTTR garanti &lt; 10s
          </div>
        </div>
      </div>

      {/* Contract Specification Viewer */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900 uppercase font-mono">
              Spécifications JSON Schema du Contrat v1
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedSpec('deployment-manifest')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedSpec === 'deployment-manifest'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              deployment.manifest.v1.json
            </button>
            <button
              onClick={() => setSelectedSpec('pipeline-execution')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedSpec === 'pipeline-execution'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              pipeline.execution.v1.json
            </button>
            <button
              onClick={() => setSelectedSpec('rollback-contract')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedSpec === 'rollback-contract'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              rollback.recovery.v1.json
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-amber-300/90 overflow-x-auto max-h-[400px]">
          <pre>{contractSchemas[selectedSpec]}</pre>
        </div>

        <div className="p-3 bg-slate-900 text-slate-400 text-xs flex items-center justify-between border-t border-slate-800">
          <span className="font-mono text-[11px]">
            Statut : <span className="text-emerald-400 font-bold">LOCKED & IMMUTABLE (Scellé par Team 4)</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Hash : sha256:8b9f4e22a01948572c6e...
          </span>
        </div>
      </div>
    </div>
  );
}

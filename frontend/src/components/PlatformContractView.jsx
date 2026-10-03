import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ErrorContracts } from '../utils/errorContracts.js';
import { addToast } from '../store/platformSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import {
  ShieldCheck,
  Lock,
  Boxes,
  Server,
  Sliders,
  Camera,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Layers,
  ArrowDown,
  Info,
} from 'lucide-react';

export default function PlatformContractView() {
  const dispatch = useDispatch();
  const activeUser = useSelector((state) => state.platform.activeUser);

  // État réel du verrou : le backend fait foi (contrats statut LOCKED).
  const contracts = useSelector((state) => state.contracts.contracts);
  const platformContractLocked = contracts.some((contract) => contract.status === 'LOCKED') || contracts.length === 0;

  const [simulatedError, setSimulatedError] = useState(null);

  const handleSimulateError = (errKey) => {
    const err = ErrorContracts[errKey];
    setSimulatedError(err);
    dispatch(
      addToast({
        type: 'error',
        title: `Contrat d'Erreur : ${err.code}`,
        message: `${err.description} (HTTP ${err.status})`,
      })
    );
    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'ERROR_CONTRACT_TRIGGERED',
        resourceType: 'ERROR_CONTRACT',
        resourceId: err.code,
        details: `Déclenchement conforme du contrat d'erreur ${err.code} (${err.status})`,
        status: err.severity,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
              PF-CDC-00
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Socle, Architecture & Platform Contract v1</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Définition du socle commun de Techzone Cloud : architecture, contrats transverses, conventions et règles d'intégration inter-packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono font-semibold shadow-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Platform Contract v1 {platformContractLocked ? 'VERROUILLÉ' : 'OUVERT'}</span>
          </div>
        </div>
      </div>

      {/* Architectural Diagram (PF-CDC-00 Section 2) */}
      <div className="bg-slate-950 text-white p-7 rounded-3xl border border-slate-800 shadow-md space-y-6">
        <div className="max-w-2xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
            Positionnement Architectural Formel
          </span>
          <h2 className="text-base font-bold text-white mt-1 tracking-tight">
            Découplage Absolu par le Platform Contract v1
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Toutes les équipes (IAM, ERP, Automation, Business, Pack Manager) dépendent exclusivement du <strong className="text-indigo-200 font-semibold">Platform Contract</strong>,
            et jamais des détails internes de la Team 4.
          </p>
        </div>

        {/* Visual Flow diagram */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          {/* Platform Foundation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3.5 text-center shadow-md">
            <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">Émetteur</span>
            <span className="text-sm font-bold text-white tracking-wide">PLATFORM FOUNDATION (Team 4)</span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center text-indigo-400">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          {/* Locked Contract */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 border border-indigo-400/40 rounded-2xl px-8 py-4 text-center shadow-lg ring-4 ring-indigo-500/20">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-bold text-white tracking-tight font-mono">
                Platform Contract v1
              </span>
            </div>
            <span className="text-[10px] text-indigo-200 block mt-0.5">
              Contrat stable, immuable, audité et versionné
            </span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center text-indigo-400">
            <ArrowDown className="w-5 h-5" />
          </div>

          {/* Consumer packs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs font-bold text-slate-200 block">Team 1</span>
              <span className="text-[11px] text-indigo-300 font-medium">IAM & Governance</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs font-bold text-slate-200 block">Team 5</span>
              <span className="text-[11px] text-indigo-300 font-medium">Business Manager</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs font-bold text-slate-200 block">Team 2</span>
              <span className="text-[11px] text-indigo-300 font-medium">ERP & Data Platform</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs font-bold text-slate-200 block">Runtime</span>
              <span className="text-[11px] text-indigo-300 font-medium">K8s & Containers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsibilities & Non-Responsibilities (PF-CDC-00 Section 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">Le pack Platform Foundation DOIT :</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Définir les objets plateforme communs (Applications, Versions, Environnements, Snapshots).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Gérer les 4 environnements isolés (DEV, TEST, STAGING, PROD) et leurs configurations séparées.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Gérer le Registre Central de Contrats et la détection de breaking changes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Gérer la configuration typée, versionnée, validée et sans secret exposé.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Fournir des snapshots figés, reproductibles et dotés d'un hash canonique SHA-256.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-rose-600">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">Le pack Platform Foundation NE DOIT PAS :</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>Ne doit pas recréer IAM (délégué à Team 1).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>Ne doit pas recréer Business Manager (délégué à Team 5).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>Ne doit pas exécuter les workflows métier (délégué à Automation).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>Ne doit pas gérer les règles internes Pack Manager.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>Ne doit pas contenir les secrets métier des autres packs en clair dans le frontend.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Error Contract Catalog (PF-CDC-00 Section 11) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Catalogue Officiel des Contrats d'Erreur (PF-CDC-00 Section 11)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Codes d'erreurs standardisés exposés par la plateforme à l'ensemble des consommateurs.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 font-semibold">8 Erreurs Normalisées</span>
        </div>

        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(ErrorContracts).map(([key, err]) => (
              <div
                key={key}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{err.code}</span>
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                      HTTP {err.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{err.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Sévérité : {err.severity}</span>
                  <button
                    onClick={() => handleSimulateError(key)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Simuler cette erreur {'>'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Display simulated error response */}
          {simulatedError && (
            <div className="mt-4 p-5 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono space-y-1.5 border border-slate-900">
              <span className="text-indigo-400 font-bold">Réponse API Conceptuelle Platform Foundation :</span>
              <pre className="overflow-x-auto pt-1">
                {JSON.stringify(
                  {
                    success: false,
                    error: {
                      code: simulatedError.code,
                      statusCode: simulatedError.status,
                      message: simulatedError.description,
                      traceId: `trc-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

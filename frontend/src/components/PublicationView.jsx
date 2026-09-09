import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../store/platformSlice.js';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  ArrowRight,
  Rocket,
  Lock,
  FileCheck,
} from 'lucide-react';

export default function PublicationView() {
  const dispatch = useDispatch();
  const selectedAppId = useSelector((state) => state.applications.selectedAppId);
  const applications = useSelector((state) => state.applications.applications);

  const currentApp =
    applications.find((a) => a.id === selectedAppId) ||
    applications.find((a) => a.id === 'app-0003') ||
    applications[0];

  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState({
    testsPassing: true,
    manifestSealed: true,
    securityAudited: true,
    approvalsSigned: true,
    backupDone: true,
  });

  const handleLaunchPromotion = () => {
    dispatch(
      addToast({
        type: 'success',
        title: 'Promotion en Production Réussie',
        message: `La version ${currentApp.workspaceVersion || 'v1.1.0'} a été publiée avec succès sur l'environnement PRODUCTION.`,
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Publication & Déploiement
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                PIPELINE P0.1
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Homologation formelle, signature cryptographique et bascule sans coupure vers la production.
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Application cible : <span className="font-bold text-slate-900">{currentApp.name}</span> (
            {currentApp.workspaceVersion || 'v1.1.0'})
          </div>
        </div>
      </div>

      {/* Pipeline Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Étape 1 • Homologation Staging
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Validation des tests E2E</h3>
          <p className="text-xs text-slate-600">
            520/520 tests automatisés passés sur l'environnement Staging. Aucune régression critique.
          </p>
          <div className="pt-2 border-t border-slate-100 text-xs text-emerald-700 font-semibold">
            ✓ Certifié conforme par CI/CD
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Étape 2 • Scellement Manifest
            </span>
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Génération du manifeste scellé</h3>
          <p className="text-xs text-slate-600">
            Calcul de l'empreinte SHA-256 et verrouillage de tous les modules et dépendances.
          </p>
          <div className="pt-2 border-t border-slate-100 font-mono text-[11px] text-blue-700">
            SHA256: 7f8a9...b1c0 (Scellé)
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Étape 3 • Déploiement Blue/Green
            </span>
            <Rocket className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Bascule Production</h3>
          <p className="text-xs text-slate-600">
            Routage progressif du trafic (Canary 10% → 50% → 100%) avec rollback instantané.
          </p>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLaunchPromotion}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Promouvoir en Production</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ValidationView.jsx — Quality, Validation & Homologation Center (BM-CDC-08 / CDC-00)
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  FileCheck2,
  Download,
  Boxes,
  Lock,
  Flame,
  Award,
  Filter,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ValidationEngine } from '../../lib/validationEngine';
import { INITIAL_QUALITY_RULES } from '../../lib/mockData';

export function ValidationView() {
  const {
    applications,
    versions,
    dataModels,
    features,
    menus,
    configs,
    integrations,
    selectedAppId,
    setSelectedAppId,
    showToast,
    logActivity,
  } = useApp();

  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'rules' | 'certificate'
  const [rules] = useState(INITIAL_QUALITY_RULES);
  const [campaignType, setCampaignType] = useState('FULL_HOMOLOGATION');

  const selectedApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId) || applications[0];
  }, [applications, selectedAppId]);

  const appVersion = useMemo(() => {
    return versions.find((v) => v.applicationId === selectedApp?.id) || versions[0];
  }, [versions, selectedApp]);

  const validationResult = useMemo(() => {
    if (!selectedApp) return null;
    return ValidationEngine.validateApplication(selectedApp, appVersion, {
      dataModels,
      features,
      menus,
      configs,
      integrations,
    });
  }, [selectedApp, appVersion, dataModels, features, menus, configs, integrations]);

  const handleRunSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      showToast(
        validationResult?.valid
          ? `Campagne ${campaignType} validée avec succès : Score ${validationResult.completeness}%`
          : `${validationResult?.errors?.length || 0} problème(s) bloquant(s) détecté(s)`,
        validationResult?.valid ? 'success' : 'error'
      );
      logActivity({
        applicationId: selectedApp?.id,
        applicationName: selectedApp?.name,
        eventType: 'quality.campaign.run',
        action: 'QUALITY.CAMPAIGN.RUN',
        targetType: 'QUALITY_CAMPAIGN',
        targetId: campaignType,
        details: `Campagne de tests qualité exécutée sur ${selectedApp?.name}`,
      });
    }, 500);
  };

  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      standard: 'BM-CDC-08 / BM-CDC-00 Homologation V1.0',
      application: {
        id: selectedApp?.id,
        code: selectedApp?.code,
        name: selectedApp?.name,
        version: appVersion?.versionNumber,
      },
      auditTrace: validationResult?.traceId,
      overallStatus: validationResult?.status,
      complianceScore: `${validationResult?.completeness}%`,
      checks: validationResult?.checks,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-homologation-${selectedApp?.code || 'app'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Rapport de validation et homologation exporté.');
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Centre de Validation & Homologation
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              BM-CDC-08
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit de conformité des spécifications BM-CDC-00 à BM-CDC-08, tests d'intégrité et certificat de publication.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target App Switcher */}
          <select
            value={selectedApp?.id || ''}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
          >
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (v{a.publishedVersionNumber || a.currentVersionNumber || '1.0.0'})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Rapport JSON</span>
          </button>

          <button
            onClick={handleRunSuite}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Analyse en cours...' : 'Exécuter la campagne'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Statut Homologation
          </span>
          <div className="mt-2 flex items-center gap-2">
            {validationResult?.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-black text-emerald-700">CERTIFIÉ CONFORME</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span className="text-xl font-black text-rose-700">BLOQUÉ ({validationResult?.errors?.length})</span>
              </>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Score de Complétude
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{validationResult?.completeness || 100}%</span>
            <span className="text-xs font-bold text-emerald-600">
              {validationResult?.summary?.passed}/{validationResult?.summary?.total} passés
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Règles Qualité CDC
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">{rules.length}</span>
            <span className="text-xs text-slate-400 font-semibold">règles auditées</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Trace d'Audit
          </span>
          <div className="mt-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-mono font-bold text-slate-700 truncate">
              {validationResult?.traceId || 'trace-active'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Rapports de Contrôles CDC</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Matrice des Règles Qualité</span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'certificate'
              ? 'border-slate-900 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Certificat d'Homologation</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Campagne active :</span>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="FULL_HOMOLOGATION">Homologation Complète (BM-CDC-00 à 08)</option>
                <option value="SECURITY_INTEGRITY">Audit Sécurité & Secrets</option>
                <option value="SEMVER_REGRESSION">Test de Non-Régression SemVer</option>
              </select>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Validé à : {new Date(validationResult?.validatedAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            {validationResult?.checks?.map((check, idx) => {
              const isPass = check.status === 'PASS';
              const isWarn = check.status === 'WARNING';
              return (
                <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isPass
                          ? 'bg-emerald-100 text-emerald-700'
                          : isWarn
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isPass ? (
                        <Check className="w-4 h-4" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{check.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                          {check.cdc}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{check.message}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                      isPass
                        ? 'bg-emerald-100 text-emerald-800'
                        : isWarn
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Rules Matrix */}
      {activeTab === 'rules' && (
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700">Code & Spécification</th>
                <th className="px-4 py-3 font-bold text-slate-700">Désignation</th>
                <th className="px-4 py-3 font-bold text-slate-700">Sévérité</th>
                <th className="px-4 py-3 font-bold text-slate-700">Catégorie</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-400">{r.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        r.severity === 'BLOCKING' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{r.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Official Certificate */}
      {activeTab === 'certificate' && (
        <div className="p-8 rounded-2xl bg-white border-2 border-emerald-500/60 shadow-xl space-y-6 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              RÉPUBLIQUE DU CLOUD TECHZONE — HOMOLOGATION OFFICIELLE
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Certificat de Qualification & Publication
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              L'application <strong>{selectedApp?.name}</strong> (#{selectedApp?.code}) version{' '}
              <strong>v{appVersion?.versionNumber}</strong> a passé avec succès tous les tests de conformité
              architecturale et de sécurité (BM-CDC-00 à BM-CDC-08).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 text-left text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Trace ID</span>
              <span className="font-mono font-bold text-slate-800 truncate block">
                {validationResult?.traceId || 'TRC-9720'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Score Qualité</span>
              <span className="font-black text-emerald-600">{validationResult?.completeness}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Date Scellée</span>
              <span className="font-medium text-slate-800">{new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportReport}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Certificat Officiel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

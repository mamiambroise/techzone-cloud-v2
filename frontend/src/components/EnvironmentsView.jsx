import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedEnvId,
  setEnvironmentStatus,
  deployAppVersion,
} from '../store/environmentsSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast, setSearchQuery } from '../store/platformSlice.js';
import {
  Server,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Clock,
  History,
  Send,
  Layers,
  Info,
  Filter,
  X,
  Search,
} from 'lucide-react';

export default function EnvironmentsView() {
  const dispatch = useDispatch();

  const environments = useSelector((state) => state.environments.environments);
  const selectedEnvId = useSelector((state) => state.environments.selectedEnvId);
  const applications = useSelector((state) => state.applications.applications);
  const versions = useSelector((state) => state.applications.versions);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const searchQuery = useSelector((state) => state.platform.searchQuery);

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployAppId, setDeployAppId] = useState(applications[0]?.id || '');
  const [deployVersionId, setDeployVersionId] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');

  // Filter environments according to the global search query
  const filteredEnvironments = environments.filter((env) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesEnv =
      env.code.toLowerCase().includes(q) ||
      env.name.toLowerCase().includes(q) ||
      env.region.toLowerCase().includes(q) ||
      env.baseUrl.toLowerCase().includes(q) ||
      env.securityTier.toLowerCase().includes(q) ||
      env.type.toLowerCase().includes(q);
    const matchesDeployedApp = env.deployedApps?.some(
      (da) =>
        da.appCode.toLowerCase().includes(q) ||
        da.versionNumber.toLowerCase().includes(q)
    );
    return matchesEnv || matchesDeployedApp;
  });

  const currentEnv =
    filteredEnvironments.find((e) => e.id === selectedEnvId) ||
    environments.find((e) => e.id === selectedEnvId) ||
    filteredEnvironments[0] ||
    environments[0];
  const appVersions = versions.filter((v) => v.applicationId === deployAppId && v.status !== 'ARCHIVED');

  const handleDeploy = (e) => {
    e.preventDefault();
    const app = applications.find((a) => a.id === deployAppId);
    const ver = versions.find((v) => v.id === deployVersionId);
    if (!app || !ver) return;

    // Security Matrix check (PF-CDC-03 Section 6)
    if (currentEnv.code === 'PRODUCTION' && !activeUser.canWriteProd) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Violation de Sécurité (PLATFORM_PERMISSION_DENIED)',
          message: `L'environnement PRODUCTION exige le rôle PLATFORM_SUPER_ADMIN. (${activeUser.role} non autorisé)`,
        })
      );
      dispatch(
        logAuditAction({
          actor: activeUser.email,
          role: activeUser.role,
          action: 'DEPLOY_DENIED_PRODUCTION',
          resourceType: 'ENVIRONMENT',
          resourceId: currentEnv.code,
          details: `Tentative non autorisée de déploiement de ${app.code} v${ver.version} sur PRODUCTION.`,
          status: 'DENIED',
        })
      );
      return;
    }

    if (currentEnv.code === 'TEST' && activeUser.role === 'SECURITY_AUDITOR') {
      dispatch(
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Le profil Auditeur est restreint en lecture seule.',
        })
      );
      return;
    }

    dispatch(
      deployAppVersion({
        envId: currentEnv.id,
        appId: app.id,
        appCode: app.code,
        versionId: ver.id,
        versionNumber: ver.version,
        user: activeUser.email,
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: `Déploiement réussi sur ${currentEnv.code}`,
        message: `${app.name} est maintenant déployé en version v${ver.version}.`,
      })
    );

    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'DEPLOY_APP_VERSION',
        resourceType: 'ENVIRONMENT',
        resourceId: currentEnv.code,
        details: `Déploiement validé de ${app.code} v${ver.version} sur ${currentEnv.code}`,
        status: 'SUCCESS',
      })
    );

    setShowDeployModal(false);
  };

  const handleToggleMaintenance = () => {
    if (currentEnv.code === 'PRODUCTION' && activeUser.role !== 'PLATFORM_SUPER_ADMIN') {
      dispatch(
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seul un Super Admin peut basculer la PRODUCTION en maintenance.',
        })
      );
      return;
    }

    const nextStatus = currentEnv.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
    dispatch(
      setEnvironmentStatus({
        envId: currentEnv.id,
        status: nextStatus,
        reason: maintenanceReason || 'Intervention programmée Platform Foundation',
        user: activeUser.email,
      })
    );

    dispatch(
      addToast({
        type: nextStatus === 'MAINTENANCE' ? 'warning' : 'success',
        title: `Statut ${currentEnv.code} modifié`,
        message: `L'environnement est maintenant ${nextStatus}.`,
      })
    );

    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'TOGGLE_MAINTENANCE',
        resourceType: 'ENVIRONMENT',
        resourceId: currentEnv.code,
        details: `Passage de ${currentEnv.code} en ${nextStatus}. Motif: ${maintenanceReason || 'N/A'}`,
        status: 'SUCCESS',
      })
    );

    setShowMaintenanceModal(false);
    setMaintenanceReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80">
              PF-CDC-03
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Environnements & Isolation Technique</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Cloisonnement strict des configurations entre DEV, TEST, STAGING et PRODUCTION avec contrôle d'accès IAM renforcé.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (applications.length > 0) {
                setDeployAppId(applications[0].id);
                const firstVer = versions.find((v) => v.applicationId === applications[0].id);
                setDeployVersionId(firstVer?.id || '');
              }
              setShowDeployModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Déployer vers {currentEnv.code}</span>
          </button>
        </div>
      </div>

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-sky-50/90 border border-sky-200/90 rounded-2xl text-xs text-sky-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredEnvironments.length} environnement(s) trouvé(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* 4 Standard Environments Bento Grid (PF-CDC-03 Section 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredEnvironments.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
            <Search className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs">
              Aucun environnement ne correspond au filtre « <strong>{searchQuery}</strong> ».
            </p>
            <button
              onClick={() => dispatch(setSearchQuery(''))}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition-colors"
            >
              Effacer le filtre
            </button>
          </div>
        ) : (
          filteredEnvironments.map((env) => {
            const isSelected = env.id === currentEnv.id;
            const statusBadge = {
              ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              MAINTENANCE: 'bg-amber-50 text-amber-800 border-amber-300',
              DEGRADED: 'bg-rose-50 text-rose-700 border-rose-200',
            }[env.status] || 'bg-slate-100 text-slate-600';

            const tierBg = {
              LOW: 'text-slate-600 bg-slate-100',
              MEDIUM: 'text-blue-700 bg-blue-50 border-blue-200',
              HIGH: 'text-amber-800 bg-amber-50 border-amber-200',
              CRITICAL: 'text-rose-800 bg-rose-50 border-rose-200 font-bold',
            }[env.securityTier];

            return (
              <div
                key={env.id}
                onClick={() => dispatch(setSelectedEnvId(env.id))}
                className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-50/50 border-sky-300 ring-2 ring-sky-500/10 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{env.code}</span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                      {env.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono mb-3">{env.region}</div>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 truncate font-mono">
                    {env.baseUrl}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Applications :</span>
                    <span className="font-semibold text-slate-800">{env.deployedApps?.length || 0} modules</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Niveau Sécurité :</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono font-semibold ${tierBg}`}>
                      {env.securityTier}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Environment Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Deployed Applications Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <Server className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Applications Déployées sur {currentEnv.name}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{currentEnv.accessRule}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMaintenanceModal(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                currentEnv.status === 'MAINTENANCE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {currentEnv.status === 'MAINTENANCE' ? 'Désactiver Maintenance' : 'Passer en Maintenance'}
            </button>
          </div>

          <div className="px-6 pb-5 flex-1">
            <div className="divide-y divide-slate-100">
              {currentEnv.deployedApps && currentEnv.deployedApps.length > 0 ? (
                currentEnv.deployedApps.map((dep) => (
                  <div key={dep.appId} className="py-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>{dep.appCode}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          v{dep.versionNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Déployé le : {new Date(dep.deployedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>En ligne</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Aucune application déployée sur cet environnement.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Security Matrix & Environment History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Security Matrix Card (PF-CDC-03 Section 6) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Matrice d'Accès IAM — {currentEnv.code}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{currentEnv.accessRule}</p>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] text-slate-400 font-mono font-medium block">Rôles autorisés pour actions d'écriture :</span>
              {currentEnv.allowedRoles.map((role) => (
                <div key={role} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px] font-medium">{role}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Votre profil actuel :</span>
              <div className="font-mono font-bold text-indigo-900 mt-0.5">{activeUser.role}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {currentEnv.code === 'PRODUCTION' && !activeUser.canWriteProd ? (
                  <span className="text-rose-600 font-semibold">Lecture seule (écriture restreinte à Admin)</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Droits d'opération valides</span>
                )}
              </div>
            </div>
          </div>

          {/* Environment Deploy History Log */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Journal des Déploiements ({currentEnv.code})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {currentEnv.history && currentEnv.history.length > 0 ? (
                currentEnv.history.map((h) => (
                  <div key={h.id} className="text-xs border-l-2 border-sky-400 pl-3 py-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-medium text-slate-600">{h.user}</span>
                      <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="font-semibold text-slate-800">{h.details}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-4">Historique vierge.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Déployer sur {currentEnv.code}
              </h3>
            </div>

            {currentEnv.code === 'PRODUCTION' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Avertissement Haute Criticité</span>
                </div>
                <p>
                  Le déploiement en PRODUCTION affecte le trafic réel. Assurez-vous d'avoir testé sur STAGING et d'avoir un snapshot de baseline.
                </p>
              </div>
            )}

            <form onSubmit={handleDeploy} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner l'Application</label>
                <select
                  value={deployAppId}
                  onChange={(e) => {
                    setDeployAppId(e.target.value);
                    const matching = versions.find((v) => v.applicationId === e.target.value);
                    setDeployVersionId(matching?.id || '');
                  }}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                >
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner la Version</label>
                <select
                  value={deployVersionId}
                  onChange={(e) => setDeployVersionId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono"
                >
                  {appVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} — Statut: {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Valider le déploiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              Modifier le statut de maintenance ({currentEnv.code})
            </h3>
            <p className="text-xs text-slate-500">
              Veuillez spécifier la raison de ce changement de mode opérationnel pour traçabilité d'audit.
            </p>
            <textarea
              rows={3}
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              placeholder="Ex: Mise à jour infrastructure réseau ou redémarrage planifié..."
              className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleToggleMaintenance}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

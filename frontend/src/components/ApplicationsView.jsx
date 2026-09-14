import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedAppId,
  addApplication,
  updateApplication,
  archiveApplication,
  addVersion,
  updateVersionStatus,
  cloneVersion,
  fetchApplicationsAsync,
  addApplicationAsync,
  updateApplicationAsync,
  archiveApplicationAsync,
} from '../store/applicationsSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast, setSearchQuery } from '../store/platformSlice.js';
import {
  Boxes,
  Plus,
  Copy,
  GitCompare,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  ExternalLink,
  ChevronRight,
  Tag,
  Info,
  Filter,
  X,
  Search,
} from 'lucide-react';

export default function ApplicationsView({ onOpenNewAppModal, onOpenCreateApp }) {
  const dispatch = useDispatch();
  const handleOpenCreateApp = onOpenCreateApp || onOpenNewAppModal;

  const applications = useSelector((state) => state.applications.applications);
  const versions = useSelector((state) => state.applications.versions);
  const selectedAppId = useSelector((state) => state.applications.selectedAppId);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const activeTenant = useSelector((state) => state.platform.activeTenant);
  const providerMode = useSelector((state) => state.platform.providerMode);

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchApplicationsAsync());
    }
  }, [dispatch, providerMode]);

  // Local state for modals & forms
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetVersion, setCloneTargetVersion] = useState(null);
  const [newVersionInput, setNewVersionInput] = useState('');
  const [newReleaseNotes, setNewReleaseNotes] = useState('');

  // Version Comparison modal state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareLeftVerId, setCompareLeftVerId] = useState('');
  const [compareRightVerId, setCompareRightVerId] = useState('');

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(q) ||
      app.code.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      (app.tags && app.tags.some((t) => t.toLowerCase().includes(q)));
    const matchesTenant =
      activeTenant === 'all' || app.tenantScope === activeTenant || app.tenantScope === 'tenant-core-global';
    return matchesSearch && matchesTenant;
  });

  const currentApp = applications.find((a) => a.id === selectedAppId) || filteredApps[0] || applications[0];
  const currentVersions = versions.filter((v) => v.applicationId === currentApp?.id);

  // Status progression map
  const getNextStatus = (current) => {
    const idx = VERSION_LIFECYCLE.indexOf(current);
    if (idx !== -1 && idx < VERSION_LIFECYCLE.length - 1) {
      return VERSION_LIFECYCLE[idx + 1];
    }
    return null;
  };

  const handleStatusChange = (ver, newStatus) => {
    // Permission check for promoting to ACTIVE
    if (newStatus === 'ACTIVE' && activeUser.role === 'SECURITY_AUDITOR') {
      dispatch(
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Le rôle Auditeur ne peut pas promouvoir une version en ACTIVE.',
        })
      );
      return;
    }

    dispatch(updateVersionStatus({ versionId: ver.id, newStatus }));
    dispatch(
      addToast({
        type: 'success',
        title: `Cycle de vie mis à jour : ${newStatus}`,
        message: `La version ${ver.version} est désormais à l'état ${newStatus}.`,
      })
    );
    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'UPDATE_VERSION_LIFECYCLE',
        resourceType: 'APPLICATION_VERSION',
        resourceId: ver.id,
        details: `Changement de statut pour ${currentApp.code} v${ver.version}: ${ver.status} -> ${newStatus}`,
        status: 'SUCCESS',
      })
    );
  };

  const handleExecuteClone = (e) => {
    e.preventDefault();
    if (!newVersionInput.trim()) return;

    dispatch(
      cloneVersion({
        sourceVersionId: cloneTargetVersion.id,
        newVersionNumber: newVersionInput.trim(),
        releaseNotes: newReleaseNotes.trim(),
      })
    );
    dispatch(
      addToast({
        type: 'success',
        title: 'Version clonée avec succès',
        message: `Nouvelle version ${newVersionInput} créée en statut DRAFT.`,
      })
    );
    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'CLONE_VERSION',
        resourceType: 'APPLICATION_VERSION',
        resourceId: cloneTargetVersion.id,
        details: `Clonage de v${cloneTargetVersion.version} vers v${newVersionInput}`,
        status: 'SUCCESS',
      })
    );
    setShowCloneModal(false);
    setNewVersionInput('');
    setNewReleaseNotes('');
  };

  const handleCreateNewVersion = (e) => {
    e.preventDefault();
    if (!newVersionInput.trim()) return;

    dispatch(
      addVersion({
        applicationId: currentApp.id,
        version: newVersionInput.trim(),
        status: 'DRAFT',
        releaseNotes: newReleaseNotes.trim() || 'Notes de version initiale.',
        createdFrom: null,
        contractsUsed: ['PF-CONTR-001@1.0.0'],
      })
    );
    dispatch(
      addToast({
        type: 'success',
        title: 'Nouvelle version créée',
        message: `Version ${newVersionInput} initialisée en DRAFT.`,
      })
    );
    setShowNewVersionModal(false);
    setNewVersionInput('');
    setNewReleaseNotes('');
  };

  const statusBadges = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
    CONFIGURING: 'bg-blue-50 text-blue-700 border-blue-200',
    VALIDATING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    READY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    SUPERSEDED: 'bg-amber-50 text-amber-700 border-amber-200',
    DEPRECATED: 'bg-orange-50 text-orange-700 border-orange-200',
    ARCHIVED: 'bg-slate-100 text-slate-400 border-slate-200 line-through',
  };

  return (
    <div className="space-y-6">
      {/* Header with description in Bento Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              PF-CDC-02
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Applications & Versions de Plateforme</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Gestion de l'identité technique, du cycle de vie des versions (DRAFT → ACTIVE → ARCHIVED) et immutabilité des versions déployées.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (currentVersions.length >= 2) {
                setCompareLeftVerId(currentVersions[1]?.id || currentVersions[0]?.id);
                setCompareRightVerId(currentVersions[0]?.id);
                setShowCompareModal(true);
              } else {
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Comparaison impossible',
                    message: 'Il faut au minimum 2 versions pour lancer la comparaison.',
                  })
                );
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all active:scale-95"
          >
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <span>Comparer Versions</span>
          </button>
          <button
            onClick={handleOpenCreateApp}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Application</span>
          </button>
        </div>
      </div>

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl text-xs text-indigo-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredApps.length} application(s) trouvée(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Main Layout: Left Apps Sidebar, Right Version Lifecycle Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Applications List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Applications Enregistrées ({filteredApps.length})
          </div>

          <div className="space-y-2.5">
            {filteredApps.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <Search className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs">Aucune application ne correspond à « {searchQuery} ».</p>
                <button
                  onClick={() => dispatch(setSearchQuery(''))}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700"
                >
                  Effacer le filtre
                </button>
              </div>
            ) : (
              filteredApps.map((app) => {
              const isSelected = app.id === currentApp?.id;
              const appVersions = versions.filter((v) => v.applicationId === app.id);
              const activeVer = appVersions.find((v) => v.status === 'ACTIVE');

              return (
                <div
                  key={app.id}
                  onClick={() => dispatch(setSelectedAppId(app.id))}
                  className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{app.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold inline-block mt-1">
                        {app.code}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{app.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      Active: <strong className="text-indigo-600 font-semibold">{activeVer ? `v${activeVer.version}` : 'N/A'}</strong>
                    </span>
                    <span className="text-slate-400 font-medium">{appVersions.length} versions</span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right: Selected Application Details & Versions Lifecycle */}
        <div className="lg:col-span-8 space-y-6">
          {currentApp ? (
            <>
              {/* App Overview Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{currentApp.name}</h2>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                        {currentApp.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{currentApp.description}</p>
                  </div>

                  <button
                    onClick={() => setShowNewVersionModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 transition-all shrink-0 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer une Version</span>
                  </button>
                </div>

                {/* Metadata Bento Compartments */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">ID Technique</span>
                    <span className="font-mono font-semibold text-slate-800 text-[11px] truncate block mt-0.5">{currentApp.id}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Périmètre Tenant</span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate block mt-0.5">{currentApp.tenantScope}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Créée le</span>
                    <span className="text-slate-700 text-[11px] block mt-0.5">{new Date(currentApp.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Statut</span>
                    <span className="font-semibold text-emerald-700 text-[11px] block mt-0.5">{currentApp.status}</span>
                  </div>
                </div>
              </div>

              {/* Versions Lifecycle Stepper & Table (PF-CDC-02 Section 4) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Cycle de Vie des Versions ({currentVersions.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    Modèle explicite : DRAFT → VALIDATING → ACTIVE → ARCHIVED
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {currentVersions.map((ver) => {
                    const nextSt = getNextStatus(ver.status);
                    const isImmutableActive = ver.status === 'ACTIVE';

                    return (
                      <div key={ver.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              v{ver.version}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadges[ver.status] || 'bg-slate-100'}`}>
                              {ver.status}
                            </span>
                            {ver.createdFrom && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                (depuis {ver.createdFrom.split('-').pop()})
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Lifecycle Advancement & Clone */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {nextSt && ver.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleStatusChange(ver, nextSt)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                                title={`Avancer vers ${nextSt}`}
                              >
                                <span>Avancer : {nextSt}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {ver.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(ver, 'SUPERSEDED')}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors"
                              >
                                Marquer SUPERSEDED
                              </button>
                            )}

                            {/* Clone action (PF-CDC-02 Section 5) */}
                            <button
                              onClick={() => {
                                setCloneTargetVersion(ver);
                                setNewVersionInput(ver.version + '-clone');
                                setShowCloneModal(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Cloner cette version pour préparer une nouvelle release DRAFT"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Cloner</span>
                            </button>
                          </div>
                        </div>

                        {/* Release notes & contracts */}
                        <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                          <p>{ver.releaseNotes}</p>
                          {ver.contractsUsed && ver.contractsUsed.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">Contrats liés :</span>
                              {ver.contractsUsed.map((c) => (
                                <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-indigo-100">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>Créée : {new Date(ver.createdAt).toLocaleString()}</span>
                          {ver.publishedAt && <span>Publiée : {new Date(ver.publishedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              Aucune application sélectionnée.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Version */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              Créer une nouvelle version pour {currentApp?.name}
            </h3>
            <form onSubmit={handleCreateNewVersion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro de version (SemVer)</label>
                <input
                  type="text"
                  required
                  value={newVersionInput}
                  onChange={(e) => setNewVersionInput(e.target.value)}
                  placeholder="ex: 1.3.0 ou 2.0.0-rc1"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes de version (Release Notes)</label>
                <textarea
                  rows={3}
                  value={newReleaseNotes}
                  onChange={(e) => setNewReleaseNotes(e.target.value)}
                  placeholder="Détail des fonctionnalités, corrections et contrats intégrés..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Créer la version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Clone Version (PF-CDC-02 Section 6) */}
      {showCloneModal && cloneTargetVersion && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Cloner la version v{cloneTargetVersion.version}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Le clonage duplique les contrats et prépare une nouvelle itération en statut <strong>DRAFT</strong> sans modifier la version source.
            </p>
            <form onSubmit={handleExecuteClone} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau numéro de version</label>
                <input
                  type="text"
                  required
                  value={newVersionInput}
                  onChange={(e) => setNewVersionInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes de version pour la copie</label>
                <textarea
                  rows={3}
                  value={newReleaseNotes}
                  onChange={(e) => setNewReleaseNotes(e.target.value)}
                  placeholder={`Cloné depuis ${cloneTargetVersion.version}...`}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Cloner vers DRAFT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Version Side-by-Side Comparison (PF-CDC-02 Section 6) */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Comparaison de Versions — {currentApp?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fermer
              </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Version A (Base)</label>
                <select
                  value={compareLeftVerId}
                  onChange={(e) => setCompareLeftVerId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono"
                >
                  {currentVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} ({v.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Version B (Cible)</label>
                <select
                  value={compareRightVerId}
                  onChange={(e) => setCompareRightVerId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono"
                >
                  {currentVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} ({v.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side comparison cards */}
            {(() => {
              const vA = currentVersions.find((v) => v.id === compareLeftVerId);
              const vB = currentVersions.find((v) => v.id === compareRightVerId);
              if (!vA || !vB) return null;

              return (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="font-mono font-bold text-sm text-slate-900">v{vA.version}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${statusBadges[vA.status]}`}>
                      {vA.status}
                    </span>
                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <strong>Release Notes :</strong>
                      <p className="mt-1">{vA.releaseNotes}</p>
                    </div>
                    <div className="text-xs text-slate-500 pt-2 font-mono">
                      Contrats : {vA.contractsUsed?.join(', ') || 'Aucun'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2">
                    <div className="font-mono font-bold text-sm text-indigo-950">v{vB.version}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${statusBadges[vB.status]}`}>
                      {vB.status}
                    </span>
                    <div className="text-xs text-slate-600 pt-2 border-t border-indigo-200">
                      <strong>Release Notes :</strong>
                      <p className="mt-1">{vB.releaseNotes}</p>
                    </div>
                    <div className="text-xs text-slate-500 pt-2 font-mono">
                      Contrats : {vB.contractsUsed?.join(', ') || 'Aucun'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

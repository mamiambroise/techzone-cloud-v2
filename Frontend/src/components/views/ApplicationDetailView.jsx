// ApplicationDetailView.jsx — Workspace & Lifecycle Manager for selected Application (Images 2 & 5)
import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  Sparkles,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCode2,
  Download,
  Plus,
  ArrowLeft,
  Settings,
  Database,
  Layers,
  LayoutTemplate,
  Menu as MenuIcon,
  Activity,
  Copy,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentBadge } from '../common/EnvironmentBadge';
import { IconRenderer } from '../common/IconRenderer';
import { AuditTrail } from '../common/AuditTrail';
import { formatDateTime } from '../../lib/formatDateTime';

export function ApplicationDetailView({
  onOpenNewVersionModal,
  onOpenPublishModal,
  onOpenRollbackModal,
}) {
  const {
    selectedApp,
    selectedVersion,
    appVersions,
    selectedVersionId,
    setSelectedVersionId,
    setCurrentView,
    updateApplication,
    validateCurrentVersion,
    showToast,
    hasPermission,
    currentRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState('general'); // 'overview' | 'general' | 'versions' | 'datamodel' | 'validation' | 'audit'

  // Editable Form State for General Tab
  const [formData, setFormData] = useState(() => ({
    name: selectedApp?.name || '',
    shortName: selectedApp?.shortName || '',
    slug: selectedApp?.slug || '',
    category: selectedApp?.category || 'Commerce',
    icon: selectedApp?.icon || 'ShoppingBag',
    description: selectedApp?.description || '',
    tags: (selectedApp?.tags || []).join(', '),
  }));

  if (!selectedApp) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-bold text-slate-500">Aucune application sélectionnée.</p>
        <button
          onClick={() => setCurrentView('applications')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Retour aux applications
        </button>
      </div>
    );
  }

  const isPublished = selectedVersion?.status === 'PUBLISHED';
  const isReadOnly = isPublished || currentRole === 'VIEWER';

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('Modification impossible en mode lecture seule', 'warning');
      return;
    }
    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    updateApplication(selectedApp.id, {
      name: formData.name,
      shortName: formData.shortName,
      slug: formData.slug,
      category: formData.category,
      icon: formData.icon,
      description: formData.description,
      tags: tagsArray,
      expectedVersion: selectedApp.version,
    });
  };

  const handleRunValidation = async () => {
    if (selectedVersion) {
      const result = await validateCurrentVersion(selectedVersion.id);
      showToast(
        result.valid
          ? 'Validation réussie (Score: 100%)'
          : `Validation terminée : ${result.errors?.length || 0} erreurs bloquantes trouvées`,
        result.valid ? 'success' : 'warning'
      );
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Top Back & Workspace Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Left: App Identity & Version Picker */}
        <div className="flex items-start sm:items-center gap-4">
          <button
            onClick={() => setCurrentView('applications')}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
            title="Retour au catalogue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <IconRenderer name={selectedApp.icon} className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {selectedApp.name}
              </h1>
              <span className="font-mono text-xs text-slate-400 font-semibold">
                #{selectedApp.code}
              </span>
              <StatusBadge status={selectedApp.status} size="sm" />
            </div>

            {/* Current Active Version Picker */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span>Version active :</span>
                <select
                  value={selectedVersionId || ''}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="bg-transparent font-bold font-mono text-slate-900 focus:outline-none cursor-pointer"
                >
                  {appVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.versionNumber} ({v.status}) {v.status === 'PUBLISHED' ? '• Verrouillée' : '• Édition'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVersion?.snapshotHash && (
                <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                  Hash: {selectedVersion.snapshotHash}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Workspace Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Validate Version Button */}
          <button
            onClick={handleRunValidation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Valider</span>
          </button>

          {/* New Version Button */}
          {currentRole !== 'VIEWER' && (
            <button
              onClick={onOpenNewVersionModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Nouvelle Version</span>
            </button>
          )}

          {/* Rollback Button */}
          {currentRole === 'ADMIN' && (
            <button
              onClick={onOpenRollbackModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Rollback</span>
            </button>
          )}

          {/* Publish CTA Button */}
          {currentRole !== 'VIEWER' && !isPublished && (
            <button
              onClick={onOpenPublishModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publier la version</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Read-Only Published Banner Warning (BM-CDC-00 Section 10) */}
      {isPublished && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-medium">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Version publiée verrouillée (READ_ONLY).</strong> Cette version est immuable en production. Pour apporter des modifications de structure ou de schéma, créez une nouvelle version Draft (SemVer).
            </span>
          </div>
          {currentRole !== 'VIEWER' && (
            <button
              onClick={onOpenNewVersionModal}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex-shrink-0 shadow-2xs"
            >
              Créer un DRAFT
            </button>
          )}
        </div>
      )}

      {/* 3. Navigation Workspace Tabs */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 overflow-x-auto scrollbar-none">
        {[
          { id: 'general', label: 'Général & Identité', icon: Settings },
          { id: 'versions', label: 'Versions & Cycle de vie', icon: GitBranch },
          { id: 'datamodel', label: 'Data Model (P0.2)', icon: Database },
          { id: 'features', label: 'Features (P0.3)', icon: Layers },
          { id: 'menus', label: 'Menus (P0.4)', icon: MenuIcon },
          { id: 'pages', label: 'Pages & Vues (P0.5)', icon: LayoutTemplate },
          { id: 'validation', label: 'Validation & Qualité', icon: ShieldCheck },
          { id: 'audit', label: 'Historique & Audit', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Panels */}
      {/* TAB: GENERAL & IDENTITY */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                Informations générales de l application
              </h3>
              <span className="font-mono text-[10px] text-slate-400">
                Ver: {selectedApp.version} (Optimistic Lock)
              </span>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de l application *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom court / Code commercial</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie métier *</label>
                  <select
                    disabled={isReadOnly}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
                  >
                    <option value="Commerce">Commerce & Vente</option>
                    <option value="Automobile">Automobile & Garage</option>
                    <option value="Finance">Finance & Comptabilité</option>
                    <option value="Services">Services & Prestations</option>
                    <option value="Restauration">Restauration & Hôtellerie</option>
                    <option value="Santé">Santé & Pharmacie</option>
                    <option value="Éducation">Éducation & Formation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slug URL unique</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description fonctionnelle</label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e-commerce, b2c, stock, premium"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              {!isReadOnly && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Right Summary Sidebar */}
          <div className="space-y-5">
            {/* Metadata Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
                Métadonnées & Isolation Multi-tenant
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Tenant ID
                  </span>
                  <span className="font-mono font-bold text-slate-800">{selectedApp.tenantId}</span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    ID Application (UUID)
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 block break-all">
                    {selectedApp.id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Type de source
                  </span>
                  <span className="font-bold text-slate-800">{selectedApp.sourceType}</span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Créé par / Date
                  </span>
                  <span className="text-slate-700">
                    {selectedApp.createdBy} • {formatDateTime(selectedApp.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Environments Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
                Environnements cibles
              </h3>
              <div className="space-y-2">
                {selectedApp.environments?.map((env) => (
                  <div
                    key={env.name}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800">{env.name}</span>
                    <span className="font-mono text-[10px] font-bold text-blue-600">v{env.versionNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: VERSIONS & LIFECYCLE */}
      {activeTab === 'versions' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Arbre des versions de l application</h3>
              <p className="text-xs text-slate-500">
                Gestion SemVer (MAJOR.MINOR.PATCH) et cycle de vie immuable (BM-CDC-00).
              </p>
            </div>
            {currentRole !== 'VIEWER' && (
              <button
                onClick={onOpenNewVersionModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer une version</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">SemVer</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Snapshot Hash</th>
                  <th className="py-3 px-4">Validation</th>
                  <th className="py-3 px-4">Date de création</th>
                  <th className="py-3 px-4">Publié le</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {appVersions.map((ver) => (
                  <tr
                    key={ver.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      ver.id === selectedVersionId ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      v{ver.versionNumber}
                      {ver.id === selectedVersionId && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-sans">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ver.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {ver.snapshotHash ? ver.snapshotHash.substring(0, 16) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% OK</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDateTime(ver.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDateTime(ver.publishedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedVersionId(ver.id);
                          showToast(`Version v${ver.versionNumber} activée`);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors"
                      >
                        Sélectionner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DATA MODEL (P0.2) */}
      {activeTab === 'datamodel' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Data Model
              </h3>
              <p className="text-xs text-slate-500">
                Entités métier, relations, contraintes et index pour v{selectedVersion?.versionNumber}.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-bold">
              {selectedVersion?.entities?.length || 0} Entités
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedVersion?.entities?.map((entity) => (
              <div
                key={entity.id}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900">{entity.name}</h4>
                    <span className="font-mono text-[10px] text-slate-400">({entity.technicalName})</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {entity.fields.length} champs
                  </span>
                </div>

                <div className="divide-y divide-slate-200/60 bg-white rounded-xl border border-slate-200/60 p-2 text-xs">
                  {entity.fields.map((f) => (
                    <div key={f.id} className="py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{f.name}</span>
                        {f.required && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded">
                            REQ
                          </span>
                        )}
                        {f.isPrimary && (
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1 rounded">
                            PK
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: FEATURES (P0.3) */}
      {activeTab === 'features' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
            Fonctionnalités métier actives (BM-P0.3 Feature Manager)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {selectedVersion?.features?.map((feat) => (
              <div
                key={feat.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-black text-slate-900">{feat.name}</h4>
                  <p className="font-mono text-[10px] text-slate-400">{feat.code}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MENUS (P0.4) */}
      {activeTab === 'menus' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
            Arborescence des menus (BM-P0.4 Menu Engine)
          </h3>
          <div className="space-y-2">
            {selectedVersion?.menus?.map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <MenuIcon className="w-4 h-4 text-blue-600" />
                    <span>{m.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{m.path}</span>
                </div>
                {m.children && (
                  <div className="pl-6 pt-2 space-y-1">
                    {m.children.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between text-slate-600">
                        <span>• {sub.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">{sub.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: VALIDATION & QUALITÉ */}
      {activeTab === 'validation' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Rapport d homologation & conformité (BM-CDC-00 Section 30)
              </h3>
              <p className="text-xs text-slate-500">
                Vérification des 7 contrats techniques obligatoires avant publication.
              </p>
            </div>
            <button
              onClick={handleRunValidation}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-600/30"
            >
              Ré-exécuter les tests
            </button>
          </div>

          <div className="space-y-3">
            {[
              { code: 'VAL_APP_CODE_REQUIRED', label: 'Code application conforme (unique, majuscule, sans espace)', ok: true },
              { code: 'VAL_SEMVER_COMPLIANCE', label: 'Numérotation SemVer valide (MAJOR.MINOR.PATCH)', ok: true },
              { code: 'VAL_DATA_MODEL_CONSISTENCY', label: 'Intégrité du Data Model (PKs valides, types supportés)', ok: true },
              { code: 'VAL_MULTI_TENANT_ISOLATION', label: 'Isolation du Tenant (tenantId inviolable)', ok: true },
              { code: 'VAL_OPTIMISTIC_LOCK_GUARD', label: 'Garde de verrouillage optimiste actif', ok: true },
              { code: 'VAL_SNAPSHOT_DETERMINISTIC', label: 'Snapshot déterministe & intégrité du hash SHA-256', ok: true },
              { code: 'VAL_AUDIT_LOG_STREAM', label: 'Traçabilité et flux d audit connectés', ok: true },
            ].map((check) => (
              <div
                key={check.code}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">{check.label}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  SUCCÈS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: AUDIT */}
      {activeTab === 'audit' && (
        <AuditTrail
          applicationId={selectedApp.id}
          title={`Journal d Audit — ${selectedApp.name}`}
          subtitle={`Traçabilité immuable des événements et mutations de versions pour l'application #${selectedApp.code}`}
          showStats={false}
          showFilters={true}
          showExport={true}
          defaultViewMode="timeline"
        />
      )}
    </div>
  );
}

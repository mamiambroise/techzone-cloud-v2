// ApplicationsView.jsx — Exact match of Image 3 (Catalog des Applications)
import React, { useState, useMemo } from 'react';
import {
  Boxes,
  CheckCircle2,
  FlaskConical,
  FileEdit,
  PauseCircle,
  Plus,
  Download,
  SlidersHorizontal,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  Copy,
  GitCommit,
  Trash2,
  Archive,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentBadge } from '../common/EnvironmentBadge';
import { IconRenderer } from '../common/IconRenderer';
import { EmptyState } from '../common/EmptyState';
import { formatDateTime } from '../../lib/formatDateTime';

export function ApplicationsView({ onOpenCloneModal, onOpenTransitionModal }) {
  const {
    applications,
    openApplicationWorkspace,
    setCurrentView,
    showToast,
    archiveApplication,
    hasPermission,
    currentRole,
  } = useApp();

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Filtered dataset
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = app.name.toLowerCase().includes(query);
        const matchCode = app.code.toLowerCase().includes(query);
        const matchCat = (app.category || '').toLowerCase().includes(query);
        const matchOwner = (app.createdBy || '').toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchCat && !matchOwner) return false;
      }
      // Status
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
      // Category
      if (categoryFilter !== 'ALL' && app.category !== categoryFilter) return false;
      // Source
      if (sourceFilter !== 'ALL' && app.sourceType !== sourceFilter) return false;
      // Owner
      if (ownerFilter !== 'ALL' && app.createdBy !== ownerFilter) return false;

      return true;
    });
  }, [applications, search, statusFilter, categoryFilter, sourceFilter, ownerFilter]);

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage) || 1;
  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const categories = ['ALL', 'Commerce', 'Automobile', 'Finance', 'Services', 'Restauration', 'Éducation', 'Santé', 'Hôtellerie'];
  const statuses = ['ALL', 'ACTIVE', 'CONFIGURING', 'READY', 'TESTING', 'DRAFT', 'SUSPENDED', 'ARCHIVED'];
  const sourceTypes = ['ALL', 'SYSTEM', 'TEMPLATE', 'CUSTOM', 'CLONED', 'IMPORTED'];

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(applications, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techzone-applications-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exportation JSON téléchargée avec succès.');
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Applications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez le catalogue global des applications métier.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
              setSourceFilter('ALL');
              setSearch('');
              showToast('Filtres réinitialisés');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres avancés</span>
          </button>

          {currentRole !== 'VIEWER' && (
            <button
              onClick={() => setCurrentView('new-application')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle application</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 5 KPI Summary Cards (Exact replica of Screenshot 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Applications
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {String(applications.length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Catalogue complet</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Actives
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {String(applications.filter((a) => a.status === 'ACTIVE').length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">En production</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              En Test
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {String(applications.filter((a) => a.status === 'TESTING').length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Homologation</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sky-600 mb-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              En Configuration
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {String(applications.filter((a) => a.status === 'CONFIGURING' || a.status === 'DRAFT').length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">En cours de setup</p>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <PauseCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Suspendues
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {String(applications.filter((a) => a.status === 'SUSPENDED').length).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Mises en pause</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar (Exact replica of Screenshot 3) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, catégorie, propriétaire..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Statut : {s === 'ALL' ? 'Tous' : s}
                </option>
              ))}
            </select>

            {/* Catégorie */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Catégorie : {c === 'ALL' ? 'Tous' : c}
                </option>
              ))}
            </select>

            {/* Source */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {sourceTypes.map((st) => (
                <option key={st} value={st}>
                  Source : {st === 'ALL' ? 'Tous' : st}
                </option>
              ))}
            </select>

            {/* List / Grid Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vue liste</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vue grille</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Data Table or Grid */}
      {paginatedApps.length === 0 ? (
        <EmptyState
          title={applications.length === 0 ? 'Aucune application' : 'Aucun résultat'}
          description={applications.length === 0 ? 'Créez une application pour commencer.' : 'Modifiez vos critères de recherche.'}
          action={applications.length === 0 && currentRole !== 'VIEWER' ? <button type="button" onClick={() => setCurrentView('new-application')} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">Nouvelle application</button> : undefined}
        />
      ) : viewMode === 'table' ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Application</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Version active</th>
                  <th className="py-3.5 px-4">Environnement(s)</th>
                  <th className="py-3.5 px-4">Propriétaire</th>
                  <th className="py-3.5 px-4">Dernière mise à jour</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => openApplicationWorkspace(app.id)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Application Name & Subtext */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <IconRenderer name={app.icon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors block truncate">
                            {app.name}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {app.shortName || app.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                      #{app.code}
                    </td>

                    {/* Catégorie */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {app.category}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>

                    {/* Version active */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900">
                          v{app.publishedVersionNumber || app.currentVersionNumber || '1.0.0'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {app.status === 'ACTIVE' ? 'Production' : 'Development'}
                        </span>
                      </div>
                    </td>

                    {/* Environnements */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {app.environments?.map((env) => (
                          <EnvironmentBadge key={env.name} environment={env.name} size="xs" />
                        ))}
                      </div>
                    </td>

                    {/* Propriétaire */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">
                          AB
                        </div>
                        <span className="text-[11px] text-slate-700 truncate max-w-[120px]">
                          {app.createdBy}
                        </span>
                      </div>
                    </td>

                    {/* Dernière mise à jour */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDateTime(app.updatedAt)}
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-3.5 px-4 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openApplicationWorkspace(app.id)}
                          className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors"
                        >
                          Ouvrir
                        </button>
                        <button
                          onClick={() => setActiveActionMenuId(activeActionMenuId === app.id ? null : app.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {activeActionMenuId === app.id && (
                        <div className="absolute right-4 top-10 w-48 rounded-xl bg-white border border-slate-200 shadow-2xl p-1.5 z-40 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              openApplicationWorkspace(app.id);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ouvrir Workspace</span>
                          </button>
                          {currentRole !== 'VIEWER' && (
                            <>
                              <button
                                onClick={() => {
                                  onOpenCloneModal(app);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                              >
                                <Copy className="w-3.5 h-3.5 text-purple-600" />
                                <span>Cloner l application</span>
                              </button>
                              <button
                                onClick={() => {
                                  onOpenTransitionModal(app);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                              >
                                <GitCommit className="w-3.5 h-3.5 text-amber-600" />
                                <span>Changer le statut</span>
                              </button>
                              <button
                                onClick={() => {
                                  archiveApplication(app.id);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold border-t border-slate-100 mt-1"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archiver</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedApps.map((app) => (
            <div
              key={app.id}
              onClick={() => openApplicationWorkspace(app.id)}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <IconRenderer name={app.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {app.name}
                      </h3>
                      <span className="font-mono text-[11px] text-slate-400">#{app.code}</span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} size="xs" />
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                    {app.category}
                  </span>
                  <span className="font-mono font-bold text-blue-600">
                    v{app.publishedVersionNumber || app.currentVersionNumber || '1.0.0'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatDateTime(app.updatedAt)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Ouvrir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Pagination Bar (Exact match of Screenshot 3 footer) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-2xs">
        <div>
          Affichage de {paginatedApps.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} à{' '}
          {Math.min(page * itemsPerPage, filteredApps.length)} sur {filteredApps.length} résultats
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-xs">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

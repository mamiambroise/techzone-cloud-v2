// VersionsView.jsx — Global Version Matrix & Lifecycle
import React, { useState } from 'react';
import {
  GitBranch,
  Filter,
  Search,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Lock,
  Plus,
  ArrowRight,
  ExternalLink,
  History,
  Table as TableIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentBadge } from '../common/EnvironmentBadge';
import { IconRenderer } from '../common/IconRenderer';
import { AuditTrail } from '../common/AuditTrail';

export function VersionsView({ onOpenNewVersionModal, onOpenPublishModal, onOpenRollbackModal }) {
  const {
    applications,
    versions,
    openApplicationWorkspace,
    setSelectedVersionId,
    showToast,
    hasPermission,
    currentRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'audit'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appFilter, setAppFilter] = useState('ALL');

  const filteredVersions = versions.filter((ver) => {
    const app = applications.find((a) => a.id === ver.applicationId);
    if (!app) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchVer = ver.versionNumber.toLowerCase().includes(q);
      const matchApp = app.name.toLowerCase().includes(q);
      if (!matchVer && !matchApp) return false;
    }
    if (statusFilter !== 'ALL' && ver.status !== statusFilter) return false;
    if (appFilter !== 'ALL' && ver.applicationId !== appFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Matrice des Versions (BM-CDC-00 / P0.1)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des versions SemVer, snapshots déterministes, statut d homologation, publications et audit.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Sub-tab switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Matrice</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Piste d Audit Versioning</span>
            </button>
          </div>

          {currentRole !== 'VIEWER' && (
            <button
              onClick={onOpenNewVersionModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle version</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par version (ex: 1.2.0) ou application..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Toutes les applications</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PUBLISHED">PUBLISHED (Publiée)</option>
                <option value="READY">READY (Prête)</option>
                <option value="DRAFT">DRAFT (En cours)</option>
                <option value="CONFIGURING">CONFIGURING</option>
                <option value="TESTING">TESTING</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {/* Versions Data Table */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Application</th>
                    <th className="py-3.5 px-4">Numéro SemVer</th>
                    <th className="py-3.5 px-4">Statut Version</th>
                    <th className="py-3.5 px-4">Environnement</th>
                    <th className="py-3.5 px-4">Snapshot Hash</th>
                    <th className="py-3.5 px-4">Homologation</th>
                    <th className="py-3.5 px-4">Créé le</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVersions.map((ver) => {
                    const app = applications.find((a) => a.id === ver.applicationId);
                    if (!app) return null;

                    return (
                      <tr key={ver.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <IconRenderer name={app.icon} className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-extrabold text-slate-900">{app.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-[13px]">
                          v{ver.versionNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={ver.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <EnvironmentBadge environment={ver.environment || 'DEVELOPMENT'} size="xs" />
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {ver.snapshotHash ? ver.snapshotHash.substring(0, 16) : '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Conforme</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(ver.createdAt).toLocaleDateString('fr-FR')}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              openApplicationWorkspace(app.id);
                              setSelectedVersionId(ver.id);
                            }}
                            className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors"
                          >
                            Ouvrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail Tab */
        <AuditTrail
          title="Historique des Mutations de Versioning"
          subtitle="Suivi continu des incrémentations SemVer, validations, publications et restaurations."
          showStats={true}
          showFilters={true}
          showExport={true}
          defaultViewMode="timeline"
        />
      )}
    </div>
  );
}

export default VersionsView;

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Boxes, Plus, Search, ArrowRight, Copy, GitCommit, LayoutGrid, List, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api, getCurrentUserRole } from "@/lib/api-client";
import { EnvironmentBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { CloneModal } from "@/components/modals/CloneModal";
import { TransitionModal } from "@/components/modals/TransitionModal";
export default function ApplicationsListPage() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [environment, setEnvironment] = useState("ALL");
  const [sort, setSort] = useState("updated_at");
  const [order, setOrder] = useState("desc");

  // Modals
  const [selectedAppForClone, setSelectedAppForClone] = useState(null);
  const [selectedAppForTransition, setSelectedAppForTransition] = useState(null);
  const role = getCurrentUserRole();
  const loadApplications = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await api.listApplications({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: status !== "ALL" ? status : undefined,
        category: category !== "ALL" ? category : undefined,
        environment: environment !== "ALL" ? environment : undefined,
        sort,
        order
      });
      if (res.success && res.data) {
        setApplications(res.data);
        if (res.meta?.pagination) {
          setPagination(res.meta.pagination);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadApplications(1);
  }, [search, status, category, environment, sort, order]);
  const categories = ["ALL", "Commerce", "Restauration", "Automobile", "Éducation", "Santé", "Hôtellerie", "Services", "Autre"];
  const statuses = ["ALL", "DRAFT", "CONFIGURING", "READY", "TESTING", "ACTIVE", "SUSPENDED", "ARCHIVED"];
  return <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Applications Métier
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez le catalogue des applications, leurs environnements et leurs versions de publication.
          </p>
        </div>

        {role !== "VIEWER" && <Link href="/business-manager/applications/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all active:scale-95 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Nouvelle application</span>
          </Link>}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filtrer par nom, code kebab-case ou description..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
          </div>

          {/* Status select */}
          <div>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 px-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {statuses.map(s => <option key={s} value={s}>
                  Statut: {s === "ALL" ? "Tous" : s}
                </option>)}
            </select>
          </div>

          {/* Category select */}
          <div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-10 px-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {categories.map(c => <option key={c} value={c}>
                  Catégorie: {c === "ALL" ? "Toutes" : c}
                </option>)}
            </select>
          </div>
        </div>

        {/* View mode & Sort controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold">{pagination.total} application(s) trouvée(s)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value)} className="h-8 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 focus:outline-none">
              <option value="updated_at">Tri: Récents</option>
              <option value="name">Tri: Nom</option>
              <option value="code">Tri: Code</option>
              <option value="status">Tri: Statut</option>
              <option value="created_at">Tri: Création</option>
            </select>

            {/* View switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`} title="Vue en cartes">
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`} title="Vue en tableau">
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content: Cards or Table */}
      {loading ? <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Chargement des applications...</p>
        </div> : applications.length === 0 ? <div className="py-16 text-center rounded-3xl bg-white border border-slate-100 shadow-sm p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Aucune application trouvée</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Aucune application ne correspond à vos critères de recherche ou aucun pack n'a encore été initialisé.
            </p>
          </div>
          {role !== "VIEWER" && <Link href="/business-manager/applications/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200">
              <Plus className="w-4 h-4" />
              <span>Créer une Application</span>
            </Link>}
        </div> : viewMode === "grid" ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {applications.map(app => <div key={app.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                      <IconRenderer name={app.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {app.name}
                      </h3>
                      <p className="font-mono text-[11px] text-slate-400">{app.code}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} size="sm" />
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                  {app.description || "Application métier centralisée sans description."}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700">{app.category || "Autre"}</span>
                  <span>•</span>
                  <EnvironmentBadge environment={app.environment} />
                  <span>•</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {app.publishedVersionNumber ? `v${app.publishedVersionNumber}` : "v1.0.0 (draft)"}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/business-manager/applications/${app.id}/overview`} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-800">
                  <span>Ouvrir Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {role !== "VIEWER" && <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedAppForTransition(app)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors" title="Changer le statut">
                      <GitCommit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedAppForClone(app)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Cloner l'application">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>}
              </div>
            </div>)}
        </div> : (/* Table View */
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Application</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Version Publiée</th>
                  <th className="py-3.5 px-4">Environnement</th>
                  <th className="py-3.5 px-4">Dernière MAJ</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <IconRenderer name={app.icon} className="w-4 h-4" />
                        </div>
                        <Link href={`/business-manager/applications/${app.id}/overview`} className="hover:text-indigo-600 transition-colors font-bold">
                          {app.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">{app.code}</td>
                    <td className="py-3.5 px-4 text-slate-700">{app.category || "Autre"}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {app.publishedVersionNumber ? `v${app.publishedVersionNumber}` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <EnvironmentBadge environment={app.environment} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(app.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/business-manager/applications/${app.id}/overview`} className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors">
                          Workspace
                        </Link>
                        {role !== "VIEWER" && <button onClick={() => setSelectedAppForClone(app)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700" title="Cloner">
                            <Copy className="w-3.5 h-3.5" />
                          </button>}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* Pagination Bar */}
      {pagination.pages > 1 && <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 text-xs">
          <span className="text-slate-500">
            Page {pagination.page} sur {pagination.pages}
          </span>
          <div className="flex items-center gap-2">
            <button disabled={pagination.page <= 1} onClick={() => loadApplications(pagination.page - 1)} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={pagination.page >= pagination.pages} onClick={() => loadApplications(pagination.page + 1)} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>}

      {/* Modals */}
      <CloneModal application={selectedAppForClone} isOpen={!!selectedAppForClone} onClose={() => setSelectedAppForClone(null)} onCloned={() => loadApplications(pagination.page)} />

      <TransitionModal application={selectedAppForTransition} isOpen={!!selectedAppForTransition} onClose={() => setSelectedAppForTransition(null)} onUpdated={() => loadApplications(pagination.page)} />
    </div>;
}
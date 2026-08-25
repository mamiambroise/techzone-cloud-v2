"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  ChevronDown,
  MoreVertical,
  Search,
  SlidersHorizontal,
  RefreshCw,
  ArrowDown,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Star,
  FileText,
  Copy,
  GitCommit,
  GitBranch,
  Loader2,
} from "lucide-react";
import { api, getCurrentUserRole } from "@/lib/api-client";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { CloneModal } from "@/components/modals/CloneModal";
import { TransitionModal } from "@/components/modals/TransitionModal";

const STATUS_META = {
  DRAFT: { label: "BROUILLON", pill: "text-slate-600 border-slate-200", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  CONFIGURING: { label: "CONFIGURATION", pill: "text-blue-600 border-blue-200", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  READY: { label: "PRÊT", pill: "text-amber-600 border-amber-200", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  TESTING: { label: "EN TEST", pill: "text-orange-600 border-orange-200", badge: "bg-orange-50 text-orange-600", dot: "bg-orange-500" },
  ACTIVE: { label: "ACTIVE", pill: "text-green-600 border-green-200", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
  SUSPENDED: { label: "SUSPENDUE", pill: "text-red-600 border-red-200", badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
  ARCHIVED: { label: "ARCHIVÉE", pill: "text-gray-500 border-gray-200", badge: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

const ENV_STYLES = {
  DEVELOPMENT: "text-blue-600 bg-blue-50",
  TEST: "text-purple-600 bg-purple-50",
  STAGING: "text-amber-600 bg-amber-50",
  PRODUCTION: "text-green-600 bg-green-50",
};

const CAT_STYLES = {
  "Commerce": "bg-purple-50 text-purple-700",
  "Restauration": "bg-amber-50 text-amber-700",
  "Automobile": "bg-blue-50 text-blue-700",
  "Éducation": "bg-green-50 text-green-700",
  "Santé": "bg-teal-50 text-teal-700",
  "Hôtellerie": "bg-orange-50 text-orange-700",
};

function actorName(id) {
  if (id === "usr_admin_01") return "Administrateur";
  if (id === "usr_builder_02") return "Éditeur Lead";
  return id || "Système";
}

function actorInitials(id) {
  const n = actorName(id);
  return n
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ApplicationsInner() {
  const searchParams = useSearchParams();
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [envFilter, setEnvFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");
  const [selected, setSelected] = useState([]);
  const [openKebab, setOpenKebab] = useState(null);

  const [cloneApp, setCloneApp] = useState(null);
  const [transitionApp, setTransitionApp] = useState(null);

  const role = getCurrentUserRole();

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.listApplications({
          limit: 50,
          search: search.trim() || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          environment: envFilter !== "ALL" ? envFilter : undefined,
          category: catFilter !== "ALL" ? catFilter : undefined,
          sort: "updated_at",
          order: "desc",
          includeArchived: statusFilter === "ARCHIVED",
        }),
        api.getDashboardStats(),
      ]);
      if (listRes.success) setApps(listRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, envFilter, catFilter]);

  const sc = stats?.statusCounts || {};
  const pills = [
    { key: "ALL", label: "Tous", count: stats?.totalApplications || 0 },
    { key: "ACTIVE", label: "Actives", count: sc.ACTIVE || 0 },
    { key: "TESTING", label: "En test", count: sc.TESTING || 0 },
    { key: "DRAFT", label: "Brouillons", count: (sc.DRAFT || 0) + (sc.CONFIGURING || 0) },
    { key: "SUSPENDED", label: "Suspendues", count: sc.SUSPENDED || 0 },
    { key: "ARCHIVED", label: "Archivées", count: sc.ARCHIVED || 0 },
  ];

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allSelected = apps.length > 0 && selected.length === apps.length;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Heading */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez l'ensemble de vos applications métier, leurs versions, environnements et cycles de vie.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role !== "VIEWER" && (
            <Link
              href="/business-manager/applications/new"
              className="inline-flex items-center gap-2 pl-4 pr-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle application</span>
              <ChevronDown className="w-4 h-4 ml-1 opacity-80" />
            </Link>
          )}
          <button
            onClick={load}
            className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Actualiser la liste"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, code, description..."
              className="w-full h-11 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous</option>
              {Object.keys(STATUS_META).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Environnement</label>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous</option>
              <option value="DEVELOPMENT">Développement</option>
              <option value="TEST">Test</option>
              <option value="STAGING">Staging</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Catégorie</label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Toutes</option>
              {["Commerce", "Restauration", "Automobile", "Éducation", "Santé", "Hôtellerie", "Services", "Autre"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              title="Filtres avancés (recherche, tri, pagination côté backend)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status pills + tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {pills.map((p) => {
              const active = statusFilter === p.key || (p.key === "ALL" && statusFilter === "ALL");
              const meta = STATUS_META[p.key];
              return (
                <button
                  key={p.key}
                  onClick={() => setStatusFilter(p.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    active
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : `bg-white ${meta ? meta.pill : "text-slate-600 border-slate-200"} hover:bg-slate-50`
                  }`}
                >
                  <span>{p.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
              <span>Tri : Dernière modif.</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                title="Vue cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 ${viewMode === "table" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                title="Vue tableau"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 flex items-center gap-3">
          <span>{selected.length} application(s) sélectionnée(s)</span>
          <button onClick={() => setSelected([])} className="underline hover:text-blue-900">
            Effacer
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Chargement du catalogue...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Aucune application trouvée</p>
          <p className="text-xs text-slate-500">Modifiez vos filtres ou créez une nouvelle application métier.</p>
          {role !== "VIEWER" && (
            <Link
              href="/business-manager/applications/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              Nouvelle application
            </Link>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : apps.map((a) => a.id))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4 font-bold">Application</th>
                  <th className="py-3 px-4 font-bold">Catégorie</th>
                  <th className="py-3 px-4 font-bold">Statut</th>
                  <th className="py-3 px-4 font-bold">Version active</th>
                  <th className="py-3 px-4 font-bold">Environnement</th>
                  <th className="py-3 px-4 font-bold">Dernière modification</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((app) => {
                  const st = STATUS_META[app.status] || STATUS_META.DRAFT;
                  return (
                    <tr key={app.id} className="hover:bg-[#EDF3FF] transition-colors">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(app.id)}
                          onChange={() => toggleSelect(app.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                            <IconRenderer name={app.icon} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/business-manager/workspace?app=${app.id}`}
                              className="text-sm font-bold text-slate-900 hover:text-blue-700 transition-colors block truncate"
                            >
                              {app.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-mono">#{app.code}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                              {app.description || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold ${CAT_STYLES[app.category] || "bg-slate-100 text-slate-600"}`}>
                          {app.category || "Autre"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                          v{app.publishedVersionNumber || app.currentVersionNumber || "0.1.0"}
                          {app.publishedVersionNumber && <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${ENV_STYLES[app.environment] || "bg-slate-100 text-slate-600"}`}>
                          {app.environment}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                            {actorInitials(app.createdBy)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{actorName(app.createdBy)}</p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(app.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                              {new Date(app.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2 relative">
                          <Link
                            href={`/business-manager/workspace?app=${app.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Ouvrir
                          </Link>
                          <button
                            onClick={() => setOpenKebab(openKebab === app.id ? null : app.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openKebab === app.id && (
                            <div className="absolute right-0 top-10 w-52 rounded-lg bg-white border border-slate-200 shadow-xl p-1 z-20">
                              <Link
                                href={`/business-manager/workspace?app=${app.id}`}
                                onClick={() => setOpenKebab(null)}
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <FileText className="w-3.5 h-3.5" /> Ouvrir le workspace
                              </Link>
                              <Link
                                href={`/business-manager/versions?app=${app.id}`}
                                onClick={() => setOpenKebab(null)}
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <GitBranch className="w-3.5 h-3.5" /> Voir les versions
                              </Link>
                              {role !== "VIEWER" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setOpenKebab(null);
                                      setTransitionApp(app);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <GitCommit className="w-3.5 h-3.5" /> Changer le statut
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenKebab(null);
                                      setCloneApp(app);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Cloner l'application
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
            <span>
              Affichage de 1 à {apps.length} sur {apps.length} applications
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md border border-slate-200 text-slate-400" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-md bg-blue-600 text-white text-xs font-black">1</button>
              <button className="p-1.5 rounded-md border border-slate-200 text-slate-400" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {apps.map((app) => {
            const st = STATUS_META[app.status] || STATUS_META.DRAFT;
            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                      <IconRenderer name={app.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{app.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">#{app.code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex-shrink-0 ${st.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-3 line-clamp-2">{app.description || "—"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-md font-bold ${CAT_STYLES[app.category] || "bg-slate-100 text-slate-600"}`}>
                    {app.category || "Autre"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                    v{app.publishedVersionNumber || app.currentVersionNumber || "0.1.0"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-extrabold uppercase ${ENV_STYLES[app.environment]}`}>
                    {app.environment}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {new Date(app.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                  <Link
                    href={`/business-manager/workspace?app=${app.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ouvrir
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CloneModal application={cloneApp} isOpen={!!cloneApp} onClose={() => setCloneApp(null)} onCloned={load} />
      <TransitionModal
        application={transitionApp}
        isOpen={!!transitionApp}
        onClose={() => setTransitionApp(null)}
        onUpdated={load}
      />
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#2E6BE6]" />
        </div>
      }
    >
      <ApplicationsInner />
    </Suspense>
  );
}

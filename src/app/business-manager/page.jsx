"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Boxes, Plus, ArrowRight, Sparkles, Activity, CheckSquare, ShieldCheck, Send, GitBranch, Copy, TrendingUp } from "lucide-react";
import { api, getCurrentUserRole } from "@/lib/api-client";
import { EnvironmentBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { CloneModal } from "@/components/modals/CloneModal";
export default function BusinessManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppForClone, setSelectedAppForClone] = useState(null);
  const role = getCurrentUserRole();
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, actRes] = await Promise.all([api.getDashboardStats(), api.getGlobalActivity({
        limit: 6
      })]);
      if (statsRes.success) setStats(statsRes.data);
      if (actRes.success) setActivities(actRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  const totalApps = stats?.totalApplications || 0;
  const activeApps = stats?.activeApplications || 0;
  const testingApps = stats?.testingApplications || 0;
  const draftApps = stats?.draftApplications || 0;
  const publishedVersions = stats?.totalPublishedVersions || 0;
  return <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Business Manager • P0.1 Core</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Gestionnaire Central des Applications
          </h1>
          <p className="text-xs md:text-sm text-indigo-100/90 mt-1.5 max-w-2xl leading-relaxed">
            Socle commun pour créer, versionner, valider, publier et faire évoluer l'ensemble de vos solutions métier (Boutique, Restaurant, Garage, etc.).
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {role !== "VIEWER" && <Link href="/business-manager/applications/new" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-xs shadow-lg shadow-black/10 transition-all active:scale-95">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Nouvelle application</span>
            </Link>}

          <Link href="/business-manager/e2e-suite" className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-xs transition-all">
            <CheckSquare className="w-4 h-4 text-indigo-200" />
            <span>Banc de Test E2E</span>
          </Link>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Metric Cards (Jobie Dashboard aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Apps Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applications</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{totalApps}</h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Socle central unifié</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Boxes className="w-7 h-7" />
          </div>
        </div>

        {/* Active Apps Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications Actives</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{activeApps}</h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              {totalApps > 0 ? `${Math.round(activeApps / totalApps * 100)}% en production` : "0%"}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <Send className="w-7 h-7" />
          </div>
        </div>

        {/* Testing Apps Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">En Test / Validation</p>
            <h3 className="text-3xl font-black text-purple-600 mt-1">{testingApps}</h3>
            <p className="text-[11px] text-purple-700 font-semibold mt-1">Contrôles de pré-publication</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        {/* Published Releases Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Publications Réussies</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{publishedVersions}</h3>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">Déploiements transactionnels</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
            <GitBranch className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Main Grid: Applications Spotlight & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Applications Spotlight */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Applications Récemment Administrées</h2>
              <p className="text-xs text-slate-500">Accédez directement au Workspace de chaque application</p>
            </div>
            <Link href="/business-manager/applications" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>Voir tout ({totalApps})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.recentApplications?.map(app => <div key={app.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
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
                    {app.description || "Application métier administrée par le Business Manager."}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{app.category || "Autre"}</span>
                    <span>•</span>
                    <EnvironmentBadge environment={app.environment} />
                    <span>•</span>
                    <span className="font-mono font-bold text-indigo-600">
                      {app.publishedVersionNumber ? `v${app.publishedVersionNumber}` : "v1.0.0 (draft)"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/business-manager/applications/${app.id}/overview`} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-800">
                    <span>Ouvrir Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {role !== "VIEWER" && <button onClick={() => setSelectedAppForClone(app)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Cloner l'application">
                      <Copy className="w-4 h-4" />
                    </button>}
                </div>
              </div>)}
          </div>
        </div>

        {/* Right Col: Global Activity & System Health */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Activité Récente</h3>
              </div>
              <Link href="/business-manager/activity" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
                Journal complet
              </Link>
            </div>

            <div className="py-2 divide-y divide-slate-100">
              {activities.map(act => <div key={act.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate max-w-[160px]">
                      {act.applicationName || act.eventType.split(".").pop()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {act.traceId.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Action : <strong className="font-mono text-indigo-700">{act.action}</strong> par {act.actorId}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
                  </p>
                </div>)}
            </div>
          </div>

          {/* Core P0.1 Checklist Card */}
          <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h4 className="font-extrabold text-indigo-950">Garanties Architecture P0.1</h4>
            </div>
            <ul className="space-y-1 text-[11px] text-indigo-800">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Identifiants UUID et codes normalisés immuables
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Publication & Rollback 100% transactionnels
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Contrôle de concurrence optimiste (optimistic locking)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Points d'ancrage prêts pour Data Model P0.2 & Workflows
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Clone Modal */}
      <CloneModal application={selectedAppForClone} isOpen={!!selectedAppForClone} onClose={() => setSelectedAppForClone(null)} onCloned={loadData} />
    </div>;
}
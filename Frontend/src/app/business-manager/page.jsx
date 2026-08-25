"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  MoreHorizontal,
  Layers,
  CheckCircle2,
  FlaskConical,
  PenSquare,
  PauseCircle,
  ArrowRight,
  FileText,
  Settings,
  CircleCheck,
  Zap,
  UploadCloud,
  ShieldCheck,
  Plus,
  Search,
  BadgeCheck,
  Users,
  User,
  Code2,
  CloudUpload,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { IconRenderer } from "@/components/ui/IconRenderer";

const AUDIT_META = {
  "business.application.status.changed": { icon: User, color: "bg-blue-100 text-blue-600" },
  "business.application.created": { icon: FileText, color: "bg-emerald-100 text-emerald-600" },
  "business.application.version.created": { icon: Code2, color: "bg-purple-100 text-purple-600" },
  "business.application.published": { icon: CloudUpload, color: "bg-green-100 text-green-600" },
  "business.application.rollback": { icon: RefreshCw, color: "bg-rose-100 text-rose-600" },
  "business.application.cloned": { icon: Layers, color: "bg-violet-100 text-violet-600" },
  "business.application.updated": { icon: PenSquare, color: "bg-slate-100 text-slate-600" },
  "business.application.version.validated": { icon: BadgeCheck, color: "bg-indigo-100 text-indigo-600" },
  "business.application.archived": { icon: PauseCircle, color: "bg-gray-100 text-gray-600" },
};

const STATUS_META = {
  DRAFT: { label: "BROUILLON", cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  CONFIGURING: { label: "CONFIGURATION", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  READY: { label: "PRÊT", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  TESTING: { label: "EN TEST", cls: "bg-orange-50 text-orange-600", dot: "bg-orange-500" },
  ACTIVE: { label: "ACTIVE", cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  SUSPENDED: { label: "SUSPENDUE", cls: "bg-red-50 text-red-600", dot: "bg-red-500" },
  ARCHIVED: { label: "ARCHIVÉE", cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
  ERROR: { label: "ERREUR", cls: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

function StatCard({ icon: Icon, iconBg, label, value, caption, captionColor, solid }) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-4 relative shadow-sm ${
        solid ? "bg-[#2E6BE6] border border-[#2E6BE6] text-white" : "bg-white border border-slate-200"
      }`}
    >
      <button
        className={`absolute top-4 right-4 ${solid ? "text-white/50 hover:text-white" : "text-slate-300 hover:text-slate-500"}`}
        title="Options de la carte"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
            solid ? "bg-white/20 text-white" : `${iconBg} text-white`
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span
          className={`text-[11px] font-bold tracking-wider uppercase ${
            solid ? "text-blue-100" : "text-slate-500"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="pl-1">
        <p className={`text-4xl font-black tabular-nums ${solid ? "text-white" : "text-slate-800"}`}>
          {String(value).padStart(2, "0")}
        </p>
        <p className={`text-xs font-semibold mt-1 ${solid ? "text-blue-100" : captionColor || "text-slate-500"}`}>
          {caption}
        </p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api.getDashboardStats(), api.getGlobalActivity({ limit: 5 })]);
      if (s.success) setStats(s.data);
      if (a.success) setActivities(a.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = stats?.totalApplications || 0;
  const actives = stats?.activeApplications || 0;
  const testing = stats?.testingApplications || 0;
  const drafts = stats?.draftApplications || 0;
  const suspended = stats?.suspendedApplications || 0;
  const configuring = stats?.configuringApplications || 0;
  const ready = stats?.statusCounts?.READY || 0;
  const published = stats?.totalPublishedVersions || 0;

  const lifecycle = [
    { key: "DRAFT", label: "DRAFT", value: drafts, caption: "Brouillons", icon: FileText, color: "text-slate-500" },
    { key: "CONFIGURING", label: "CONFIGURING", value: configuring, caption: "En configuration", icon: Settings, color: "text-slate-600" },
    { key: "TESTING", label: "VALIDATION", value: testing, caption: "En validation", icon: CircleCheck, color: "text-orange-500" },
    { key: "READY", label: "READY", value: ready, caption: "Prêtes à publier", icon: Zap, color: "text-purple-600" },
    { key: "PUBLISHED", label: "PUBLISHED", value: published, caption: "Publiées", icon: UploadCloud, color: "text-amber-500" },
    { key: "ACTIVE", label: "ACTIVE", value: actives, caption: "En production", icon: ShieldCheck, color: "text-green-600" },
  ];

  const quickActions = [
    { icon: Plus, title: "Nouvelle application", desc: "Créer une application métier", href: "/business-manager/applications/new" },
    { icon: Search, title: "Explorer les modèles", desc: "Parcourir le catalogue", href: "/business-manager/specs" },
    { icon: BadgeCheck, title: "Banc d'homologation", desc: "Lancer les tests P0.1", href: "/business-manager/specs" },
    { icon: FileText, title: "Voir le journal d'audit", desc: "Consulter les événements", href: "/business-manager/historique" },
    { icon: Users, title: "Environnements", desc: "Gérer les environnements", href: "/business-manager/applications" },
    { icon: Settings, title: "Paramètres P0.1", desc: "Configuration globale", href: "/business-manager/specs" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vue générale — P0.1</h1>
          <p className="text-sm text-slate-500 mt-1">Pilotage global des applications métier et de leur cycle de vie.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard solid icon={Layers} iconBg="bg-blue-600" label="Total Applications" value={total} caption="Catalogue complet" />
        <StatCard icon={CheckCircle2} iconBg="bg-green-600" label="Actives" value={actives} caption="En production" captionColor="text-green-600" />
        <StatCard icon={FlaskConical} iconBg="bg-amber-500" label="En test" value={testing} caption="Homologation" captionColor="text-amber-600" />
        <StatCard icon={PenSquare} iconBg="bg-slate-500" label="Brouillons" value={drafts} caption="En configuration" />
        <StatCard icon={PauseCircle} iconBg="bg-red-600" label="Suspendues" value={suspended} caption="Mises en pause" captionColor="text-red-600" />
      </div>

      {/* Recent apps + Audit journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Applications récentes</h2>
            <Link href="/business-manager/applications" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Voir tout ({total})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(stats?.recentApplications || []).slice(0, 4).map((app) => {
              const st = STATUS_META[app.status] || STATUS_META.DRAFT;
              return (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                    <IconRenderer name={app.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{app.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      <span className="font-mono">#{app.code}</span> • {app.category || "Général"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${st.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono flex items-center gap-1 justify-end">
                      <span className={`w-1.5 h-1.5 rounded-full ${app.publishedVersionNumber ? "bg-green-500" : "bg-slate-400"}`} />
                      v{app.publishedVersionNumber || app.currentVersionNumber || "0.1.0"}
                    </p>
                  </div>
                  <Link
                    href={`/business-manager/workspace?app=${app.id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex-shrink-0"
                  >
                    Ouvrir
                  </Link>
                </div>
              );
            })}
            {(!stats?.recentApplications || stats.recentApplications.length === 0) && (
              <p className="text-xs text-slate-400 py-8 text-center">Aucune application pour le moment.</p>
            )}
          </div>
        </div>

        {/* Audit Journal */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Journal d'audit (récent)</h2>
            <Link href="/business-manager/historique" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.map((ev) => {
              const m = AUDIT_META[ev.eventType] || { icon: FileText, color: "bg-slate-100 text-slate-600" };
              const Icon = m.icon;
              const time = new Date(ev.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={ev.id} className="py-3 flex items-start gap-3">
                  <span className="text-[11px] text-slate-400 font-mono pt-1 w-10 flex-shrink-0">{time}</span>
                  <div className={`w-9 h-9 rounded-full ${m.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800">
                          {ev.actorId === "usr_admin_01" ? "Administrateur" : ev.actorId === "usr_builder_02" ? "Éditeur Lead" : ev.actorId}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {ev.eventType === "business.application.status.changed"
                            ? `Passage du statut vers ${ev.after?.status || ""}`
                            : ev.eventType === "business.application.published"
                            ? `Publication de la version ${ev.metadata?.versionNumber || ""} sur ${ev.metadata?.environment || "PROD"}`
                            : ev.eventType === "business.application.version.created"
                            ? `Création du brouillon version ${ev.metadata?.versionNumber || ""}`
                            : ev.eventType === "business.application.created"
                            ? `Création de l'application ${ev.applicationName || ""}`
                            : ev.eventType === "business.application.rollback"
                            ? `Restauration de la version ${ev.metadata?.restoredVersionNumber || ""}`
                            : `Action ${ev.action}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                          {ev.eventType.replace("business.application.", "business.")}
                        </span>
                        {ev.applicationName && <p className="text-[11px] text-slate-400 mt-1 max-w-[140px] truncate">{ev.applicationName}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && <p className="text-xs text-slate-400 py-8 text-center">Aucun événement récent.</p>}
          </div>
        </div>
      </div>

      {/* Lifecycle stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-extrabold text-slate-900 pb-4">Cycle de vie (toutes applications)</h2>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {lifecycle.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.key}>
                <div className="flex-1 min-w-[150px] border border-slate-200 rounded-xl p-4 flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`w-5 h-5 ${s.color}`} />
                    <span className={`text-[11px] font-extrabold tracking-wider ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tabular-nums pl-0.5">{String(s.value).padStart(2, "0")}</p>
                  <p className="text-xs text-slate-500 pl-0.5">{s.caption}</p>
                </div>
                {i < lifecycle.length - 1 && (
                  <div className="flex items-center px-1">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-extrabold text-slate-900 pb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <Link
                key={i}
                href={qa.href}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{qa.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{qa.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

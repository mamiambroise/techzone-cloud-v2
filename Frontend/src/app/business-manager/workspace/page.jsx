"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MoreVertical,
  FileText,
  Tag,
  CircleDot,
  Lock,
  BadgeCheck,
  GitCommit,
  Copy,
  Rocket,
  Download,
  Trash2,
  History,
  Layers,
  Globe2,
  Clock,
  Users,
  Plug,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRight,
  Info,
  Loader2,
  Settings,
  UserCog,
  Boxes,
} from "lucide-react";
import { api, getCurrentUserRole } from "@/lib/api-client";
import { StatusBadge, EnvironmentBadge } from "@/components/ui/StatusBadge";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { OverviewTab } from "@/components/workspace/OverviewTab";
import { SettingsTab } from "@/components/workspace/SettingsTab";
import { ValidationModal } from "@/components/modals/ValidationModal";
import { PublishModal } from "@/components/modals/PublishModal";
import { CloneModal } from "@/components/modals/CloneModal";
import { TransitionModal } from "@/components/modals/TransitionModal";

const SUB_TABS = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "infos", label: "Informations de base" },
  { key: "params", label: "Paramètres généraux" },
  { key: "org", label: "Organisation & Rôles" },
  { key: "modules", label: "Modules & Fonctionnalités" },
  { key: "integrations", label: "Intégrations" },
  { key: "security", label: "Sécurité" },
  { key: "advanced", label: "Avancés" },
];

function actorLabel(id) {
  if (id === "usr_admin_01") return "Administrateur";
  if (id === "usr_builder_02") return "Éditeur Lead";
  return id || "Système";
}

function ComingSoon({ icon: Icon, title, desc }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 max-w-md mx-auto">{desc}</p>
      <span className="inline-flex px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
        Planifié — prochains blocs
      </span>
    </div>
  );
}

function WorkspaceInner() {
  const searchParams = useSearchParams();
  const appId = searchParams.get("app");
  const sub = searchParams.get("sub") || "overview";
  const role = getCurrentUserRole();

  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);

  const [showValidate, setShowValidate] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const refresh = async () => {
    if (!appId) {
      const res = await api.listApplications({ limit: 50 });
      if (res.success) setApps(res.data || []);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [a, v, act] = await Promise.all([
        api.getApplication(appId),
        api.listVersions(appId),
        api.getApplicationActivity(appId, { limit: 10 }),
      ]);
      if (a.success) setApp(a.data);
      if (v.success) setVersions(v.data || []);
      if (act.success) setActivities(act.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setApp(null);
    setVersions([]);
    setActivities([]);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const draft = versions.find((v) => v.status === "DRAFT") || null;
  const targetVersion = draft || versions[0] || null;

  const exportConfig = () => {
    const source = draft || versions.find((v) => v.id === app?.publishedVersionId) || versions[0];
    if (!source) return;
    const blob = new Blob([JSON.stringify({ application: app, version: source }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${app?.code || "application"}-v${source.versionNumber}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const discardDraft = async () => {
    if (!draft) return;
    if (!window.confirm(`Supprimer définitivement le brouillon v${draft.versionNumber} ? Cette action archive la version draft.`)) return;
    const res = await api.discardVersion(app.id, draft.id);
    if (!res.success) {
      window.alert(res.error?.message || "Échec de la suppression du brouillon.");
      return;
    }
    refresh();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Chargement du workspace...</p>
      </div>
    );
  }

  /* ---------- App picker when no ?app ---------- */
  if (!appId) {
    return (
      <div className="space-y-5 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Workspace & Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sélectionnez une application pour ouvrir son espace de travail et sa configuration.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {apps.map((a) => (
            <Link
              key={a.id}
              href={`/business-manager/workspace?app=${a.id}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <IconRenderer name={a.icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700">{a.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">#{a.code}</p>
                </div>
                <StatusBadge status={a.status} size="sm" />
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-mono font-bold text-slate-700">
                  v{a.publishedVersionNumber || a.currentVersionNumber || "—"}
                </span>
                <span className="flex items-center gap-1 text-blue-600 font-bold">
                  Ouvrir <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
          {apps.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-400 py-10">Aucune application disponible.</p>
          )}
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="py-20 text-center bg-white border border-slate-200 rounded-xl space-y-3">
        <p className="text-sm font-bold text-slate-700">Application introuvable</p>
        <Link href="/business-manager/applications" className="text-xs font-bold text-blue-600 underline">
          Retour aux applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/business-manager/applications" className="hover:text-blue-600 font-semibold">
          Applications
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-700 truncate max-w-[220px]">{app.name}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-500">Workspace & Configuration</span>
      </nav>

      {/* Title row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold text-slate-900">{app.name}</h1>
          <StatusBadge status={app.status} size="md" />
        </div>
        <div className="relative">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            Actions <MoreVertical className="w-4 h-4" />
          </button>
          {actionsOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg bg-white border border-slate-200 shadow-xl p-1 z-20">
              {role !== "VIEWER" && (
                <>
                  <button
                    onClick={() => {
                      setActionsOpen(false);
                      setShowTransition(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <GitCommit className="w-3.5 h-3.5" /> Changer le statut
                  </button>
                  <button
                    onClick={() => {
                      setActionsOpen(false);
                      setShowClone(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="w-3.5 h-3.5" /> Cloner l'application
                  </button>
                </>
              )}
              <Link
                href={`/business-manager/historique?app=${app.id}`}
                onClick={() => setActionsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <History className="w-3.5 h-3.5" /> Voir l'historique
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          ID : <span className="font-mono font-bold text-slate-800">{app.code}</span>
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Catégorie : <span className="font-bold text-slate-800">{app.category || "Général"}</span>
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
          <CircleDot className="w-3.5 h-3.5 text-green-500" />
          Version active : <span className="font-mono font-bold text-slate-800">v{app.publishedVersionNumber || "—"}</span>
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          Environnement : <span className="font-extrabold text-green-700">{app.environment}</span>
        </span>
      </div>

      {/* Sub tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {SUB_TABS.map((t) => (
            <Link
              key={t.key}
              href={`/business-manager/workspace?app=${app.id}&sub=${t.key}`}
              className={`px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                sub === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Sub tab content */}
      {sub === "overview" && (
        <OverviewTab application={app} versions={versions} activities={activities} onRefresh={refresh} />
      )}

      {sub === "infos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">Informations clés</h2>
            <div className="divide-y divide-slate-100 text-sm">
              {[
                { icon: FileText, label: "Nom de l'application", value: app.name },
                { icon: SlidersHorizontal, label: "Code technique", value: app.code, mono: true },
                { icon: FileText, label: "Description", value: app.description || "—" },
                { icon: Tag, label: "Catégorie", value: app.category || "Général" },
                { icon: Boxes, label: "Icône", value: app.icon || "Package" },
                { icon: BadgeCheck, label: "Statut", value: app.status },
                {
                  icon: GitCommit,
                  label: "Version active (Production)",
                  value: app.publishedVersionNumber ? `v${app.publishedVersionNumber}` : "Aucune",
                },
                {
                  icon: FileText,
                  label: "Workspace actuel",
                  value: `v${draft?.versionNumber || app.currentVersionNumber || "—"} (${draft?.status || "—"}) • ${app.environment}`,
                },
                { icon: Users, label: "Propriétaire", value: actorLabel(app.createdBy) },
              ].map((row, i) => {
                const Icon = row.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="w-56 text-slate-500 flex-shrink-0">{row.label}</span>
                    <span className={`font-semibold text-slate-800 ${row.mono ? "font-mono text-xs" : ""}`}>{row.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">Configuration rapide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {[
                { icon: Settings, title: "Paramètres généraux", desc: "Paramètres système, localisation et préférences.", sub: "params" },
                { icon: UserCog, title: "Organisation & Rôles", desc: "Rôles, permissions et accès au niveau de l'application.", sub: "org" },
                { icon: Boxes, title: "Modules & Fonctionnalités", desc: "Activez ou désactivez les modules disponibles.", sub: "modules" },
                { icon: Plug, title: "Intégrations", desc: "APIs, services externes et intégrations tierces.", sub: "integrations" },
                { icon: ShieldCheck, title: "Sécurité", desc: "Politiques de sécurité et contrôle d'accès.", sub: "security" },
                { icon: SlidersHorizontal, title: "Avancés", desc: "Variables, cache et maintenance.", sub: "advanced" },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-extrabold text-slate-800">{c.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{c.desc}</p>
                    </div>
                    <Link
                      href={`/business-manager/workspace?app=${app.id}&sub=${c.sub}`}
                      className="self-start px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-blue-700 hover:bg-blue-50"
                    >
                      Configurer
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {sub === "params" && <SettingsTab application={app} onRefresh={refresh} />}

      {sub === "org" && (
        <ComingSoon
          icon={UserCog}
          title="Organisation & Rôles"
          desc="La gestion fine des rôles (Administrateur, Builder, Lecteur) et des équipes assignées par application sera couverte par le bloc Approval Engine (P0.8). Le contrôle RBAC global est déjà actif via le sélecteur de rôle."
        />
      )}

      {sub === "modules" && (
        <ComingSoon
          icon={Boxes}
          title="Modules & Fonctionnalités"
          desc="L'activation des modules du Pack (Data Models P0.2, Features P0.3, Menus, Pages, Forms, Dashboards, Rules, Workflows, Automations) s'appuiera sur application_id et application_version_id. Le conteneur est déjà prêt."
        />
      )}

      {sub === "integrations" && (
        <ComingSoon
          icon={Plug}
          title="Intégrations"
          desc="Les adaptateurs ERP / Paiement / IA suivront le pattern Port → Adapter → Système Externe (C4 niveau 2). Le cœur P0.1 reste isolé et fonctionnel sans dépendance externe."
        />
      )}

      {sub === "security" && (
        <ComingSoon
          icon={ShieldCheck}
          title="Sécurité"
          desc="Validation stricte des entrées, verrouillage optimiste (VERSION_CONFLICT), permissions backend et trace_id par requête sont déjà actifs. Les politiques avancées (MFA, IP allowlist) arrivent prochainement."
        />
      )}

      {sub === "advanced" && (
        <ComingSoon
          icon={SlidersHorizontal}
          title="Paramètres avancés"
          desc="Variables d'environnement, cache de résumé Application, quotas et maintenance. L'invalidation de cache est déjà câblée sur update / transition / publication / rollback."
        />
      )}

      {/* Workspace actions bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-extrabold text-slate-700 pb-3">Actions du workspace</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          <Link
            href={`/business-manager/versions?app=${app.id}`}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <History className="w-4 h-4 text-slate-400" /> Voir les versions
          </Link>

          <button
            onClick={() => targetVersion && setShowValidate(true)}
            disabled={!targetVersion || role === "VIEWER"}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <BadgeCheck className="w-4 h-4 text-slate-400" /> Valider pour publication
          </button>

          <button
            onClick={() => targetVersion && setShowPublish(true)}
            disabled={!targetVersion || role === "VIEWER"}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-green-300 bg-green-50 text-xs font-bold text-green-700 hover:bg-green-100 disabled:opacity-40"
          >
            <Rocket className="w-4 h-4" /> Publier (v{targetVersion?.versionNumber || "—"})
          </button>

          <button
            onClick={() => setShowClone(true)}
            disabled={role === "VIEWER"}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Copy className="w-4 h-4 text-slate-400" /> Cloner le workspace
          </button>

          <button
            onClick={exportConfig}
            disabled={!targetVersion}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-slate-400" /> Exporter la configuration
          </button>

          <button
            onClick={discardDraft}
            disabled={!draft || role === "VIEWER"}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" /> Supprimer le draft
          </button>
        </div>
      </div>

      {/* Modals */}
      <ValidationModal
        application={app}
        version={targetVersion}
        isOpen={showValidate}
        onClose={() => setShowValidate(false)}
        onOpenPublish={() => {
          setShowValidate(false);
          setShowPublish(true);
        }}
      />
      <PublishModal
        application={app}
        version={targetVersion}
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        onPublished={refresh}
      />
      <CloneModal application={app} isOpen={showClone} onClose={() => setShowClone(false)} />
      <TransitionModal application={app} isOpen={showTransition} onClose={() => setShowTransition(false)} onUpdated={refresh} />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      }
    >
      <WorkspaceInner />
    </Suspense>
  );
}

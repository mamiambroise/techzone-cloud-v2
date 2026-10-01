import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  RotateCw,
  Layers,
  Package,
  Database,
  Plug,
  Rocket,
  AppWindow,
  CircleAlert,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTenant } from "../contexts/TenantProvider.jsx";
import { useDashboard, alertKeys } from "./dashboard/DashboardContext.jsx";
import { navigationGroups, groupEntries } from "../app/navigationConfig.js";
import { canAccess } from "../app/navigationAccess.js";
import { resolveNavigationIcon } from "../app/navigationIcons.js";
import {
  buttonClass,
  WidgetBody,
  DashboardSection,
  ModuleCard,
  StatusBadge,
  displayDate,
} from "./dashboard/DashboardWidgets.jsx";
const descriptions = {
  bm: "Définissez vos applications, leurs données et leurs fonctionnalités.",
  ui: "Concevez les interfaces de vos applications.",
  automation: "Organisez les workflows et suivez leurs exécutions.",
  packs: "Composez, validez et publiez vos packs métier.",
  runtime: "Consultez les résolutions, configurations et diagnostics.",
  data: "Accédez aux données à travers les contrats autorisés.",
  erp: "Connectez vos ressources métier à Dolibarr.",
  registry: "Découvrez les composants et capacités de la plateforme.",
};
const alertSources = {
  businessAlerts: "Business Manager",
  packAlerts: "Pack Manager",
  runtimeAlerts: "Runtime",
  deploymentAlerts: "Déploiements",
};
const activityLabels = {
  "pack.create": "Pack créé",
  "pack.update": "Pack modifié",
  "pack.createVersion": "Version de pack créée",
  "pack.updateResource": "Ressource du pack modifiée",
  "pack.createResource": "Ressource ajoutée au pack",
  "pack.validate": "Validation du pack",
  "pack.publish": "Publication du pack",
  "runtime.resolve": "Résolution Runtime",
  "application.create": "Application créée",
  "application.update": "Application modifiée",
};
const metrics = [
  {
    key: "applications",
    label: "Applications",
    icon: AppWindow,
    to: "/business-manager/applications",
  },
  {
    key: "packs",
    label: "Packs",
    icon: Package,
    to: "/packs/packs",
    permission: "pack.read",
  },
  {
    key: "deployments",
    label: "Déploiements",
    icon: Rocket,
    to: "/deployment",
  },
  {
    key: "dataSources",
    label: "Sources de données",
    icon: Database,
    to: "/data-runtime",
    permission: "data-runtime:read",
  },
  {
    key: "connectors",
    label: "Connecteurs",
    icon: Plug,
    to: "/settings/integrations",
    permission: "erp:read",
  },
];
export default function CockpitView() {
  const { user } = useAuth(),
    { activeTenant } = useTenant(),
    { widgets, loading, error, refresh, generatedAt } = useDashboard();
  const modules = useMemo(
    () =>
      Object.keys(descriptions).flatMap((id) => {
        const group = navigationGroups.find((g) => g.id === id);
        const entry = groupEntries(id).find((e) => canAccess(e, user));
        return group && entry
          ? [
              {
                group: { ...group, Icon: resolveNavigationIcon(group.icon) },
                entry,
              },
            ]
          : [];
      }),
    [user],
  );
  const actions = [
    { label: "Nouvelle application", to: "/business-manager/applications/new" },
    {
      label: "Consulter les workflows",
      to: "/automation/workflows",
      permission: "automation:read",
    },
    {
      label: "Nouveau pack",
      to: "/packs/packs?create=1",
      permission: "pack.create",
    },
    { label: "Déployer", to: "/deployment/releases", admin: true },
  ].filter((a) => (!a.admin || user?.isSuperAdmin) && canAccess(a, user));
  const renderWidget = (key, empty, children) => (
    <WidgetBody
      widget={widgets[key]}
      loading={loading}
      retry={() => refresh(key)}
      empty={empty}
    >
      {children}
    </WidgetBody>
  );
  return (
    <div className="space-y-6" data-testid="platform-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Tableau de bord
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {activeTenant?.name || activeTenant?.code} · Votre espace de travail
          </p>
        </div>
        <button
          className={buttonClass}
          onClick={() => refresh()}
          disabled={loading}
        >
          <RotateCw
            size={14}
            className={loading ? "motion-safe:animate-spin" : ""}
          />
          Actualiser
        </button>
      </div>
      <section className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Layers size={16} />
              TECHZONE CLOUD
            </p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Construisez, déployez et exécutez
              <br className="hidden sm:block" /> vos applications métier.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              De la définition métier à l’exécution, retrouvez vos modules et
              les informations de votre espace en un seul endroit.
            </p>
          </div>
          <Layers
            size={68}
            strokeWidth={1}
            className="hidden shrink-0 text-blue-200 sm:block"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
          {["Modulaire", "Multi-tenant", "Intégré"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1"
            >
              {t}
            </span>
          ))}
        </div>
      </section>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Impossible de charger le tableau de bord.{" "}
          <button className="font-semibold underline" onClick={() => refresh()}>
            Réessayer
          </button>
        </div>
      )}
      {!error && (
        <section
          aria-label="Indicateurs clés"
          className="grid grid-cols-2 gap-3 xl:grid-cols-5"
        >
          {metrics
            .filter((m) => canAccess(m, user))
            .map(({ key, label, icon: Icon, to }) => (
              <div
                key={key}
                data-widget={key}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-medium text-slate-500">
                    {label}
                  </h2>
                  <Icon size={17} className="shrink-0 text-blue-600" />
                </div>
                <WidgetBody
                  widget={widgets[key]}
                  loading={loading}
                  retry={() => refresh(key)}
                >
                  {(count) => (
                    <>
                      <p className="my-3 text-3xl font-semibold tracking-tight tabular-nums">
                        {count}
                      </p>
                      <Link
                        to={to}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"
                      >
                        Consulter <ArrowRight size={12} />
                      </Link>
                    </>
                  )}
                </WidgetBody>
              </div>
            ))}
        </section>
      )}
      <section aria-labelledby="modules-title">
        <div className="mb-3">
          <h2 id="modules-title" className="text-sm font-semibold">
            Vos modules
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Accédez directement à vos outils de construction et d’exploitation.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.group.id}
              {...m}
              description={descriptions[m.group.id]}
            />
          ))}
        </div>
      </section>
      {!error && (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <DashboardSection
              id="activity-title"
              title="Activité récente"
              description="Derniers événements de votre espace"
            >
              {renderWidget("activity", "Aucune activité récente.", (rows) => (
                <ul className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <Link
                        to={row.targetRoute}
                        className="flex items-center gap-3 rounded-lg py-3 transition-colors hover:bg-slate-50"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {activityLabels[row.action] || row.action}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {displayDate(row.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={row.result} />
                        <ArrowRight size={13} className="text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </DashboardSection>
            {canAccess({ permission: "pack.read" }, user) && (
              <DashboardSection
                id="packs-title"
                title="Packs récents"
                description="Reprenez votre composition"
                action={
                  <Link className="text-xs text-blue-600" to="/packs/packs">
                    Tout voir
                  </Link>
                }
              >
                {renderWidget(
                  "recentPacks",
                  <>
                    <p>Aucun pack pour le moment.</p>
                    {canAccess({ permission: "pack.create" }, user) && (
                      <Link
                        to="/packs/packs?create=1"
                        className={`${buttonClass} mt-3`}
                      >
                        Créer un pack
                      </Link>
                    )}
                  </>,
                  (rows) => (
                    <ul className="divide-y divide-slate-100">
                      {rows.map((row) => (
                        <li key={row.id}>
                          <Link
                            to={row.targetRoute}
                            className="flex items-center gap-3 rounded-lg py-3 hover:bg-slate-50"
                          >
                            <Package
                              size={20}
                              className="shrink-0 text-blue-500"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {row.name}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {row.version || "Sans version"}
                                {row.modules !== null
                                  ? ` · ${row.modules} modules`
                                  : ""}
                                {row.updatedAt
                                  ? ` · ${displayDate(row.updatedAt)}`
                                  : ""}
                              </p>
                            </div>
                            <StatusBadge status={row.status} />
                            <ArrowRight size={13} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </DashboardSection>
            )}
          </div>
          <DashboardSection
            id="environments-title"
            title="Environnements"
            description="Configuration enregistrée et dernier déploiement"
            action={
              <Link to="/environments" className="text-xs text-blue-600">
                Consulter
              </Link>
            }
          >
            {renderWidget(
              "environments",
              "Aucun environnement configuré.",
              (rows) => (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((row) => (
                    <Link
                      key={row.id}
                      to={row.targetRoute}
                      className="rounded-lg border border-slate-100 p-3 hover:border-blue-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {row.name}
                        </span>
                        <StatusBadge status={row.status} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {row.lastDeployment
                          ? `Dernier déploiement : ${row.lastDeployment.status}`
                          : "Aucun déploiement enregistré"}
                      </p>
                      {row.lastDeployment && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {displayDate(row.lastDeployment.startedAt)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              ),
            )}
          </DashboardSection>
          <DashboardSection
            id="alerts-title"
            title="Alertes & problèmes"
            description="Derniers résultats enregistrés — ouvrez le module pour vérifier leur état actuel"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {alertKeys
                .filter((key) => widgets[key]?.state !== "FORBIDDEN")
                .map((key) => (
                  <div key={key} data-widget={key}>
                    <h3 className="mb-2 text-xs font-medium text-slate-600">
                      {alertSources[key]}
                    </h3>
                    {renderWidget(
                      key,
                      "Aucun problème signalé par cette source.",
                      (rows) => (
                        <ul className="space-y-2">
                          {rows.map((row) => (
                            <li key={row.id}>
                              <Link
                                to={row.targetRoute}
                                className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3"
                              >
                                <CircleAlert
                                  size={16}
                                  className="mt-0.5 shrink-0 text-amber-600"
                                />
                                <span className="min-w-0 flex-1 text-xs">
                                  <span className="block font-medium [overflow-wrap:anywhere]">
                                    {row.message}
                                  </span>
                                  <span className="mt-1 block text-slate-500">
                                    {displayDate(row.timestamp)} ·{" "}
                                    {row.severity}
                                  </span>
                                </span>
                                <ArrowRight size={13} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ),
                    )}
                  </div>
                ))}
            </div>
          </DashboardSection>
        </>
      )}
      <DashboardSection id="quick-title" title="Actions rapides">
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className={buttonClass}>
              <Plus size={14} />
              {a.label}
            </Link>
          ))}
        </div>
      </DashboardSection>
      {generatedAt && !error && (
        <p className="text-right text-[11px] text-slate-400">
          Dernière lecture : {displayDate(generatedAt)}
        </p>
      )}
    </div>
  );
}

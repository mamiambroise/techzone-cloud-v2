import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  RotateCw,
  Package,
  Database,
  Plug,
  Rocket,
  AppWindow,
  CircleAlert,
  HeartPulse,
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
const activitySource = (action = "") => {
  if (action.startsWith("pack.")) return "Pack Manager";
  if (action.startsWith("runtime.")) return "Pack Runtime";
  if (action.startsWith("application.") || action.startsWith("business.") || action.startsWith("bm.")) return "Business Manager";
  return "Plateforme";
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
    label: "Packs publiés",
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
  {
    key: "activeApplications",
    label: "Applications actives",
    icon: AppWindow,
    to: "/runtime",
    permission: "runtime.resolution.read",
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
  const onboardingSteps = useMemo(
    () =>
      [
        ["bm", "Modéliser", "Créez votre première application métier."],
        ["ui", "Construire l’interface", "Concevez les pages de votre application."],
        ["automation", "Automatiser", "Ajoutez des workflows lorsque nécessaire."],
        ["packs", "Publier le pack", "Composez, validez et publiez votre pack."],
        ["environments", "Déployer et exécuter", "Choisissez un environnement puis déployez."],
      ].flatMap(([groupId, label, description]) => {
        const entry = groupEntries(groupId).find((candidate) =>
          canAccess(candidate, user),
        );
        return entry ? [{ groupId, label, description, to: entry.route }] : [];
      }),
    [user],
  );
  const showOnboarding =
    widgets.applications?.state === "LOADED" && widgets.applications.data === 0;
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
  const observability = groupEntries("observability").find((entry) =>
    canAccess(entry, user),
  );
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
    <div className="space-y-5 sm:space-y-6" data-testid="platform-dashboard">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-card)] sm:px-5">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
            Bienvenue sur Techzone Cloud
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {activeTenant?.name || activeTenant?.code} · Construisez, déployez et gérez vos applications métier.
          </p>
        </div>
        <button
          type="button"
          aria-label="Actualiser les données du tableau de bord"
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
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-text)]"
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
          className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        >
          {metrics
            .filter((m) => canAccess(m, user))
            .map(({ key, label, icon: Icon, to }) => (
              <div
                key={key}
                data-widget={key}
                className="group min-w-0 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] motion-reduce:transition-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {label}
                  </h2>
                  <span className="rounded-xl bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
                    <Icon size={17} className="shrink-0" />
                  </span>
                </div>
                <WidgetBody
                  widget={widgets[key]}
                  loading={loading}
                  retry={() => refresh(key)}
                >
                  {(count) => (
                    <>
                      <p className="mb-3 mt-5 text-3xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
                        {count}
                      </p>
                      <Link
                        to={to}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] group-hover:underline"
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
      {!error && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
          <DashboardSection
            id="trend-title"
            title="Activité et tendances"
            description="Lecture de l’activité de la plateforme"
          >
            <div
              data-widget="activityTrend"
              className="flex min-h-28 items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4"
            >
              <span className="rounded-lg bg-white p-2 text-slate-500 shadow-sm">
                <ArrowRight size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Tendance indisponible
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  L’historique agrégé nécessaire à un graphique n’est pas encore exposé par les sources du tableau de bord.
                </p>
              </div>
            </div>
          </DashboardSection>
          <DashboardSection
            id="health-title"
            title="Santé de la plateforme"
            description="État consolidé des services et diagnostics disponibles"
            action={
              observability ? (
                <Link className="text-xs font-medium text-blue-600" to={observability.route}>
                  Ouvrir Observabilité
                </Link>
              ) : null
            }
          >
            <div
              data-widget="platformHealth"
              className="flex min-h-28 items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4"
            >
              <span className="rounded-lg bg-white p-2 text-slate-500 shadow-sm">
                <HeartPulse size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Santé consolidée indisponible
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Les diagnostics restent consultables dans leurs modules propriétaires. Aucun statut global n’est affiché sans source de supervision fiable.
                </p>
              </div>
            </div>
          </DashboardSection>
        </div>
      )}
      <section aria-labelledby="modules-title">
        <div className="mb-3">
          <h2 id="modules-title" className="text-sm font-semibold">
            Accès rapides
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Les espaces autorisés les plus utiles pour poursuivre votre travail.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {modules.slice(0, 8).map((m) => (
            <ModuleCard
              key={m.group.id}
              {...m}
              description={descriptions[m.group.id]}
            />
          ))}
        </div>
      </section>
      {!error && (
        <div className="grid gap-5 xl:grid-cols-2">
            <DashboardSection
              id="activity-title"
              title="Activité récente"
              description="Derniers événements de votre espace"
              className="xl:order-1"
            >
              {renderWidget("activity", "Aucune activité récente.", (rows) => (
                <ul className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <Link
                        to={row.targetRoute}
                        className="flex items-center gap-3 rounded-lg py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {activityLabels[row.action] || row.action}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {activitySource(row.action)} · {displayDate(row.createdAt)}
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
                className="xl:order-3"
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
          <DashboardSection
            id="environments-title"
            title="Environnements"
            description="Configuration enregistrée et dernier déploiement"
            className="xl:order-4"
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
                      className="rounded-lg border border-slate-100 p-3 hover:border-blue-200 focus-visible:outline-2 focus-visible:outline-blue-600"
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
            className="xl:order-2"
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
                                className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3 focus-visible:outline-2 focus-visible:outline-blue-600"
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
                                    {displayDate(row.timestamp)}
                                  </span>
                                </span>
                                <StatusBadge status={row.severity} />
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
        </div>
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
      {showOnboarding && onboardingSteps.length > 0 && (
        <DashboardSection
          id="onboarding-title"
          title="Démarrer avec Techzone Cloud"
          description="Suivez les étapes accessibles dans votre espace. La progression n’est affichée que lorsqu’elle peut être calculée à partir de données réelles."
        >
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {onboardingSteps.map((step, index) => (
              <li key={step.groupId} className="min-w-0">
                <Link
                  to={step.to}
                  className="group flex h-full gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-700 shadow-sm">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-800">
                      {step.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                      {step.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </DashboardSection>
      )}
      {generatedAt && !error && (
        <p className="text-right text-[11px] text-slate-400">
          Dernière lecture : {displayDate(generatedAt)}
        </p>
      )}
    </div>
  );
}

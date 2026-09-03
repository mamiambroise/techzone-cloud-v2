import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { api } from "../../../lib/api";
import { EmptyState } from "../../common/EmptyState";
import { ErrorState } from "../../common/ErrorState";
import { JsonViewer } from "../../common/JsonViewer";
import { PageHeader } from "../../common/PageHeader";
import { StatusBadge } from "../../common/StatusBadge";
import { TechnicalDetails } from "../../common/TechnicalDetails";
import { formatDateTime } from "../../../lib/formatDateTime";

const titleByMode = {
  overview: [
    "État effectif Runtime",
    "Quel est l’état effectif actuellement résolu ?",
  ],
  context: [
    "Runtime Context",
    "Sélectionnez les noms métier utilisés pour la résolution.",
  ],
  resolver: [
    "Resolver",
    "Résolvez un manifest PM publié dans un contexte explicite.",
  ],
  manifest: [
    "Effective Manifest",
    "Inspectez le résultat exécutable produit par la dernière résolution.",
  ],
  status: [
    "Runtime Status",
    "Santé réelle des providers requis par le resolver.",
  ],
  cache: [
    "Cache & résilience",
    "État du cache tenant-safe et protections actives.",
  ],
  diagnostics: [
    "Diagnostics",
    "Erreurs et avertissements persistés par résolution.",
  ],
  api: [
    "API Runtime",
    "Contrats techniques réellement exposés par le backend.",
  ],
};

export default function RuntimeCockpitView({ mode = "overview" }) {
  const {
    applications,
    packs,
    packVersions,
    selectedApp,
    selectedEnvironment,
    showToast,
  } = useApp();
  const published = useMemo(
    () => packVersions.filter((item) => item.status === "PUBLISHED"),
    [packVersions],
  );
  const [applicationId, setApplicationId] = useState(selectedApp?.id || "");
  const [versionId, setVersionId] = useState("");
  const [resolutions, setResolutions] = useState([]);
  const [effective, setEffective] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [cache, setCache] = useState(null);
  const [health, setHealth] = useState(null);
  const [resilience, setResilience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(null);
  const [jsonMode, setJsonMode] = useState(false);
  const selectedResolutionId = effective?.resolutionId;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        resolutionItems,
        runtimeDashboard,
        cacheStatus,
        providerHealth,
        resilienceStatus,
      ] = await Promise.all([
        api.listRuntimeResolutions(),
        api.runtimeDashboard(),
        api.getRuntimeCacheStatus(),
        api.getRuntimeProvidersHealth(),
        api.getRuntimeResilienceStatus(),
      ]);
      setResolutions(resolutionItems);
      setDashboard(runtimeDashboard);
      setCache(cacheStatus);
      setHealth(providerHealth);
      setResilience(resilienceStatus);
    } catch (failure) {
      setError(failure);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (!applicationId && applications[0]) setApplicationId(applications[0].id);
  }, [applicationId, applications]);
  useEffect(() => {
    if (!versionId && published[0]) setVersionId(published[0].id);
  }, [published, versionId]);

  const openResolution = async (id) => {
    try {
      const [manifest, items] = await Promise.all([
        api.getEffectiveManifest(id),
        api.getRuntimeDiagnostics(id),
      ]);
      setEffective(manifest);
      setDiagnostics(items);
    } catch (failure) {
      showToast(failure.message, "error");
    }
  };

  const resolve = async () => {
    const version = published.find((item) => item.id === versionId);
    const pack = packs.find((item) => item.id === version?.packId);
    if (!version || !pack || !applicationId) return;
    setResolving(true);
    try {
      const environment =
        selectedEnvironment === "ALL" ? "PROD" : selectedEnvironment;
      const result = await api.resolveRuntime({
        applicationId,
        packCode: pack.code,
        packVersion: version.versionNumber,
        environment,
        context: {
          application: { id: applicationId },
          environment: { code: environment },
        },
      });
      await openResolution(result.resolutionId);
      await refresh();
      showToast(`Résolution ${result.status} confirmée par le backend.`);
    } catch (failure) {
      showToast(failure.message, "error");
    } finally {
      setResolving(false);
    }
  };

  const rerun = async () => {
    if (!selectedResolutionId) return;
    setResolving(true);
    try {
      const result = await api.reresolveRuntime(selectedResolutionId);
      await openResolution(result.resolutionId);
      await refresh();
      showToast("Nouvelle résolution persistée.");
    } catch (failure) {
      showToast(failure.message, "error");
    } finally {
      setResolving(false);
    }
  };

  const [title, description] = titleByMode[mode] || titleByMode.overview;
  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  if (error)
    return (
      <ErrorState
        title="Pack Runtime indisponible"
        description={error.message}
        onRetry={refresh}
      />
    );
  const manifest = effective?.content;

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Pack Runtime · Resolve · Execute · Diagnose"
        title={title}
        description={description}
        badge={mode === "overview" ? "AVAILABLE" : "PARTIAL"}
        actions={
          <button
            type="button"
            onClick={refresh}
            aria-label="Actualiser"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {(mode === "overview" || mode === "status") && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Résolutions"
            value={dashboard?.counters?.total ?? 0}
            icon={Activity}
          />
          <Metric
            label="Résolues"
            value={dashboard?.counters?.resolved ?? 0}
            icon={CheckCircle2}
          />
          <Metric
            label="Bloquées"
            value={dashboard?.counters?.blocked ?? 0}
            icon={ShieldAlert}
          />
          <Metric
            label="Providers UP"
            value={
              health?.providers?.filter((item) => item.state === "UP").length ??
              0
            }
            icon={Server}
          />
        </section>
      )}

      {(mode === "overview" || mode === "context" || mode === "resolver") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-950">
            Contexte de résolution
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Application">
              <select
                aria-label="Application"
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                className="input"
              >
                <option value="">Sélectionner</option>
                {applications.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pack et version">
              <select
                aria-label="Pack et version"
                value={versionId}
                onChange={(event) => setVersionId(event.target.value)}
                className="input"
              >
                <option value="">Sélectionner</option>
                {published.map((version) => (
                  <option key={version.id} value={version.id}>
                    {packs.find((item) => item.id === version.packId)?.name ||
                      "Pack"}{" "}
                    · {version.versionNumber}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                disabled={resolving || !applicationId || !versionId}
                onClick={resolve}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                {resolving ? "Résolution…" : "Résoudre"}
              </button>
            </div>
          </div>
          <TechnicalDetails>
            <p>
              <strong>Tenant :</strong> le tenant du JWT est injecté côté
              backend.
            </p>
            <p>
              <strong>Environnement :</strong>{" "}
              {selectedEnvironment === "ALL" ? "PROD" : selectedEnvironment}
            </p>
          </TechnicalDetails>
        </section>
      )}

      {(mode === "overview" ||
        mode === "resolver" ||
        mode === "diagnostics") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black">Résolutions récentes</h2>
          {resolutions.length ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {resolutions.slice(0, 12).map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openResolution(item.id)}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-left hover:border-blue-300"
                >
                  <div>
                    <strong className="block text-xs">
                      {applications.find((app) => app.id === item.applicationId)
                        ?.name || "Application"}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {item.environment} · {formatDateTime(item.startedAt)}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune résolution"
              description="Résolvez un manifest publié pour obtenir un état effectif."
            />
          )}
        </section>
      )}

      {(mode === "overview" || mode === "manifest") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">Effective Runtime Manifest</h2>
              {effective && (
                <div className="mt-2 flex gap-2">
                  <StatusBadge status={effective.status} />
                  <StatusBadge
                    status={effective.executable ? "VALID" : "INVALID"}
                  />
                </div>
              )}
            </div>
            {effective && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setJsonMode((value) => !value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
                >
                  {jsonMode ? "Summary" : "JSON"}
                </button>
                <button
                  type="button"
                  disabled={resolving}
                  onClick={rerun}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Re-resolve
                </button>
              </div>
            )}
          </div>
          {effective ? (
            jsonMode ? (
              <div className="mt-4">
                <JsonViewer value={manifest} />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Summary
                  label="Executable"
                  value={effective.executable ? "YES" : "NO"}
                />
                <Summary
                  label="Modules"
                  value={manifest?.modules?.length ?? 0}
                />
                <Summary
                  label="Features"
                  value={manifest?.features?.length ?? 0}
                />
                <Summary
                  label="Capabilities"
                  value={manifest?.capabilities?.length ?? 0}
                />
                <Summary
                  label="Rules"
                  value={manifest?.ruleDecisions?.length ?? 0}
                />
                <Summary
                  label="Generated"
                  value={formatDateTime(effective.createdAt)}
                />
                <div className="sm:col-span-2">
                  <TechnicalDetails>
                    <p className="break-all font-mono">
                      {effective.manifestHash}
                    </p>
                    <p className="mt-1">
                      Resolution ID: {effective.resolutionId}
                    </p>
                  </TechnicalDetails>
                </div>
              </div>
            )
          ) : (
            <EmptyState
              title="Aucun manifest sélectionné"
              description="Sélectionnez une résolution existante ou lancez le resolver."
            />
          )}
        </section>
      )}

      {mode === "cache" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Cache L1" icon={Database}>
            <Summary
              label="État"
              value={cache?.available ? "HEALTHY" : "FAILED"}
            />
            <Summary label="Entrées tenant" value={cache?.entries ?? 0} />
            <Summary label="TTL" value={`${cache?.ttlMs ?? 0} ms`} />
            <Summary
              label="Single-flight joins"
              value={cache?.metrics?.singleFlightJoined ?? 0}
            />
          </Panel>
          <Panel title="Résilience" icon={ShieldAlert}>
            <Summary label="Mode" value={resilience?.mode} />
            <Summary
              label="Single-flight"
              value={resilience?.singleFlight ? "ACTIVE" : "INACTIVE"}
            />
            <Summary
              label="Stale fallback"
              value={resilience?.staleIfError ? "ACTIVE" : "DISABLED"}
            />
            <p className="text-xs text-slate-500">
              Les protections de provider distant restent désactivées tant
              qu’aucun provider distant retryable n’existe.
            </p>
          </Panel>
        </section>
      )}

      {mode === "status" && (
        <section className="grid gap-3 md:grid-cols-2">
          {health?.providers?.map((provider) => (
            <div
              key={provider.code}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <strong className="text-sm">{provider.code}</strong>
                <StatusBadge
                  status={provider.state === "UP" ? "HEALTHY" : "FAILED"}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Latence mesurée : {provider.latencyMs ?? "—"} ms
              </p>
            </div>
          ))}
        </section>
      )}

      {mode === "diagnostics" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          {diagnostics.length ? (
            <div className="space-y-2">
              {diagnostics.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs">{item.code}</strong>
                    <StatusBadge status={item.severity} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun diagnostic sélectionné"
              description="Sélectionnez une résolution pour afficher ses erreurs et avertissements persistés."
            />
          )}
        </section>
      )}

      {mode === "api" && (
        <JsonViewer
          value={{
            resolve: "POST /api/runtime/resolve",
            resolutions: "GET /api/runtime/resolutions",
            effectiveManifest:
              "GET /api/runtime/resolutions/:id/effective-manifest",
            cache: "GET /api/runtime/cache/status",
            providers: "GET /api/runtime/providers/health",
            resilience: "GET /api/runtime/resilience/status",
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-xs font-bold text-slate-600">
      {label}
      {children}
    </label>
  );
}
function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-blue-600" />
      <strong className="mt-4 block text-2xl font-black">{value}</strong>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
function Summary({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <strong className="mt-1 block break-words text-sm text-slate-900">
        {value ?? "—"}
      </strong>
    </div>
  );
}
function Panel({ title, icon: Icon, children }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

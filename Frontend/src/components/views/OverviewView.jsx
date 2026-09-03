import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Braces,
  CheckCircle2,
  Compass,
  FileCheck2,
  RefreshCw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "../common/EmptyState";
import { LifecycleStepper } from "../common/LifecycleStepper";
import { PageHeader } from "../common/PageHeader";
import { StatusBadge } from "../common/StatusBadge";

const readinessItems = [
  ["Data Model", "data-model", Braces, "models"],
  ["Features", "features", Sparkles, "features"],
  ["Navigation", "menus", Compass, "menus"],
  ["Configuration", "configuration", Settings2, "configs"],
  ["Contracts", "integrations", FileCheck2, "integrations"],
];

export function OverviewView() {
  const {
    applications,
    versions,
    dataModels,
    features,
    menus,
    configs,
    integrations,
    selectedApp,
    selectedVersion,
    setCurrentView,
    syncFromBackend,
    showToast,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const scopedVersions = useMemo(
    () => versions.filter((item) => item.applicationId === selectedApp?.id),
    [versions, selectedApp],
  );
  const activeVersion =
    scopedVersions.find((item) => item.status === "PUBLISHED") ||
    selectedVersion ||
    scopedVersions[0];
  const counts = {
    models: dataModels.length,
    features: features.length,
    menus: menus.length,
    configs: configs.length,
    integrations: integrations.length,
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await syncFromBackend();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Business Manager · Define · Configure · Validate"
        title="Définition métier"
        description="Où en est la définition métier de l’application active ?"
        badge="AVAILABLE"
        actions={
          <>
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </button>
            <button
              type="button"
              onClick={() => setCurrentView("applications")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Applications
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        }
      />

      {!selectedApp ? (
        <EmptyState
          title="Aucune application métier"
          description="Créez une application pour commencer sa définition métier."
          action={
            <button
              type="button"
              onClick={() => setCurrentView("applications")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              Nouvelle application
            </button>
          }
        />
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Application active
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {selectedApp.name}
                </h2>
                <p className="mt-1 text-xs font-mono text-slate-500">
                  {selectedApp.code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedApp.status} />
                <StatusBadge status={activeVersion?.status || "NOT_RUN"} />
              </div>
            </div>
            {activeVersion && (
              <div className="mt-5 overflow-x-auto pb-1">
                <LifecycleStepper
                  steps={["DRAFT", "READY", "PUBLISHED"]}
                  current={activeVersion.status}
                />
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-950">
                Readiness de la définition
              </h2>
              <span className="text-xs text-slate-500">
                Données persistées uniquement
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {readinessItems.map(([label, view, Icon, key]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentView(view)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    {counts[key] > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        VIDE
                      </span>
                    )}
                  </div>
                  <strong className="mt-4 block text-sm text-slate-900">
                    {label}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {counts[key]} élément{counts[key] === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <Boxes className="h-5 w-5 text-blue-600" />
              <strong className="mt-3 block text-2xl font-black">
                {applications.length}
              </strong>
              <span className="text-xs text-slate-500">
                applications persistées
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <FileCheck2 className="h-5 w-5 text-violet-600" />
              <strong className="mt-3 block text-2xl font-black">
                {scopedVersions.length}
              </strong>
              <span className="text-xs text-slate-500">
                versions de l’application
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView("validation")}
              className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-left text-white"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <strong className="mt-3 block text-sm">
                Valider la définition
              </strong>
              <span className="mt-1 block text-xs text-slate-400">
                Contrôler les écarts avant publication.
              </span>
            </button>
          </section>
        </>
      )}
    </div>
  );
}

import React from "react";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  FileJson2,
  GitBranch,
  PackageCheck,
  Puzzle,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { EmptyState } from "../../common/EmptyState";
import { LifecycleStepper } from "../../common/LifecycleStepper";
import { PageHeader } from "../../common/PageHeader";
import { StatusBadge } from "../../common/StatusBadge";

export default function PackOverviewView({ onOpenNewPackModal }) {
  const {
    packs,
    selectedPack,
    selectedPackVersion,
    packModules,
    packFeatures,
    packDependencies,
    packRules,
    setCurrentView,
    syncFromBackend,
    showToast,
  } = useApp();
  const versionId = selectedPackVersion?.id;
  const modules = packModules.filter(
    (item) => item.packVersionId === versionId,
  );
  const features = packFeatures.filter(
    (item) => item.packVersionId === versionId,
  );
  const dependencies = packDependencies.filter(
    (item) =>
      item.packVersionId === versionId ||
      item.sourcePackVersionId === versionId,
  );
  const rules = packRules.filter((item) => item.packVersionId === versionId);
  const refresh = async () => {
    try {
      await syncFromBackend();
    } catch (error) {
      showToast(error.message, "error");
    }
  };
  const cards = [
    ["Modules", modules.length, Puzzle, "pack-modules"],
    ["Features", features.length, PackageCheck, "pack-modules"],
    ["Dependencies", dependencies.length, GitBranch, "pack-dependencies"],
    ["Rules", rules.length, CheckCircle2, "pack-rules"],
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Pack Manager · Build · Validate · Publish"
        title="Préparation du pack"
        description="Où en est le pack actif avant publication ?"
        badge="AVAILABLE"
        actions={
          <>
            <button
              type="button"
              onClick={refresh}
              aria-label="Actualiser"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenNewPackModal}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
            >
              Nouveau pack
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        }
      />

      {!selectedPack ? (
        <EmptyState
          title="Aucun pack"
          description="Créez un pack pour démarrer le workflow de publication."
          action={
            <button
              type="button"
              onClick={onOpenNewPackModal}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              Nouveau pack
            </button>
          }
        />
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pack actif
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {selectedPack.name}
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {selectedPack.code} ·{" "}
                  {selectedPackVersion?.versionNumber || "aucune version"}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <StatusBadge status={selectedPack.status} />
                <StatusBadge
                  status={selectedPackVersion?.validationStatus || "NOT_RUN"}
                />
              </div>
            </div>
            {selectedPackVersion && (
              <div className="mt-5 overflow-x-auto pb-1">
                <LifecycleStepper
                  steps={["DRAFT", "READY", "PUBLISHED"]}
                  current={selectedPackVersion.status}
                />
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, count, Icon, view]) => (
              <button
                type="button"
                key={label}
                onClick={() => setCurrentView(view)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" />
                </span>
                <strong className="mt-4 block text-2xl font-black text-slate-950">
                  {count}
                </strong>
                <span className="text-xs text-slate-500">{label}</span>
              </button>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-black text-slate-950">
                Décision de publication
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Decision
                  label="Validation"
                  value={selectedPackVersion?.validationStatus || "NOT_RUN"}
                />
                <Decision
                  label="Manifest"
                  value={selectedPackVersion?.manifestStatus || "NOT_GENERATED"}
                />
                <Decision
                  label="Version"
                  value={selectedPackVersion?.status || "ABSENT"}
                />
                <Decision
                  label="Dépendances"
                  value={
                    dependencies.some((item) =>
                      ["MISSING", "CONFLICT", "CYCLE"].includes(
                        item.resolutionStatus || item.status,
                      ),
                    )
                      ? "INVALID"
                      : "VALID"
                  }
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView("pack-versions")}
              className="rounded-2xl bg-slate-950 p-5 text-left text-white"
            >
              <FileJson2 className="h-6 w-6 text-cyan-400" />
              <strong className="mt-5 block text-lg">
                Validation, publication & manifest
              </strong>
              <span className="mt-2 block text-sm leading-6 text-slate-400">
                Ouvrir la version active pour exécuter la prochaine action
                autorisée.
              </span>
              <span className="mt-5 flex items-center gap-2 text-xs font-bold text-cyan-300">
                Continuer
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </section>

          <button
            type="button"
            onClick={() => setCurrentView("packs")}
            className="flex items-center gap-2 text-xs font-bold text-blue-600"
          >
            <Boxes className="h-4 w-4" />
            Voir les {packs.length} packs persistés
          </button>
        </>
      )}
    </div>
  );
}

function Decision({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <StatusBadge status={value} />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  GitBranch,
  Plus,
  Send,
  ShieldCheck,
  History,
  GitCompare,
  Code2,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { ValidationModal } from "../modals/ValidationModal";
import { PublishModal } from "../modals/PublishModal";
import { CreateVersionModal } from "../modals/CreateVersionModal";
import { RollbackModal } from "../modals/RollbackModal";
import { CompareVersionsModal } from "../modals/CompareVersionsModal";
import { getCurrentUserRole, hasClientPermission, PERMISSIONS } from "@/lib/api-client";

export function VersionsTab({ application, versions, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedValidationVer, setSelectedValidationVer] = useState(null);
  const [selectedPublishVer, setSelectedPublishVer] = useState(null);
  const [selectedCompareVer, setSelectedCompareVer] = useState(null);
  const [inspectingSnapshotVer, setInspectingSnapshotVer] = useState(null);
  const role = getCurrentUserRole();

  const activeVersion = versions.find((v) => v.id === application.publishedVersionId);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            Gestionnaire des Versions du Pack (Specs Section 13 & 14)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Séparation stricte entre version active en production et versions en cours de développement (Drafts).
          </p>
        </div>

        {role !== "VIEWER" && (
          <div className="flex items-center gap-2">
            {versions.length > 1 && hasClientPermission(PERMISSIONS.ROLLBACK_VERSION) && (
              <button
                onClick={() => setShowRollbackModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-2xs"
              >
                <History className="w-4 h-4 text-amber-600" />
                <span>Restaurer / Rollback</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle version</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Version Banner */}
      {activeVersion ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Version actuellement Active
                  </span>
                  <StatusBadge status="PUBLISHED" size="sm" />
                </div>
                <h3 className="text-2xl font-black font-mono text-emerald-950 mt-0.5">v{activeVersion.versionNumber}</h3>
                <p className="text-xs text-emerald-800/80 mt-1">
                  {activeVersion.comment || "Version active déployée sur l'environnement cible."}
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-emerald-800 space-y-1 sm:border-l sm:border-emerald-200 sm:pl-6">
              <p>
                Publiée le :{" "}
                <strong>{new Date(activeVersion.publishedAt || activeVersion.createdAt).toLocaleString("fr-FR")}</strong>
              </p>
              <p>
                Auteur : <strong>{activeVersion.createdBy}</strong>
              </p>
              <p>
                Environnement : <strong className="uppercase">{application.environment}</strong>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900">Aucune version publiée en production</p>
              <p className="text-[11px] text-amber-700">Sélectionnez une version ci-dessous, validez-la puis cliquez sur Publier.</p>
            </div>
          </div>
        </div>
      )}

      {/* Version List */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Historique des Versions ({versions.length})</span>
          <span className="text-[11px] text-slate-400">Ordre chronologique décroissant</span>
        </div>

        <div className="divide-y divide-slate-100">
          {versions.map((ver) => {
            const isCurrentlyPublished = ver.id === application.publishedVersionId;

            return (
              <div
                key={ver.id}
                className={`p-5 transition-colors hover:bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCurrentlyPublished ? "bg-emerald-50/20" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isCurrentlyPublished
                        ? "bg-emerald-100 text-emerald-700"
                        : ver.status === "DRAFT"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <GitBranch className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold font-mono text-slate-900">v{ver.versionNumber}</span>
                      <StatusBadge status={ver.status} size="sm" />
                      {isCurrentlyPublished && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          En Ligne
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{ver.comment || "Aucune description de version."}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Créée le {new Date(ver.createdAt).toLocaleString("fr-FR")}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {ver.createdBy}
                      </span>
                      {ver.validatedAt && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Validée le {new Date(ver.validatedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setInspectingSnapshotVer(ver)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Inspecter le snapshot JSON de cette version"
                  >
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>Snapshot JSON</span>
                  </button>

                  {versions.length > 1 && (
                    <button
                      onClick={() => setSelectedCompareVer(ver)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Comparer cette version avec une autre"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Comparer</span>
                    </button>
                  )}

                  {role !== "VIEWER" && (
                    <button
                      onClick={() => setSelectedValidationVer(ver)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>
                  )}

                  {hasClientPermission(PERMISSIONS.PUBLISH_VERSION) && (
                    <button
                      onClick={() => setSelectedPublishVer(ver)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publier</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspect Snapshot Modal */}
      {inspectingSnapshotVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Snapshot Pack — Version {inspectingSnapshotVer.versionNumber}
                </h3>
              </div>
              <button onClick={() => setInspectingSnapshotVer(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="mt-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <pre>{JSON.stringify(inspectingSnapshotVer.snapshot, null, 2)}</pre>
            </div>
            <div className="flex justify-end pt-3 mt-3 border-t border-slate-800">
              <button
                onClick={() => setInspectingSnapshotVer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateVersionModal
        application={application}
        versions={versions}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={onRefresh}
      />

      <ValidationModal
        application={application}
        version={selectedValidationVer}
        isOpen={!!selectedValidationVer}
        onClose={() => setSelectedValidationVer(null)}
        onOpenPublish={(v) => {
          setSelectedValidationVer(null);
          setSelectedPublishVer(v);
        }}
      />

      <PublishModal
        application={application}
        version={selectedPublishVer}
        isOpen={!!selectedPublishVer}
        onClose={() => setSelectedPublishVer(null)}
        onPublished={onRefresh}
      />

      <RollbackModal
        application={application}
        versions={versions}
        isOpen={showRollbackModal}
        onClose={() => setShowRollbackModal(false)}
        onRollbackComplete={onRefresh}
      />

      <CompareVersionsModal
        application={application}
        v1={selectedCompareVer}
        versions={versions}
        isOpen={!!selectedCompareVer}
        onClose={() => setSelectedCompareVer(null)}
      />
    </div>
  );
}

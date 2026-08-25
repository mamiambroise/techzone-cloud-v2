"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GitBranch, Send, ShieldCheck, CheckCircle2, ArrowRight, Database, Layers, Menu, FileText, Workflow, Sparkles, AlertCircle, Copy, History, Check } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { ValidationModal } from "../modals/ValidationModal";
import { PublishModal } from "../modals/PublishModal";
import { CreateVersionModal } from "../modals/CreateVersionModal";
import { RollbackModal } from "../modals/RollbackModal";
export function OverviewTab({
  application,
  versions,
  activities,
  onRefresh
}) {
  const [selectedVersionForValidation, setSelectedVersionForValidation] = useState(null);
  const [selectedVersionForPublish, setSelectedVersionForPublish] = useState(null);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const activeVersion = versions.find(v => v.id === application.publishedVersionId) || null;
  const draftVersion = versions.find(v => v.status === "DRAFT" || v.status === "READY" || v.status === "TESTING") || versions[0] || null;

  // Snapshot details from current or active version
  const latestSnapshot = draftVersion?.snapshot || activeVersion?.snapshot || {};
  const dataModelsCount = Array.isArray(latestSnapshot.dataModels) ? latestSnapshot.dataModels.length : 0;
  const featuresCount = Array.isArray(latestSnapshot.features) ? latestSnapshot.features.length : 0;
  const menusCount = Array.isArray(latestSnapshot.menus) ? latestSnapshot.menus.length : 0;
  const pagesCount = Array.isArray(latestSnapshot.pages) ? latestSnapshot.pages.length : 0;
  const copyAppId = () => {
    navigator.clipboard.writeText(application.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };
  const lifecycleStages = ["DRAFT", "CONFIGURING", "READY", "TESTING", "ACTIVE"];
  const currentStatusIndex = lifecycleStages.indexOf(application.status);
  return <div className="space-y-6">
      {/* 1. Lifecycle Stepper Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Progression du Cycle de Vie (Specs Section 9 & 11)</h3>
            <p className="text-xs text-slate-500">Flux standard: DRAFT → CONFIGURING → READY → TESTING → ACTIVE</p>
          </div>
          <StatusBadge status={application.status} size="lg" />
        </div>

        <div className="grid grid-cols-5 gap-2 pt-2">
          {lifecycleStages.map((stage, idx) => {
          const isCompleted = currentStatusIndex > idx;
          const isCurrent = currentStatusIndex === idx;
          return <div key={stage} className={`p-3 rounded-2xl border text-center transition-all ${isCurrent ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs" : isCompleted ? "bg-emerald-50/60 border-emerald-200 text-emerald-800" : "bg-slate-50/60 border-slate-200/60 text-slate-400"}`}>
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : isCurrent ? <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                </div>
                <p className={`text-[11px] font-bold ${isCurrent ? "text-indigo-900" : isCompleted ? "text-emerald-800" : "text-slate-500"}`}>
                  {stage}
                </p>
              </div>;
        })}
        </div>
      </div>

      {/* 2. Key Version Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Published Version Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Version Publiée Active (En Ligne)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                PROD
              </span>
            </div>

            {activeVersion ? <div className="py-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-emerald-950">v{activeVersion.versionNumber}</span>
                  <span className="text-xs text-emerald-700 font-semibold">({activeVersion.status})</span>
                </div>
                <p className="text-xs text-emerald-800/80 line-clamp-2">
                  {activeVersion.comment || "Version actuellement exploitée en environnement cible."}
                </p>
                <div className="pt-2 text-[11px] text-emerald-700 space-y-1">
                  <p>Publiée le : <strong>{new Date(activeVersion.publishedAt || activeVersion.createdAt).toLocaleString("fr-FR")}</strong></p>
                  <p>Par : <strong>{activeVersion.createdBy}</strong></p>
                </div>
              </div> : <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">Aucune version publiée actuellement</p>
                <p className="text-[11px] text-slate-400">Validez et publiez un brouillon pour activer cette application.</p>
              </div>}
          </div>

          <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
            <Link href={`/business-manager/applications/${application.id}/versions`} className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              <span>Gérer les versions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {versions.length > 1 && <button onClick={() => setShowRollbackModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors">
                <History className="w-3.5 h-3.5" />
                <span>Rollback</span>
              </button>}
          </div>
        </div>

        {/* Latest Draft / In-Preparation Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                Dernière Version en Préparation
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-xs">
                DRAFT / DEV
              </span>
            </div>

            {draftVersion ? <div className="py-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-indigo-950">v{draftVersion.versionNumber}</span>
                  <StatusBadge status={draftVersion.status} size="sm" />
                </div>
                <p className="text-xs text-indigo-900/80 line-clamp-2">
                  {draftVersion.comment || "Snapshot de configuration prêt pour validation."}
                </p>
                <div className="pt-2 text-[11px] text-indigo-700 space-y-1">
                  <p>Créée le : <strong>{new Date(draftVersion.createdAt).toLocaleString("fr-FR")}</strong></p>
                  <p>Validée : <strong>{draftVersion.validatedAt ? new Date(draftVersion.validatedAt).toLocaleString("fr-FR") : "Non validée"}</strong></p>
                </div>
              </div> : null}
          </div>

          <div className="pt-4 border-t border-indigo-100 flex items-center justify-between gap-2">
            <button onClick={() => setShowCreateVersionModal(true)} className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1">
              <span>+ Nouvelle Version</span>
            </button>

            <div className="flex items-center gap-2">
              {draftVersion && <>
                  <button onClick={() => setSelectedVersionForValidation(draftVersion)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Valider</span>
                  </button>

                  <button onClick={() => setSelectedVersionForPublish(draftVersion)} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors">
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier</span>
                  </button>
                </>}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pack Container Readiness Matrix (Specs Section 67 & 68) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Conteneur Pack & Point de Rattachement Futur (Specs Section 67 & 68)
            </h3>
            <p className="text-xs text-slate-500">
              Chaque élément du Pack est versionné au niveau de la version d'Application active.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            Socle P0.1 Opérationnel
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Database className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase">P0.2</span>
            </div>
            <p className="text-lg font-black text-slate-900">{dataModelsCount}</p>
            <p className="text-[11px] font-semibold text-slate-600">Modèles de Données</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600 uppercase">P0.3</span>
            </div>
            <p className="text-lg font-black text-slate-900">{featuresCount}</p>
            <p className="text-[11px] font-semibold text-slate-600">Fonctionnalités</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Menu className="w-4 h-4 text-purple-600" />
              <span className="text-[10px] font-bold text-purple-600 uppercase">P0.3</span>
            </div>
            <p className="text-lg font-black text-slate-900">{menusCount || 2}</p>
            <p className="text-[11px] font-semibold text-slate-600">Menus Navigation</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase">P0.4</span>
            </div>
            <p className="text-lg font-black text-slate-900">{pagesCount || 1}</p>
            <p className="text-[11px] font-semibold text-slate-600">Pages Applicatives</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Workflow className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold text-amber-600 uppercase">P0.8</span>
            </div>
            <p className="text-lg font-black text-slate-900">0</p>
            <p className="text-[11px] font-semibold text-slate-600">Workflows</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center justify-between text-indigo-600 mb-1">
              <GitBranch className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Versions</span>
            </div>
            <p className="text-lg font-black text-indigo-950">{versions.length}</p>
            <p className="text-[11px] font-semibold text-indigo-800">Versions Pack</p>
          </div>
        </div>
      </div>

      {/* 4. Technical Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm md:col-span-2">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">Métadonnées Techniques & Identifiants Immobiles</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">ID Technique (UUID Immuable)</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-700 truncate">{application.id}</span>
                <button onClick={copyAppId} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors" title="Copier l'identifiant">
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Code Technique Normalisé</span>
              <span className="font-mono text-xs font-bold text-indigo-700">{application.code}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Créateur / Auteur</span>
              <span className="font-semibold text-slate-700">{application.createdBy}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Verrouillage Optimiste</span>
              <span className="font-mono text-xs font-bold text-slate-700">v{application.version}</span>
            </div>
          </div>
        </div>

        {/* Quick Help Box */}
        <div className="p-6 rounded-3xl bg-indigo-900 text-white shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              Scénario P0.1 Garanti
            </h4>
            <p className="text-xs text-indigo-200 mt-2 leading-relaxed">
              Vous pouvez configurer, valider une version, la publier en production, préparer une version suivante, faire un rollback et cloner sans aucune perte d'intégrité.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-indigo-700/60 flex items-center justify-between text-xs">
            <Link href="/business-manager/e2e-suite" className="text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1.5">
              <span>Lancer le test E2E automatique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ValidationModal application={application} version={selectedVersionForValidation} isOpen={!!selectedVersionForValidation} onClose={() => setSelectedVersionForValidation(null)} onOpenPublish={v => {
      setSelectedVersionForValidation(null);
      setSelectedVersionForPublish(v);
    }} />

      <PublishModal application={application} version={selectedVersionForPublish} isOpen={!!selectedVersionForPublish} onClose={() => setSelectedVersionForPublish(null)} onPublished={onRefresh} />

      <CreateVersionModal application={application} versions={versions} isOpen={showCreateVersionModal} onClose={() => setShowCreateVersionModal(false)} onCreated={onRefresh} />

      <RollbackModal application={application} versions={versions} isOpen={showRollbackModal} onClose={() => setShowRollbackModal(false)} onRollbackComplete={onRefresh} />
    </div>;
}
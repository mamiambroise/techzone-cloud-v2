"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, GitCommit, Send, ChevronRight } from "lucide-react";
import { EnvironmentBadge, StatusBadge } from "../ui/StatusBadge";
import { IconRenderer } from "../ui/IconRenderer";
import { CloneModal } from "../modals/CloneModal";
import { TransitionModal } from "../modals/TransitionModal";
import { getCurrentUserRole } from "@/lib/api-client";
export function WorkspaceHeader({
  application,
  onRefresh,
  onOpenPublish
}) {
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const role = getCurrentUserRole();
  return <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
        <Link href="/business-manager" className="hover:text-indigo-600 transition-colors">
          Business Manager
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/business-manager/applications" className="hover:text-indigo-600 transition-colors">
          Applications
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-bold">{application.name}</span>
      </nav>

      {/* Main Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left App Identity */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 flex-shrink-0">
            <IconRenderer name={application.icon} className="w-7 h-7" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{application.name}</h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
                {application.code}
              </span>
              <StatusBadge status={application.status} size="md" />
              <EnvironmentBadge environment={application.environment} />
            </div>

            <p className="text-xs text-slate-500 mt-1 max-w-2xl line-clamp-1">
              {application.description || "Aucune description fournie pour cette application métier."}
            </p>

            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-medium">
              <span>Catégorie: <strong className="text-slate-600">{application.category || "Général"}</strong></span>
              <span>•</span>
              <span>
                Version Publiée:{" "}
                <strong className="text-indigo-600 font-mono">
                  {application.publishedVersionNumber ? `v${application.publishedVersionNumber}` : "Non publiée"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Dernière maj:{" "}
                <strong className="text-slate-600">
                  {new Date(application.updatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        {role !== "VIEWER" && <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowTransitionModal(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs active:scale-95">
              <GitCommit className="w-4 h-4 text-amber-600" />
              <span>Changer Statut</span>
            </button>

            <button onClick={() => setShowCloneModal(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs active:scale-95">
              <Copy className="w-4 h-4 text-indigo-600" />
              <span>Cloner</span>
            </button>

            {onOpenPublish && <button onClick={onOpenPublish} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
                <Send className="w-4 h-4" />
                <span>Publier une Version</span>
              </button>}
          </div>}
      </div>

      {/* Modals */}
      <CloneModal application={application} isOpen={showCloneModal} onClose={() => setShowCloneModal(false)} />
      <TransitionModal application={application} isOpen={showTransitionModal} onClose={() => setShowTransitionModal(false)} onUpdated={onRefresh} />
    </div>;
}
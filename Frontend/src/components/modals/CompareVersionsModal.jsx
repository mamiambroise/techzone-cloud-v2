"use client";

import React, { useState, useEffect } from "react";
import { GitCompare, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { StatusBadge } from "../ui/StatusBadge";

export function CompareVersionsModal({ application, v1, versions, isOpen, onClose }) {
  const [selectedV2Id, setSelectedV2Id] = useState("");
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);

  useEffect(() => {
    if (versions.length > 1 && v1) {
      const other = versions.find((v) => v.id !== v1.id);
      if (other) setSelectedV2Id(other.id);
    }
  }, [v1, versions]);

  useEffect(() => {
    if (application && v1 && selectedV2Id) {
      setLoading(true);
      api
        .compareVersions(application.id, v1.id, selectedV2Id)
        .then((res) => {
          if (res.success) setCompareData(res.data);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, v1, selectedV2Id]);

  if (!isOpen || !application || !v1) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Comparateur de Versions</h3>
              <p className="text-xs text-slate-500">{application.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 my-4 flex-shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-400">Version A (Base)</p>
            <p className="text-sm font-black text-slate-800 font-mono mt-0.5">v{v1.versionNumber}</p>
            <div className="mt-1">
              <StatusBadge status={v1.status} size="sm" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <p className="text-[10px] font-bold uppercase text-indigo-600">Version B (Comparée)</p>
            <select
              value={selectedV2Id}
              onChange={(e) => setSelectedV2Id(e.target.value)}
              className="w-full mt-1 h-8 px-2 rounded-xl bg-white border border-indigo-200 text-xs font-mono font-bold text-indigo-900 focus:outline-none"
            >
              {versions
                .filter((v) => v.id !== v1.id)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} ({v.status})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : compareData ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 mb-2">Métadonnées Snapshot</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Créée le :</span>
                    <span className="font-medium text-slate-700">
                      {new Date(compareData.v1?.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Créée le :</span>
                    <span className="font-medium text-slate-700">
                      {compareData.v2?.createdAt ? new Date(compareData.v2.createdAt).toLocaleString("fr-FR") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                <p className="text-indigo-400 font-bold mb-2">// Configuration Snapshot Diff (JSON)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 font-bold mb-1">--- v{v1.versionNumber} ---</p>
                    <pre className="text-[10px] text-slate-300">
                      {JSON.stringify(compareData.v1?.snapshot || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold mb-1">--- v{compareData.v2?.versionNumber} ---</p>
                    <pre className="text-[10px] text-emerald-300">
                      {JSON.stringify(compareData.v2?.snapshot || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 flex-shrink-0 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

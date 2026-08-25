"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, XCircle, AlertTriangle, CheckCircle2, Loader2, X, GitBranch } from "lucide-react";
import { dm } from "@/lib/api-client";

// Specs P0.2 §23 (Impact Analysis) / C4 §13.17-13.18 & §14.13 (Impact Analysis Panel):
// "Avant une modification structurante, le système doit indiquer ce qui risque d'être cassé."
// This is a reusable confirmation gate: any caller proposing a structural change (field type
// change, field/relation removal, entity archive) opens this modal with the proposed `change`
// payload; the backend Impact/Risk Engine (SchemaService.impactAnalysis) computes the real risk
// level and affected dependents — the Frontend never recalculates this itself, it only renders
// the backend's verdict and gates confirmation on it.

const RISK_META = {
  SAFE: { label: "SAFE", cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  WARNING: { label: "WARNING", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  BREAKING: { label: "BREAKING", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  DATA_LOSS_RISK: { label: "DATA LOSS RISK", cls: "bg-rose-100 text-rose-800 border-rose-300", icon: ShieldAlert },
};

/**
 * @param {object} props
 * @param {string} props.appId
 * @param {string} props.versionId
 * @param {object|null} props.change - the proposed change payload sent to POST .../schema/impact,
 *   e.g. { kind: "FIELD_TYPE_CHANGE", fieldId, proposedType } — null/undefined keeps the modal closed.
 * @param {string} props.title - short label of the operation being confirmed (e.g. "Changer le type du champ price")
 * @param {(report: any) => void} props.onConfirm - called once the user has explicitly confirmed
 * @param {() => void} props.onCancel
 */
export function ImpactAnalysisModal({ appId, versionId, change, title, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!change) {
      setReport(null);
      setError(null);
      setAcknowledged(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReport(null);
    setAcknowledged(false);
    dm.impactAnalysis(appId, versionId, change).then((res) => {
      if (cancelled) return;
      if (res.success) setReport(res.data);
      else setError(res.error?.message || "Échec de l'analyse d'impact.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, versionId, change]);

  if (!change) return null;

  const risk = report?.riskLevel;
  const meta = RISK_META[risk] || RISK_META.WARNING;
  const RiskIcon = meta.icon;
  const requiresAck = risk === "BREAKING" || risk === "DATA_LOSS_RISK";
  const canConfirm = !loading && !error && report && (!requiresAck || acknowledged);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setApplying(true);
    try {
      await onConfirm(report);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Analyse d'impact</h3>
              <p className="text-[11px] text-slate-500">{title || "Modification structurante du Data Model"}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500">Calcul du risque et des dépendances impactées…</p>
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : report ? (
            <>
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${meta.cls}`}>
                <RiskIcon className="w-4.5 h-4.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black">{meta.label}</p>
                  <p className="text-[11px] opacity-80">
                    {report.affectedComponents.length} élément(s) potentiellement affecté(s)
                  </p>
                </div>
              </div>

              {report.warnings.length > 0 && (
                <ul className="space-y-1.5">
                  {report.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(report.directDependencies.length > 0 || report.indirectDependencies.length > 0) && (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Dépendances impactées
                  </div>
                  {report.directDependencies.map((d, i) => (
                    <div key={`d${i}`} className="px-3.5 py-2 flex items-center gap-2 text-xs">
                      <GitBranch className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-mono font-bold text-slate-700">{d.label}</span>
                      <span className="text-[10px] text-slate-400">{d.dependencyType} • direct</span>
                    </div>
                  ))}
                  {report.indirectDependencies.map((d, i) => (
                    <div key={`i${i}`} className="px-3.5 py-2 flex items-center gap-2 text-xs">
                      <GitBranch className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <span className="font-mono font-bold text-slate-600">{d.label}</span>
                      <span className="text-[10px] text-slate-400">indirect</span>
                    </div>
                  ))}
                </div>
              )}

              {report.requiredActions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                  <p className="font-bold">Actions requises :</p>
                  <ul className="list-disc list-inside space-y-0.5 text-indigo-800/90 pl-1">
                    {report.requiredActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {requiresAck && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Je comprends le risque <strong>{meta.label}</strong> et je confirme vouloir continuer.
                  </span>
                </label>
              )}
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || applying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Confirmer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X, Loader2, ShieldCheck, RefreshCw, Send } from "lucide-react";
import { api } from "@/lib/api-client";

const STATUS_ICONS = {
  PASS: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  FAIL: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
};

export function ValidationModal({ application, version, isOpen, onClose, onOpenPublish }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runValidation = async () => {
    if (!application || !version) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.validateVersion(application.id, version.id);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error?.message || "Échec de la validation");
      }
    } catch (err) {
      setError(err.message || "Erreur de validation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && application && version) {
      runValidation();
    } else {
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, application, version]);

  if (!isOpen || !application || !version) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Validation de la Version {version.versionNumber}</h3>
              <p className="text-xs text-slate-500">{application.name} • Contrôles de pré-publication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto space-y-4 flex-1 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold text-slate-600">Exécution des contrôles d'intégrité backend...</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Vérification du schéma, métadonnées, état de cycle de vie et conformité SemVer.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Erreur de validation</p>
                <p>{error}</p>
              </div>
            </div>
          ) : result ? (
            <>
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  result.canPublish
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.canPublish ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">
                      {result.canPublish ? "Prêt pour Publication" : "Validation Échouée"}
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {result.canPublish
                        ? "Tous les contrôles critiques sont validés. La version peut être publiée."
                        : "Des blocages critiques empêchent la publication de cette version."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold pl-3 border-l border-current/20">
                  <span className="text-emerald-700">{result.summary.passed} Validés</span>
                  {result.summary.warnings > 0 && (
                    <span className="text-amber-700">• {result.summary.warnings} Avert.</span>
                  )}
                  {result.summary.failed > 0 && (
                    <span className="text-red-700">• {result.summary.failed} Erreurs</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Détail des vérifications Backend :</p>
                {result.checks.map((check) => (
                  <div
                    key={check.code}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {STATUS_ICONS[check.status]}
                      <div>
                        <p className="font-bold text-slate-800">{check.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{check.message}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        check.status === "PASS"
                          ? "bg-emerald-100 text-emerald-800"
                          : check.status === "WARNING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-shrink-0 mt-4">
          <button
            type="button"
            onClick={runValidation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Re-vérifier</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Fermer
            </button>

            {result?.canPublish && onOpenPublish && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPublish(version);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Publier cette version</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

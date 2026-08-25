"use client";

import React, { useState, useEffect } from "react";
import { Send, X, AlertCircle, Loader2, Sparkles, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import confetti from "canvas-confetti";

const ENVIRONMENTS = ["DEVELOPMENT", "TEST", "STAGING", "PRODUCTION"];

const CHECK_ICONS = {
  PASS: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
  WARNING: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  FAIL: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
};

export function PublishModal({ application, version, isOpen, onClose, onPublished }) {
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Specs §39 (F13/Publication Dialog): show the validation result and disable the
  // publish button while validation blocks the operation. Re-run automatically whenever
  // the modal is opened for a given application/version, mirroring ValidationModal.
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const runValidation = async () => {
    if (!application || !version) return;
    setValidating(true);
    setValidationError(null);
    try {
      const res = await api.validateVersion(application.id, version.id);
      if (res.success && res.data) {
        setValidation(res.data);
      } else {
        setValidationError(res.error?.message || "Échec de la validation");
      }
    } catch (err) {
      setValidationError(err.message || "Erreur de validation");
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (isOpen && application && version) {
      setError(null);
      runValidation();
    } else {
      setValidation(null);
      setValidationError(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, application?.id, version?.id]);

  if (!isOpen || !application || !version) return null;

  const canPublish = !!validation?.canPublish;

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!canPublish) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.publishVersion(application.id, version.id, environment);

      if (!res.success) {
        setError(res.error?.message || "Échec de la publication.");
        setLoading(false);
        return;
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onClose();
      if (onPublished) onPublished();
    } catch (err) {
      setError(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Publier la Version {version.versionNumber}</h3>
              <p className="text-xs text-slate-500">{application.name} ({application.code})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Validation result (Specs §39) — the publish button below is gated on this */}
          <div>
            {validating ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Vérification des contrôles de pré-publication...</span>
              </div>
            ) : validationError ? (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            ) : validation ? (
              <div
                className={`rounded-2xl border overflow-hidden ${
                  canPublish ? "bg-emerald-50/70 border-emerald-200" : "bg-red-50/70 border-red-200"
                }`}
              >
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {canPublish ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <p className={`text-xs font-bold ${canPublish ? "text-emerald-900" : "text-red-900"}`}>
                      {canPublish ? "Validation OK — prêt pour publication" : "Validation échouée — publication bloquée"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runValidation}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60"
                    title="Re-vérifier"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {!canPublish && (
                  <ul className="px-3.5 pb-3.5 space-y-1.5">
                    {validation.checks
                      .filter((c) => c.status !== "PASS")
                      .map((c) => (
                        <li key={c.code} className="flex items-start gap-2 text-[11px] text-red-800">
                          {CHECK_ICONS[c.status]}
                          <span>
                            <strong>{c.name}</strong> — {c.message}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] font-bold uppercase text-slate-400">Version Publiée Actuelle</p>
              <p className="text-sm font-extrabold text-slate-800 mt-1 font-mono">
                {application.publishedVersionNumber ? `v${application.publishedVersionNumber}` : "Aucune (Brouillon)"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Sera marquée comme SUPERSEDED</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Nouvelle Version Cible</p>
              <p className="text-sm font-extrabold text-emerald-900 mt-1 font-mono">v{version.versionNumber}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Deviendra ACTIVE en ligne</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Environnement de Déploiement Cible *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={`p-2 rounded-2xl border text-center text-xs font-bold transition-all ${
                    environment === env
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Garantie Transactionnelle de Publication (Specs Section 17 & 48) :
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-indigo-800/90 pl-1">
              <li>Création atomique de l'enregistrement de Publication</li>
              <li>Mise à jour du statut d'Application vers <span className="font-bold">ACTIVE</span></li>
              <li>Archivage de la version précédente sans perte d'historique</li>
              <li>Traçabilité complète avec enregistrement d'audit</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || validating || !canPublish}
              title={!validating && !canPublish ? "La validation bloque la publication — corrigez les erreurs ci-dessus." : undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publication en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirmer la Publication</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { GitCommit, X, AlertCircle, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api-client";
import { ALLOWED_TRANSITIONS } from "@/lib/types/domain";
import { StatusBadge } from "../ui/StatusBadge";
export function TransitionModal({
  application,
  isOpen,
  onClose,
  onUpdated
}) {
  const [targetStatus, setTargetStatus] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  useEffect(() => {
    if (application) {
      const allowed = ALLOWED_TRANSITIONS[application.status] || [];
      setAllowedTransitions(allowed);
      setTargetStatus(allowed.length > 0 ? allowed[0] : "");
      setComment("");
      setError(null);
    }
  }, [application]);
  if (!isOpen || !application) return null;
  const handleTransition = async e => {
    e.preventDefault();
    if (!targetStatus) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.transitionStatus(application.id, targetStatus, comment.trim() || undefined, application.version);
      if (!res.success) {
        setError(res.error?.message || "Échec de la transition de statut.");
        setLoading(false);
        return;
      }
      onClose();
      if (onUpdated && res.data) {
        onUpdated(res.data);
      }
    } catch (err) {
      setError(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };
  const statusDescriptions = {
    DRAFT: "Brouillon initial",
    CONFIGURING: "En cours de configuration des métadonnées & pack",
    READY: "Configuration minimale considérée comme valide",
    TESTING: "En cours de validation & tests utilisateurs",
    ACTIVE: "Publié et en exploitation active",
    SUSPENDED: "Temporairement désactivé",
    ARCHIVED: "Retiré de l'exploitation normale (terminal)"
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Faire évoluer le Statut</h3>
              <p className="text-xs text-slate-500">{application.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransition} className="mt-4 space-y-4">
          {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>}

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Statut actuel :</span>
            <StatusBadge status={application.status} size="md" />
          </div>

          {allowedTransitions.length === 0 ? <div className="p-4 rounded-2xl bg-slate-100 text-center text-xs text-slate-600 space-y-1">
              <ShieldAlert className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-bold">Aucune transition possible</p>
              <p className="text-[11px] text-slate-400">Ce statut est terminal (ex: Archivé).</p>
            </div> : <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Choisir le prochain statut autorisé :</label>
              <div className="space-y-2">
                {allowedTransitions.map(st => <label key={st} className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${targetStatus === st ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                    <input type="radio" name="targetStatus" value={st} checked={targetStatus === st} onChange={() => setTargetStatus(st)} className="mt-1 text-indigo-600 focus:ring-indigo-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={st} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{statusDescriptions[st] || st}</p>
                    </div>
                  </label>)}
              </div>
            </div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Commentaire / Justification (optionnel)</label>
            <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="ex: Validation des tests effectuée avec succès" className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading || allowedTransitions.length === 0 || !targetStatus} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
              {loading ? <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mise à jour...</span>
                </> : <>
                  <span>Appliquer la Transition</span>
                  <ArrowRight className="w-4 h-4" />
                </>}
            </button>
          </div>
        </form>
      </div>
    </div>;
}
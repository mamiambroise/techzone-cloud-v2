"use client";

import React, { useState, useEffect } from "react";
import { GitBranch, X, AlertCircle, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { incrementSemver, isValidSemver } from "@/lib/utils/slug";
export function CreateVersionModal({
  application,
  versions,
  isOpen,
  onClose,
  onCreated
}) {
  const [versionNumber, setVersionNumber] = useState("");
  const [comment, setComment] = useState("");
  const [sourceVersionId, setSourceVersionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (application && versions.length > 0) {
      const latestVer = versions[0]?.versionNumber || "1.0.0";
      const nextMinor = incrementSemver(latestVer, "minor");
      setVersionNumber(nextMinor);
      setSourceVersionId(versions[0]?.id || "");
      setComment(`Nouvelle version ${nextMinor} en préparation`);
      setError(null);
    } else if (application) {
      setVersionNumber("1.0.0");
      setComment("Version initiale");
    }
  }, [application, versions]);
  if (!isOpen || !application) return null;
  const baseVer = versions[0]?.versionNumber || "1.0.0";
  const patchSug = incrementSemver(baseVer, "patch");
  const minorSug = incrementSemver(baseVer, "minor");
  const majorSug = incrementSemver(baseVer, "major");
  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    const vNum = versionNumber.trim();
    if (!isValidSemver(vNum)) {
      setError("Format SemVer invalide. Format requis: MAJOR.MINOR.PATCH (ex: 1.1.0, 2.0.0).");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createVersion(application.id, {
        versionNumber: vNum,
        comment: comment.trim() || undefined,
        sourceVersionId: sourceVersionId || undefined
      });
      if (!res.success) {
        setError(res.error?.message || "Échec de la création de la version.");
        setLoading(false);
        return;
      }
      onClose();
      if (onCreated && res.data) {
        onCreated(res.data);
      }
    } catch (err) {
      setError(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Créer une Nouvelle Version</h3>
              <p className="text-xs text-slate-500">{application.name} ({application.code})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>}

          {/* SemVer Quick Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Suggestions SemVer rapides :</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setVersionNumber(patchSug)} className={`p-2.5 rounded-2xl border text-center text-xs transition-all ${versionNumber === patchSug ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Correctif (Patch)</span>
                <span className="font-mono text-sm">{patchSug}</span>
              </button>

              <button type="button" onClick={() => setVersionNumber(minorSug)} className={`p-2.5 rounded-2xl border text-center text-xs transition-all ${versionNumber === minorSug ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Mineure (Minor)</span>
                <span className="font-mono text-sm">{minorSug}</span>
              </button>

              <button type="button" onClick={() => setVersionNumber(majorSug)} className={`p-2.5 rounded-2xl border text-center text-xs transition-all ${versionNumber === majorSug ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Majeure (Major)</span>
                <span className="font-mono text-sm">{majorSug}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de version cible *</label>
            <input type="text" required value={versionNumber} onChange={e => setVersionNumber(e.target.value)} placeholder="ex: 1.1.0" className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
          </div>

          {versions.length > 0 && <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Version source pour le snapshot de départ</label>
              <select value={sourceVersionId} onChange={e => setSourceVersionId(e.target.value)} className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
                {versions.map(v => <option key={v.id} value={v.id}>
                    v{v.versionNumber} ({v.status}) - {v.comment || "Sans commentaire"}
                  </option>)}
              </select>
            </div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes de version / Commentaire</label>
            <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Décrivez les fonctionnalités ou correctifs prévus dans cette version..." className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none" />
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-800">
            <p className="font-bold">Séparation Brouillon / Production (Specs Section 16) :</p>
            <p className="text-indigo-700/90 mt-0.5">
              La nouvelle version démarre en statut <span className="font-semibold text-indigo-900">DRAFT</span>. La version ACTIVE actuellement publiée reste intacte jusqu'à validation et publication explicite.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
              {loading ? <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Création en cours...</span>
                </> : <>
                  <Plus className="w-4 h-4" />
                  <span>Créer la Version</span>
                </>}
            </button>
          </div>
        </form>
      </div>
    </div>;
}
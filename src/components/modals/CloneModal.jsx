"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, X, AlertCircle, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { isValidApplicationCode, slugifyCode } from "@/lib/utils/slug";
import confetti from "canvas-confetti";
export function CloneModal({
  application,
  isOpen,
  onClose,
  onCloned
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (application) {
      const defaultName = `${application.name} Premium`;
      setName(defaultName);
      setCode(slugifyCode(defaultName));
      setDescription(application.description ? `Clone de ${application.name}: ${application.description}` : `Clone de ${application.name}`);
      setError(null);
    }
  }, [application]);
  if (!isOpen || !application) return null;
  const handleNameChange = e => {
    const val = e.target.value;
    setName(val);
    setCode(slugifyCode(val));
  };
  const handleClone = async e => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || name.length < 2) {
      setError("Le nom doit comporter au moins 2 caractères.");
      return;
    }
    if (!isValidApplicationCode(code)) {
      setError("Le code technique doit être en minuscules avec des tirets (ex: boutique-premium).");
      return;
    }
    setLoading(true);
    try {
      const res = await api.cloneApplication(application.id, {
        newName: name.trim(),
        newCode: code.trim(),
        description: description.trim(),
        category: application.category || undefined,
        icon: application.icon || undefined
      });
      if (!res.success) {
        setError(res.error?.message || "Échec du clonage.");
        setLoading(false);
        return;
      }
      confetti({
        particleCount: 60,
        spread: 60,
        origin: {
          y: 0.7
        }
      });
      onClose();
      if (onCloned && res.data) {
        onCloned(res.data);
      }
      if (res.data?.id) {
        router.push(`/business-manager/applications/${res.data.id}/overview`);
      }
    } catch (err) {
      setError(err.message || "Erreur inattendue lors du clonage.");
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dupliquer / Cloner l'Application</h3>
              <p className="text-xs text-slate-500">Source: <span className="font-semibold text-slate-700">{application.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleClone} className="mt-4 space-y-4">
          {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau nom de l'application *</label>
            <input type="text" required value={name} onChange={handleNameChange} placeholder="ex: Boutique Premium" className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau code technique unique *</label>
            <input type="text" required value={code} onChange={e => setCode(e.target.value.toLowerCase())} placeholder="ex: boutique-premium" className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
            <p className="text-[11px] text-slate-400 mt-1">
              Ce code doit être unique et conforme au format kebab-case (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (optionnelle)</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none" />
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              Garanties d'isolation du clone (Specs Section 12) :
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-indigo-700/90 pl-1">
              <li>Nouvel identifiant UUID unique et indépendant</li>
              <li>Nouvelle version 1.0.0 avec copie intégrale du snapshot</li>
              <li>Historique d'audit et cycle de vie séparés</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
              {loading ? <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Clonage en cours...</span>
                </> : <>
                  <span>Créer le Clone</span>
                  <ArrowRight className="w-4 h-4" />
                </>}
            </button>
          </div>
        </form>
      </div>
    </div>;
}
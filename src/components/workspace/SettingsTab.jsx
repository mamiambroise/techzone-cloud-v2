"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Lock, Archive, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { api, getCurrentUserRole } from "@/lib/api-client";
import { IconRenderer } from "../ui/IconRenderer";
export function SettingsTab({
  application,
  onRefresh
}) {
  const router = useRouter();
  const [name, setName] = useState(application.name);
  const [description, setDescription] = useState(application.description || "");
  const [category, setCategory] = useState(application.category || "Commerce");
  const [icon, setIcon] = useState(application.icon || "ShoppingBag");
  const [environment, setEnvironment] = useState(application.environment);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const role = getCurrentUserRole();
  const handleSave = async e => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSaving(true);
    try {
      const res = await api.updateApplication(application.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        environment,
        expectedVersion: application.version // Optimistic concurrency control
      });
      if (!res.success) {
        setErrorMsg(res.error?.message || "Échec de l'enregistrement des paramètres.");
        setSaving(false);
        return;
      }
      setSuccessMsg("Paramètres de l'application mis à jour avec succès.");
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message || "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  };
  const handleArchive = async () => {
    if (!window.confirm(`Confirmez-vous l'archivage de l'application "${application.name}" ? Cette action est irréversible dans le cycle standard.`)) {
      return;
    }
    setArchiving(true);
    setErrorMsg(null);
    try {
      const res = await api.archiveApplication(application.id);
      if (res.success) {
        router.push("/business-manager/applications");
      } else {
        setErrorMsg(res.error?.message || "Échec de l'archivage.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Erreur");
    } finally {
      setArchiving(false);
    }
  };
  const categories = ["Commerce", "Restauration", "Automobile", "Éducation", "Santé", "Hôtellerie", "Services", "Finance", "Logistique", "Autre"];
  const availableIcons = ["ShoppingBag", "Store", "UtensilsCrossed", "Wrench", "Car", "GraduationCap", "Pill", "HeartPulse", "Hotel", "Building2", "Briefcase", "Sparkles", "Package", "Layers", "Boxes", "Activity"];
  return <div className="space-y-6 max-w-4xl">
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Paramètres de l'Application (Specs Section 36)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configuration générale, identifiants immutables et gestion du cycle de vie.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Verrouillage Optimiste :</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700">
              v{application.version}
            </span>
          </div>
        </div>

        {errorMsg && <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Erreur de mise à jour</p>
              <p>{errorMsg}</p>
            </div>
          </div>}

        {successMsg && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>}

        {/* Readonly Section */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Champs Immutables & Identifiants Techniques (Specs Section 36)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Code Technique (Immutable après création)
              </span>
              <input type="text" disabled value={application.code} className="w-full h-10 px-3 rounded-xl bg-slate-200/60 border border-slate-300/50 font-mono text-xs text-slate-600 cursor-not-allowed" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                ID UUID Interne
              </span>
              <input type="text" disabled value={application.id} className="w-full h-10 px-3 rounded-xl bg-slate-200/60 border border-slate-300/50 font-mono text-[11px] text-slate-600 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Modifiable Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom de l'Application *</label>
            <input type="text" required disabled={role === "VIEWER"} value={name} onChange={e => setName(e.target.value)} className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie Métier</label>
              <select disabled={role === "VIEWER"} value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60">
                {categories.map(c => <option key={c} value={c}>
                    {c}
                  </option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Environnement Actif</label>
              <select disabled={role === "VIEWER"} value={environment} onChange={e => setEnvironment(e.target.value)} className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60 uppercase font-bold">
                <option value="DEVELOPMENT">DEVELOPMENT</option>
                <option value="TEST">TEST</option>
                <option value="STAGING">STAGING</option>
                <option value="PRODUCTION">PRODUCTION</option>
              </select>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Icône Visuelle</label>
            <div className="flex flex-wrap gap-2">
              {availableIcons.map(ic => <button key={ic} type="button" disabled={role === "VIEWER"} onClick={() => setIcon(ic)} className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${icon === ic ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                  <IconRenderer name={ic} className="w-5 h-5" />
                </button>)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description Métier</label>
            <textarea rows={3} disabled={role === "VIEWER"} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none disabled:opacity-60" />
          </div>
        </div>

        {role !== "VIEWER" && <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50">
              {saving ? <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </> : <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder les modifications</span>
                </>}
            </button>
          </div>}
      </form>

      {/* Danger Zone */}
      {role === "ADMIN" && <div className="p-6 rounded-3xl bg-red-50/60 border border-red-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-red-950 flex items-center gap-2">
              <Archive className="w-4 h-4 text-red-600" />
              Zone de Danger / Cycle Terminal
            </h3>
            <p className="text-xs text-red-700 mt-1">
              Archiver cette application retirera son statut d'exploitation et bloquera les publications ultérieures.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-red-600 font-medium">Statut actuel : {application.status}</p>
            <button type="button" disabled={archiving || application.status === "ARCHIVED"} onClick={handleArchive} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-colors">
              {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Archiver l'Application</span>
            </button>
          </div>
        </div>}
    </div>;
}
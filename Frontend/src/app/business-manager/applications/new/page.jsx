"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  ChevronRight,
  Check,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { isValidApplicationCode, slugifyCode } from "@/lib/utils/slug";
import { IconRenderer } from "@/components/ui/IconRenderer";
import confetti from "canvas-confetti";

const TEMPLATES = [
  {
    key: "ecommerce",
    title: "Boutique E-commerce",
    icon: "ShoppingBag",
    category: "Commerce",
    desc: "Catalogue produits, panier, passage de commande et gestion des clients.",
  },
  {
    key: "restaurant",
    title: "Restaurant & Carte",
    icon: "UtensilsCrossed",
    category: "Restauration",
    desc: "Plats du jour, gestion des tables et réservations de salle.",
  },
  {
    key: "garage",
    title: "Garage Automobile",
    icon: "Wrench",
    category: "Automobile",
    desc: "Véhicules, ordres de réparation et stocks de pièces détachées.",
  },
  {
    key: "ecole",
    title: "École & Inscriptions",
    icon: "GraduationCap",
    category: "Éducation",
    desc: "Suivi des élèves, classes, cours et enseignants.",
  },
  {
    key: "pharmacie",
    title: "Pharmacie & Santé",
    icon: "Pill",
    category: "Santé",
    desc: "Gestion des ordonnances, stocks médicaments et fournisseurs.",
  },
];

const AVAILABLE_ICONS = [
  "ShoppingBag",
  "Store",
  "UtensilsCrossed",
  "Wrench",
  "Car",
  "GraduationCap",
  "Pill",
  "HeartPulse",
  "Hotel",
  "Building2",
  "Briefcase",
  "Sparkles",
  "Package",
  "Layers",
];

export default function CreateApplicationWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [mode, setMode] = useState("empty");
  const [templateKey, setTemplateKey] = useState("ecommerce");
  const [sourceAppId, setSourceAppId] = useState("");
  const [existingApps, setExistingApps] = useState([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Commerce");
  const [icon, setIcon] = useState("ShoppingBag");
  const [environment, setEnvironment] = useState("DEVELOPMENT");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listApplications({ limit: 50 }).then((res) => {
      if (res.success && res.data) {
        setExistingApps(res.data);
        if (res.data.length > 0) setSourceAppId(res.data[0].id);
      }
    });
  }, []);

  const handleSelectTemplate = (tpl) => {
    setTemplateKey(tpl.key);
    setName(tpl.title);
    setCode(slugifyCode(tpl.title));
    setCategory(tpl.category);
    setIcon(tpl.icon);
    setDescription(tpl.desc);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setCode(slugifyCode(val));
  };

  const validateStep2 = () => {
    setError(null);
    if (!name.trim() || name.length < 2) {
      setError("Le nom de l'application doit comporter au moins 2 caractères.");
      return false;
    }
    if (!isValidApplicationCode(code)) {
      setError("Le code technique doit respecter le format kebab-case (minuscules et tirets, ex: ma-boutique).");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.createApplication({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        environment,
        templateType: mode,
        templateKey: mode === "template" ? templateKey : undefined,
        sourceAppId: mode === "duplicate" ? sourceAppId : undefined,
      });

      if (!res.success) {
        setError(res.error?.message || "Échec de la création de l'application.");
        setLoading(false);
        setStep(2);
        return;
      }

      setStep(4);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        if (res.data?.id) {
          router.push(`/business-manager/workspace?app=${res.data.id}`);
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Erreur inattendue");
      setLoading(false);
      setStep(2);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/business-manager/applications" className="hover:text-indigo-600 transition-colors">
          Applications
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-bold">Assistant de Création</span>
      </nav>

      {/* Stepper Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Assistant de Création d'Application (Specs Section 33)
            </h1>
            <p className="text-xs text-slate-500">Configurez le conteneur central et initialisez le Pack applicatif.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs font-mono self-start">
            Étape {step} / 3
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div
            className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
              step === 1
                ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                : step > 1
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 text-slate-400"
            }`}
          >
            1. Mode de Départ
          </div>
          <div
            className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
              step === 2
                ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                : step > 2
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 text-slate-400"
            }`}
          >
            2. Informations
          </div>
          <div
            className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
              step === 3 ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-slate-50 text-slate-400"
            }`}
          >
            3. Vérification
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Erreur de validation</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Mode Selection */}
      {step === 1 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-900">Choisissez comment démarrer :</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setMode("empty");
                setName("");
                setCode("");
                setDescription("");
                setCategory("Commerce");
                setIcon("Package");
              }}
              className={`p-5 rounded-3xl border text-left transition-all flex flex-col justify-between ${
                mode === "empty"
                  ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Application Vide</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Créez une application vierge avec le squelette et les menus par défaut.
                </p>
              </div>
              {mode === "empty" && (
                <span className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Sélectionné
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("template");
                handleSelectTemplate(TEMPLATES[0]);
              }}
              className={`p-5 rounded-3xl border text-left transition-all flex flex-col justify-between ${
                mode === "template"
                  ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Depuis un Modèle</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Initialisez un pack pré-configuré (Boutique, Restaurant, Garage, etc.).
                </p>
              </div>
              {mode === "template" && (
                <span className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Sélectionné
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("duplicate");
                if (existingApps.length > 0) {
                  setName(`${existingApps[0].name} Copie`);
                  setCode(slugifyCode(`${existingApps[0].name} Copie`));
                  setCategory(existingApps[0].category || "Commerce");
                  setIcon(existingApps[0].icon || "Package");
                }
              }}
              className={`p-5 rounded-3xl border text-left transition-all flex flex-col justify-between ${
                mode === "duplicate"
                  ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <Copy className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Dupliquer Existante</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Clonez une application déjà existante avec son snapshot de configuration.
                </p>
              </div>
              {mode === "duplicate" && (
                <span className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Sélectionné
                </span>
              )}
            </button>
          </div>

          {mode === "template" && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Choisissez le modèle métier :</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      templateKey === tpl.key
                        ? "bg-indigo-50 border-indigo-400 font-bold"
                        : "bg-slate-50 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <IconRenderer name={tpl.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{tpl.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "duplicate" && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Sélectionnez l'application source :</label>
              {existingApps.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune application existante disponible à cloner.</p>
              ) : (
                <select
                  value={sourceAppId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSourceAppId(id);
                    const found = existingApps.find((a) => a.id === id);
                    if (found) {
                      setName(`${found.name} (Clone)`);
                      setCode(slugifyCode(`${found.name} (Clone)`));
                      setCategory(found.category || "Commerce");
                      setIcon(found.icon || "Package");
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  {existingApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code}) - {a.status}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (mode === "empty" && !name) {
                  setName("Nouvelle Application");
                  setCode(slugifyCode("Nouvelle Application"));
                }
                setStep(2);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: General Information */}
      {step === 2 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-slate-900">Informations Générales de l'Application :</h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l'application *</label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="ex: Boutique de Prêt-à-porter"
              className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Code technique unique (kebab-case) *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="ex: boutique-pret-a-porter"
              className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Règle : Lettres minuscules, chiffres et tirets uniquement. Immutable après création.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie Métier</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Commerce">Commerce</option>
                <option value="Restauration">Restauration</option>
                <option value="Automobile">Automobile</option>
                <option value="Éducation">Éducation</option>
                <option value="Santé">Santé</option>
                <option value="Hôtellerie">Hôtellerie</option>
                <option value="Services">Services</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Environnement Initial</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              >
                <option value="DEVELOPMENT">DEVELOPMENT</option>
                <option value="TEST">TEST</option>
                <option value="STAGING">STAGING</option>
                <option value="PRODUCTION">PRODUCTION</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Icône Visuelle</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-3 rounded-2xl border transition-all ${
                    icon === ic
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <IconRenderer name={ic} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optionnelle)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif métier de l'application..."
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              <span>Vérifier le Résumé</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 3 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-900">Vérification & Confirmation de Création :</h2>

          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                <IconRenderer name={icon} className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{name}</h3>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                  {code}
                </span>
                <p className="text-xs text-slate-500 mt-1">{description || "Aucune description renseignée."}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Catégorie</span>
                <span className="font-bold text-slate-700">{category}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Statut Initial</span>
                <span className="font-bold text-slate-700">DRAFT</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Environnement</span>
                <span className="font-bold text-slate-700 uppercase">{environment}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Version Initiale</span>
                <span className="font-mono font-bold text-indigo-700">v1.0.0 (DRAFT)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Actions automatiques lors de la création :
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-indigo-800/90 pl-1">
              <li>
                Création de l'identifiant technique UUID et attribution du code <span className="font-mono">{code}</span>
              </li>
              <li>Initialisation de la première version de Pack 1.0.0</li>
              <li>Génération de l'événement d'audit `business.application.created`</li>
              <li>Ouverture immédiate du Workspace de travail</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modifier</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Création de l'application...</span>
                </>
              ) : (
                <>
                  <span>Créer et Ouvrir le Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="py-16 text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Application créée avec succès !</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Redirection automatique vers le Workspace de <strong className="text-slate-800">{name}</strong>...
          </p>
          <div className="flex justify-center pt-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        </div>
      )}
    </div>
  );
}

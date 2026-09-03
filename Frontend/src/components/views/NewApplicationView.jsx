// NewApplicationView.jsx — Create Application Wizard
import React, { useState } from 'react';
import {
  Boxes,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateSlug } from '../../lib/slug';
import { ICON_MAP, IconRenderer } from '../common/IconRenderer';

const ICON_OPTIONS = [
  'ShoppingBag',
  'Store',
  'UtensilsCrossed',
  'Wrench',
  'Car',
  'GraduationCap',
  'Pill',
  'HeartPulse',
  'Hotel',
  'Building2',
  'Briefcase',
  'Package',
  'Layers',
  'Boxes',
  'Activity',
  'FileText',
  'Database',
  'Workflow',
  'ShieldCheck',
  'Sparkles',
];

export function NewApplicationView() {
  const { createApplication, setCurrentView, showToast, applications } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    code: '',
    slug: '',
    category: 'Commerce',
    icon: 'ShoppingBag',
    description: '',
    tags: '',
    sourceType: 'CUSTOM',
    initialVersionNumber: '0.1.0',
    initialEnvironment: 'DEVELOPMENT',
  });

  const [errors, setErrors] = useState({});

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoCode = val
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .slice(0, 20);
    const autoSlug = generateSlug(val);
    setFormData((prev) => ({
      ...prev,
      name: val,
      code: prev.code || autoCode,
      slug: prev.slug || autoSlug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom de l application est obligatoire.';
    if (!formData.code.trim()) newErrors.code = 'Le code unique est obligatoire.';
    else if (applications.some((a) => a.code.toUpperCase() === formData.code.toUpperCase())) {
      newErrors.code = 'Ce code d application est déjà utilisé.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await createApplication({
      name: formData.name.trim(),
      shortName: formData.shortName.trim() || formData.name.trim(),
      code: formData.code.toUpperCase().trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      category: formData.category,
      icon: formData.icon,
      description: formData.description.trim(),
      tags: tagsArray,
      sourceType: formData.sourceType,
      initialVersionNumber: formData.initialVersionNumber || '0.1.0',
    });

    if (result?.success) {
      showToast(`Application ${result.data.name} créée avec succès`);
      setCurrentView('applications');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('applications')}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Nouvelle application métier</h1>
            <p className="text-xs text-slate-500">
              Définissez l identité et les paramètres de base de votre application.
            </p>
          </div>
        </div>
      </div>

      {/* Main Creation Card Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        {/* Section 1: Identité de l'application */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-600" />
            <span>1. Identité de l application</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nom complet de l application *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Boutique E-Commerce, Gestion de Flotte..."
                value={formData.name}
                onChange={handleNameChange}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nom court commercial
              </label>
              <input
                type="text"
                placeholder="Ex: Boutique, Flotte Auto..."
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Code technique unique (MAJUSCULES) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: BOUTIQUE_PREMIUM"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
              {errors.code && <p className="text-red-500 text-[11px] mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Slug URL
              </label>
              <input
                type="text"
                placeholder="Ex: boutique-premium"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Catégorisation & Visuel */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>2. Classification & Icône</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Catégorie métier</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Commerce">Commerce & Vente</option>
                <option value="Automobile">Automobile & Garage</option>
                <option value="Finance">Finance & Comptabilité</option>
                <option value="Services">Services & Prestations</option>
                <option value="Restauration">Restauration & Hôtellerie</option>
                <option value="Santé">Santé & Pharmacie</option>
                <option value="Éducation">Éducation & Formation</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Type de source</label>
              <select
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="CUSTOM">Personnalisée (Custom)</option>
                <option value="TEMPLATE">Depuis un modèle (Template)</option>
                <option value="SYSTEM">Système de base</option>
              </select>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-2 text-xs">Sélectionner une icône</label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: ic })}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    formData.icon === ic
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={ic}
                >
                  <IconRenderer name={ic} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">Description</label>
            <textarea
              rows={3}
              placeholder="Décrivez l objectif et les fonctionnalités principales..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentView('applications')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            Créer l application
          </button>
        </div>
      </form>
    </div>
  );
}

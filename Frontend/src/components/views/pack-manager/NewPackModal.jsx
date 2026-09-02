// NewPackModal.jsx — PM-CDC-02 Pack Creation Modal
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { slugifyCode } from '../../../lib/slug';
import { PACK_SOURCE_TYPE } from '../../../types/domain';
import {
  Boxes,
  X,
  Plus,
  Sparkles,
  Layers,
  Palette,
  Tag,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'cat_commerce', name: 'Commerce & Stock' },
  { id: 'cat_service', name: 'Services & CHR' },
  { id: 'cat_auto', name: 'Automobile' },
  { id: 'cat_reporting', name: 'Reporting & Décisionnel' },
  { id: 'cat_integration', name: 'Intégrations & Connecteurs' },
  { id: 'cat_custom', name: 'Personnalisé' },
];

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
  '#EF4444', // Red
];

const PRESET_ICONS = [
  'Boxes',
  'Receipt',
  'Utensils',
  'Wrench',
  'Layers',
  'TrendingUp',
  'ShoppingCart',
  'Truck',
  'Users',
  'Zap',
  'ShieldCheck',
  'Database',
];

export default function NewPackModal({ isOpen, onClose }) {
  const { createPack, packs } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('cat_commerce');
  const [sourceType, setSourceType] = useState(PACK_SOURCE_TYPE.CUSTOM);
  const [color, setColor] = useState('#3B82F6');
  const [iconKey, setIconKey] = useState('Boxes');
  const [tagsInput, setTagsInput] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!isCodeManual) {
      setCode(slugifyCode(val));
    }
    if (!shortName || shortName === name.slice(0, 16)) {
      setShortName(val.slice(0, 16));
    }
  };

  const handleCodeChange = (e) => {
    setIsCodeManual(true);
    setCode(slugifyCode(e.target.value));
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Le nom du pack est obligatoire';
    if (!code.trim()) newErrors.code = 'Le code technique est obligatoire';
    else if (packs.some((p) => p.code.toLowerCase() === code.toLowerCase() && p.status !== 'ARCHIVED')) {
      newErrors.code = 'Ce code pack est déjà utilisé dans ce tenant';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCategoryObj = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const result = createPack({
      name,
      code,
      shortName,
      description,
      categoryId,
      category: selectedCategoryObj.name,
      sourceType,
      color,
      iconKey,
      tags: parsedTags.length > 0 ? parsedTags : [code],
      targetAudience,
    });

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nouveau Pack Modulaire</h2>
              <p className="text-xs text-slate-500">PM-CDC-02 • Déclaration d'identité de package logiciel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Typology / Source selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Typologie du Pack <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: PACK_SOURCE_TYPE.CUSTOM, label: 'Personnalisé (Custom)', desc: 'Pack développé sur-mesure' },
                { id: PACK_SOURCE_TYPE.TEMPLATE, label: 'Modèle (Template)', desc: 'Gabarit prêt à instancier' },
                { id: PACK_SOURCE_TYPE.SYSTEM, label: 'Système (Core)', desc: 'Package plateforme standard' },
              ].map((typ) => (
                <button
                  key={typ.id}
                  type="button"
                  onClick={() => setSourceType(typ.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    sourceType === typ.id
                      ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-100 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs">{typ.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{typ.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Short Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nom complet du Pack <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Ex: Gestion de Stock & Inventaires"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                  errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:bg-white'
                } text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
              />
              {errors.name && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom court (UI)</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Ex: Stock"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Unique Technical Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Code technique unique <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Immuable une fois publié</span>
            </div>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ex: stock, sales, garage"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 font-mono border ${
                errors.code ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:bg-white'
              } text-blue-700 placeholder-slate-400 focus:outline-none transition-colors`}
            />
            {errors.code && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.code}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description fonctionnelle</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Décrivez les fonctionnalités et le périmètre métier couvert par ce pack..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed transition-colors"
            />
          </div>

          {/* Category & Visual Theme (Color / Icon) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Couleur d'accentuation</label>
              <div className="flex items-center gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform shadow-xs ${
                      color === c ? 'scale-125 ring-2 ring-blue-600 ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags & Metadata */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tags & Mots-clés (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ex: stock, entrepot, logistique, inventaire"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <span className="text-[11px] text-slate-500">
            Une version initiale <strong className="text-slate-800">v0.1.0-draft</strong> sera créée automatiquement.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Créer le Pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

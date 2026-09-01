// EditPackModal.jsx — PM-CDC-02 Pack Editing Modal
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Boxes,
  X,
  Save,
  Palette,
  Tag,
  AlertTriangle,
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
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#64748B',
  '#EF4444',
];

export default function EditPackModal({ isOpen, onClose, packToEdit }) {
  const { updatePack } = useApp();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('cat_commerce');
  const [color, setColor] = useState('#3B82F6');
  const [tagsInput, setTagsInput] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (packToEdit) {
      setName(packToEdit.name || '');
      setShortName(packToEdit.shortName || '');
      setDescription(packToEdit.description || '');
      setCategoryId(packToEdit.categoryId || 'cat_commerce');
      setColor(packToEdit.color || '#3B82F6');
      setTagsInput(packToEdit.metadata?.tags ? packToEdit.metadata.tags.join(', ') : '');
      setTargetAudience(packToEdit.metadata?.targetAudience || '');
    }
  }, [packToEdit]);

  if (!isOpen || !packToEdit) return null;

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Le nom du pack est obligatoire';
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

    const result = updatePack(packToEdit.id, {
      name,
      shortName,
      description,
      categoryId,
      category: selectedCategoryObj.name,
      color,
      metadata: {
        ...packToEdit.metadata,
        tags: parsedTags,
        targetAudience,
      },
    });

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070D1F]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: packToEdit.color || '#3B82F6' }}
            >
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Édition du Pack : {packToEdit.name}</h2>
              <p className="text-xs text-slate-400 font-mono">Code : {packToEdit.code} • Version doc : v{packToEdit.version || 1}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Readonly Code info */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-slate-400">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Identifiant technique stable</span>
              <span className="font-mono text-xs text-blue-400 font-bold">{packToEdit.code}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Immuable
            </span>
          </div>

          {/* Name & Short Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nom complet <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                  errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-blue-500'
                } text-white placeholder-slate-500 focus:outline-none`}
              />
              {errors.name && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom court (UI)</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Description fonctionnelle</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Couleur du Pack</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Tags (séparés par virgules)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-[#070D1F]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

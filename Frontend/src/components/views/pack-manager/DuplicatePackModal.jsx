// DuplicatePackModal.jsx — PM-CDC-02 Pack Duplication / Cloning Modal
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { slugifyCode } from '../../../lib/slug';
import {
  Copy,
  X,
  Boxes,
  CheckCircle2,
  AlertCircle,
  GitBranch,
} from 'lucide-react';

export default function DuplicatePackModal({ isOpen, onClose, packToClone }) {
  const { duplicatePack, packs } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [cloneLatestVersion, setCloneLatestVersion] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (packToClone) {
      setName(`${packToClone.name} (Copie)`);
      setCode(`${packToClone.code}-copy`);
    }
  }, [packToClone]);

  if (!isOpen || !packToClone) return null;

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Le nom du nouveau pack est obligatoire';
    if (!code.trim()) newErrors.code = 'Le code technique est obligatoire';
    else if (packs.some((p) => p.code.toLowerCase() === code.toLowerCase() && p.status !== 'ARCHIVED')) {
      newErrors.code = 'Ce code pack est déjà utilisé';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = duplicatePack(packToClone.id, {
      name,
      code,
      cloneLatestVersion,
    });

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070D1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dupliquer le Pack</h2>
              <p className="text-xs text-slate-400">Source : {packToClone.name} ({packToClone.code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nom de la copie <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setCode(slugifyCode(e.target.value));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                errors.name ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
              } text-white placeholder-slate-500 focus:outline-none`}
            />
            {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nouveau code technique <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(slugifyCode(e.target.value))}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-purple-300 border ${
                errors.code ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
              } placeholder-slate-500 focus:outline-none`}
            />
            {errors.code && <p className="text-[10px] text-rose-400 mt-1">{errors.code}</p>}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={cloneLatestVersion}
                onChange={(e) => setCloneLatestVersion(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
              <span className="font-bold">Cloner l'arborescence des modules & features</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              Une nouvelle version <span className="text-purple-400 font-bold">v0.1.0-draft</span> sera générée avec l'ensemble des modules ({packToClone.modulesCount}) et features ({packToClone.featuresCount}) de la source.
            </p>
          </div>
        </form>

        {/* Footer */}
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/30"
          >
            <Copy className="w-4 h-4" />
            <span>Cloner le Pack</span>
          </button>
        </div>
      </div>
    </div>
  );
}

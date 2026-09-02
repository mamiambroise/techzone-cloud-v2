// ArchivePackModal.jsx — PM-CDC-02 Pack Archival with Safety Check
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Archive,
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export default function ArchivePackModal({ isOpen, onClose, packToArchive }) {
  const { archivePack } = useApp();
  const [reason, setReason] = useState('Obsolescence fonctionnelle');
  const [confirmName, setConfirmName] = useState('');

  if (!isOpen || !packToArchive) return null;

  const isConfirmed = confirmName.trim().toLowerCase() === packToArchive.code.toLowerCase();

  const handleArchive = () => {
    if (!isConfirmed) return;
    archivePack(packToArchive.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070D1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Archivage du Pack</h2>
              <p className="text-xs text-slate-400 font-mono">{packToArchive.name} ({packToArchive.code})</p>
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
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300 leading-relaxed">
              <p className="font-bold text-rose-300">Attention : Conséquences de l'archivage</p>
              <p>
                L'archivage désactivera ce pack pour toute nouvelle composition applicative. Les versions publiées existantes resteront disponibles en lecture seule pour la conformité historique.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Motif de l'archivage</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Obsolescence fonctionnelle">Obsolescence fonctionnelle</option>
              <option value="Remplacé par un nouveau package">Remplacé par un nouveau package</option>
              <option value="Erreur de conception / Doublon">Erreur de conception / Doublon</option>
              <option value="Retrait commercial">Retrait commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Pour confirmer, veuillez saisir le code du pack : <span className="font-mono text-rose-400">{packToArchive.code}</span>
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={packToArchive.code}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-white border border-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

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
            disabled={!isConfirmed}
            onClick={handleArchive}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-rose-600/30"
          >
            <Archive className="w-4 h-4" />
            <span>Confirmer l'archivage</span>
          </button>
        </div>
      </div>
    </div>
  );
}

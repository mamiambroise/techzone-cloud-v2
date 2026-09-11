import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addApplication } from '../store/applicationsSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast, TENANTS } from '../store/platformSlice.js';
import { Boxes, X } from 'lucide-react';

export default function CreateAppModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const activeUser = useSelector((state) => state.platform.activeUser);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tenantScope, setTenantScope] = useState('tenant-core-global');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    dispatch(
      addApplication({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || 'Composant applicatif enregistré sur la plateforme Techzone Cloud.',
        tenantScope,
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: 'Application enregistrée',
        message: `${name} (${code.toUpperCase()}) a été créée avec une version DRAFT 1.0.0.`,
      })
    );

    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'CREATE_APPLICATION',
        resourceType: 'APPLICATION',
        resourceId: code.toUpperCase(),
        details: `Création de l'application ${name} avec scope tenant ${tenantScope}.`,
        status: 'SUCCESS',
      })
    );

    onClose();
    setCode('');
    setName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Boxes className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Déclarer une Nouvelle Application (PF-CDC-02)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code Technique Stable</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ex: BILLING-ENGINE"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom Lisible</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Moteur de Facturation & Abonnements"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Périmètre Tenant</label>
            <select
              value={tenantScope}
              onChange={(e) => setTenantScope(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {TENANTS.filter((t) => t.id !== 'all').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rôle fonctionnel, dépendances inter-packs..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all active:scale-95"
            >
              Créer l'Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { dataRuntimeService } from '../../../services/apiClient.js';
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

export function FieldAccessScreen({ resourceCode, fields = [] }) {
  const [resolvedFields, setResolvedFields] = useState(fields);
  useEffect(() => {
    if (fields.length || !resourceCode || resourceCode === '—') return;
    dataRuntimeService.resources().then(({ data }) => {
      const resource = Array.isArray(data) ? data.find((item) => item.resourceCode === resourceCode) : null;
      setResolvedFields(resource?.fields || []);
    }).catch(() => setResolvedFields([]));
  }, [fields, resourceCode]);
  return (
    <div className="tz-surface overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-bold text-slate-900">Accès aux champs : {resourceCode}</h2>
        <p className="text-xs text-slate-500">Contrôle granulaire de la visibilité et de l'édition par propriété</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-3">Champ</th>
              <th className="px-6 py-3 text-center">Lecture</th>
              <th className="px-6 py-3 text-center">Écriture</th>
              <th className="px-6 py-3">Masquage</th>
              <th className="px-6 py-3">Politique</th>
              <th className="px-6 py-3 text-center">Sensible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resolvedFields.map((f) => {
              const field = f.field || f.code;
              const read = f.read || f.readAccess || 'UNKNOWN';
              const write = f.write || f.writeAccess || 'UNKNOWN';
              const mask = f.mask || 'UNKNOWN';
              const policy = f.policy || f.policyName || 'Non exposée';
              const sensitive = Boolean(f.sensitive);
              return (
              <tr key={field} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{field}</td>
                <td className="px-6 py-4 text-center">
                  {read === 'ALLOW' ? (
                    <EyeIcon className="h-4 w-4 text-emerald-500 mx-auto" title="Autorisé" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 text-red-500 mx-auto" title="Refusé" />
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {write === 'ALLOW' ? (
                    <PencilIcon className="h-4 w-4 text-blue-500 mx-auto" title="Autorisé" />
                  ) : (
                    <LockClosedIcon className="h-4 w-4 text-slate-300 mx-auto" title="Lecture seule" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    mask === 'NONE' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
                  }`}>{mask}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-600">{policy}</td>
                <td className="px-6 py-4 text-center">
                  {sensitive && <span className="h-2 w-2 rounded-full bg-red-500 inline-block" title="Donnée sensible" />}
                </td>
              </tr>
              );
            })}
            {!resolvedFields.length && <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Aucune règle Field Access publiée pour cette entité.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RowPolicyScreen({ policies = [] }) {
  const [resolvedPolicies, setResolvedPolicies] = useState(policies);
  useEffect(() => {
    if (policies.length) return;
    dataRuntimeService.contract().then(({ data }) => {
      const contractPolicies = data?.policies || data?.rowPolicies || [];
      setResolvedPolicies(Array.isArray(contractPolicies) ? contractPolicies : []);
    }).catch(() => setResolvedPolicies([]));
  }, [policies]);
  return (
    <div className="tz-surface overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Politiques de lignes (Row Policies)</h2>
          <p className="text-xs text-slate-500">Filtrage dynamique au niveau de la base de données</p>
        </div>
        <span className="text-xs text-slate-500">Lecture seule</span>
      </div>
      <div className="p-6">
        <div className="grid gap-4">
          {resolvedPolicies.map((p, index) => (
            <div key={p.name || index} className="group p-5 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <ShieldCheckIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Entité: <span className="font-bold text-slate-700">{p.entity}</span> · Opération: <span className="font-bold text-slate-700">{p.operation}</span></p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>{p.status}</span>
              </div>
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-white group-hover:border-blue-100 transition-colors">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Condition Backend</p>
                <code className="text-xs text-slate-600 break-all">{p.condition}</code>
              </div>
            </div>
          ))}
          {!resolvedPolicies.length && <p className="py-12 text-center text-sm text-slate-500">Aucune Row Policy publiée pour le tenant courant.</p>}
        </div>
      </div>
    </div>
  );
}

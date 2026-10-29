import React, { useEffect, useState } from 'react';
import { dataRuntimeService } from '../../../services/apiClient.js';
import {
  CircleStackIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export function RepositoryRegistry({ resources = [] }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [resolvedResources, setResolvedResources] = useState(resources);
  useEffect(() => {
    if (resources.length) return;
    dataRuntimeService.resources().then(({ data }) => setResolvedResources(Array.isArray(data) ? data : [])).catch(() => setResolvedResources([]));
  }, [resources]);
  const repositories = resolvedResources.map((resource, index) => ({
    id: resource.resourceCode || `repo-${index}`,
    entity: resource.displayName || resource.resourceCode,
    repository: resource.repository || 'Résolution serveur',
    source: resource.resourceCode,
    provider: resource.provider || '—',
    operations: resource.operations || [],
    transaction: Boolean(resource.transaction),
    availability: resource.status || 'NON_MESURÉE',
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="tz-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Registre des Repositories</h2>
            <p className="text-xs text-slate-500">Cartographie des stockages physiques par entité métier</p>
          </div>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {repositories.length} Entrées
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Entité</th>
                <th className="px-6 py-3">Repository</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">État</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repositories.map(repo => (
                <tr key={repo.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{repo.entity}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{repo.repository}</td>
                  <td className="px-6 py-4 text-slate-600">{repo.source}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">{repo.provider}</span>
                  </td>
                  <td className="px-6 py-4">
                    {repo.transaction ? (
                      <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-bold uppercase">
                        <CheckCircleIcon className="h-3 w-3" /> Supporté
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Non supporté</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      repo.availability === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${repo.availability === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {repo.availability}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRepo(repo)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!repositories.length && <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Aucun repository publié pour ce tenant.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRepo && (
        <div className="tz-surface p-6 bg-slate-900 text-white animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CircleStackIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Détails Repository : {selectedRepo.repository}</h3>
                <p className="text-xs text-slate-400">Configuration runtime et capacités physiques</p>
              </div>
            </div>
            <button onClick={() => setSelectedRepo(null)} className="text-slate-400 hover:text-white transition-colors">
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Configuration</p>
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Provider Type</p>
                  <p className="text-sm font-medium">{selectedRepo.provider}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Isolation Level</p>
                  <p className="text-sm font-medium">Read Committed</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Connection Pooling</p>
                  <p className="text-sm font-medium">Enabled (max 20)</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Capacités & Ops</p>
              <div className="grid grid-cols-2 gap-3">
                {selectedRepo.operations.map(op => (
                  <div key={op} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold uppercase">{op}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">SUPPORTÉ</span>
                  </div>
                ))}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between opacity-50">
                  <span className="text-sm font-bold uppercase">STREAM</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 font-bold">INDISPONIBLE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

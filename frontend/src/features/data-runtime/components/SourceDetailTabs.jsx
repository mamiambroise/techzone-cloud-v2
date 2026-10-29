import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  WrenchIcon,
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { dataRuntimeService } from '../../../services/apiClient';
import { ModernSpinner } from '../../../components/Loaders';

const TABS = [
  { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
  { id: 'capabilities', label: 'Capabilities', icon: ShieldCheckIcon },
  { id: 'configuration', label: 'Configuration', icon: WrenchIcon },
  { id: 'contracts', label: 'Contracts', icon: DocumentTextIcon },
  { id: 'health', label: 'Health', icon: HeartIcon },
  { id: 'diagnostics', label: 'Diagnostics', icon: BeakerIcon },
  { id: 'history', label: 'History', icon: ClockIcon },
];

export function SourceDetailTabs({ resource }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    if (activeTab === 'history') {
      setLoading(true);
      dataRuntimeService.history()
        .then(res => {
          const filtered = Array.isArray(res.data) ? res.data.filter(h => h.resource === resource.resourceCode) : [];
          setHistory(filtered);
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab, resource.resourceCode]);

  useEffect(() => {
    dataRuntimeService.readiness().then(({ data }) => setReadiness(data)).catch(() => setReadiness(null));
  }, [resource.resourceCode]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="tz-surface p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Informations générales</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-sm text-slate-500">Nom</dt>
                    <dd className="text-sm font-medium text-slate-900">{resource.displayName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-sm text-slate-500">Code</dt>
                    <dd className="text-sm font-mono text-cyan-600">{resource.resourceCode}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-sm text-slate-500">Provider</dt>
                    <dd className="text-sm text-slate-900">{resource.provider}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-slate-500">Instance</dt>
                    <dd className="text-sm text-slate-900">{resource.instance}</dd>
                  </div>
                </dl>
              </div>
              <div className="tz-surface p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Statistiques d'utilisation</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{resource.health?.availability || '—'}</p>
                    <p className="text-xs text-slate-500">Disponibilité (source backend)</p>
                  </div>
                  <div className="h-10 w-24 bg-cyan-100 rounded flex items-center justify-center text-cyan-700 text-[10px] font-mono">
                    Données non configurées
                  </div>
                </div>
              </div>
            </div>
            <div className="tz-surface p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Champs ({resource.fields?.length || 0})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {resource.fields?.map(f => (
                  <div key={f.code} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{f.displayName}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">{f.type}{f.required ? '*' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'capabilities':
        return (
          <div className="tz-surface p-6 animate-in fade-in duration-300">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Capacités autorisées</h3>
            <div className="space-y-4">
              {resource.operations?.map(op => (
                <div key={op} className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{op}</p>
                    <p className="text-xs text-slate-500">Opération supportée nativement par le provider {resource.provider}.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'configuration':
        return (
          <div className="tz-surface p-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/30 mb-6">
              <InformationCircleIcon className="h-6 w-6 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Sécurité des secrets</p>
                <p className="text-xs text-amber-800 leading-relaxed">Les clés d'API et identifiants de connexion ne sont jamais exposés à l'interface utilisateur. La résolution est effectuée par le Runtime Bridge.</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Endpoint</dt>
                <dd className="text-sm font-mono p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">{resource.endpoint || 'Endpoint résolu côté serveur'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Authentification</dt>
                <dd className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">OAuth2 Client Credentials (maské)</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Timeout (ms)</dt>
                <dd className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">5000</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Retry Policy</dt>
                <dd className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">3 retries, exponential backoff</dd>
              </div>
            </dl>
          </div>
        );
      case 'contracts':
        return (
          <div className="tz-surface p-0 overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Entités rattachées</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Entité</th>
                  <th className="px-6 py-3">Champs mappés</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="px-6 py-4 font-medium">{resource.displayName}</td>
                  <td className="px-6 py-4 text-slate-500">{resource.fields?.length || 0} champs</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ACTIF</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'health':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['Connectivity', 'Authentication', 'Latency'].map(metric => (
                <div key={metric} className="tz-surface p-5 flex flex-col items-center text-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${readiness?.providers?.find((provider) => provider.provider === resource.provider)?.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{metric}</p>
                  <p className="text-xs text-slate-500 mt-1">{readiness?.providers?.find((provider) => provider.provider === resource.provider)?.status || 'Non mesuré'}</p>
                </div>
              ))}
            </div>
            <div className="tz-surface p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Journal d'incident récent</h3>
              <div className="py-8 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                  <ShieldCheckIcon className="h-8 w-8" />
                </div>
                <p className="text-sm text-slate-500">Aucun incident détecté sur les 7 derniers jours.</p>
              </div>
            </div>
          </div>
        );
      case 'diagnostics':
        return (
          <div className="tz-surface p-6 animate-in fade-in duration-300">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Diagnostics transactionnels</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
                <p className="text-emerald-400"># DIAGNOSTIC SESSION · données backend uniquement</p>
                <p className="mt-2">Connecting to {resource.provider}...</p>
                <p className="text-slate-400">[INFO] L’état de connexion est fourni par le provider.</p>
                <p>Resolution ID: non exposé</p>
                <p>Policy evaluation: non exposée</p>
                <p>Capability check: {(resource.operations || []).join(', ') || 'non exposée'}</p>
                <p className="text-amber-400 mt-2">[WAITING] Aucun diagnostic provider disponible.</p>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="tz-surface p-0 overflow-hidden animate-in fade-in duration-300">
            {loading ? (
              <div className="p-12"><ModernSpinner /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Opération</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-mono text-xs">{h.operation}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          h.status === 'SUCCESS' || h.status === 'SUCCEEDED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{h.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(h.startedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-500">Aucun historique pour cette source.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200">
        <div className="flex gap-1 min-w-max px-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

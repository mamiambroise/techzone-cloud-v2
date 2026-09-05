import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/platformSlice.js';
import {
  Activity,
  Terminal,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function DeploymentDiagnosticsView() {
  const dispatch = useDispatch();
  const logs = useSelector((state) => state.deployment?.logs || []);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.traceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.stage.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleExportLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `deployment-audit-trail-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    dispatch(
      addToast({
        type: 'info',
        title: 'Logs Exportés',
        message: 'Le journal d’audit et traces de déploiement a été téléchargé.',
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-CDC-06
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                DIAGNOSTICS & AUDIT TRAIL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Traçabilité, Nonces & Diagnostics de Déploiement
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Journalisation inviolable de chaque étape de pipeline : vérification des condensats SHA-256,
              sondes HTTP de vivacité, bascule des proxy inversés et nonces cryptographiques.
            </p>
          </div>

          <button
            onClick={handleExportLogs}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter Journal d'Audit</span>
          </button>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Terminal Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-slate-200 font-bold">
              deployment-live-stream.log (ISO-8601 UTC)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Recherche dans les traces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1">
              {['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    filterLevel === lvl
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="p-4 font-mono text-xs text-slate-300 space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-600">Aucun log correspondant au filtre.</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-start gap-2 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      log.level === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : log.level === 'WARN'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : log.level === 'ERROR'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {log.level}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-amber-400 font-bold bg-slate-800 px-1.5 py-0.2 rounded">
                      {log.stage}
                    </span>
                    <span className="text-[10px] text-slate-500">[{log.traceId}]</span>
                  </div>
                  <div className="text-slate-200 leading-relaxed break-words">{log.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

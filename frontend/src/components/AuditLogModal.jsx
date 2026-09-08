import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearAuditLogs } from '../store/auditSlice.js';
import { addToast } from '../store/platformSlice.js';
import { History, Shield, X, Filter, Trash2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function AuditLogModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const logs = useSelector((state) => state.audit.logs);
  const [filterType, setFilterType] = useState('ALL');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'ALL') return true;
    return l.resourceType === filterType || l.status === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Journal d'Audit Transverse (Audit Trail)</h3>
              <p className="text-xs text-slate-500">Traçabilité complète des actions, déploiements, mutations et audits IAM</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200/80 rounded-xl font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Tous les événements ({logs.length})</option>
              <option value="APPLICATION">Applications</option>
              <option value="ENVIRONMENT">Environnements</option>
              <option value="CONTRACT">Contrats</option>
              <option value="CONFIG">Configurations</option>
              <option value="SNAPSHOT">Snapshots</option>
              <option value="DENIED">Refus de Sécurité (DENIED)</option>
            </select>
          </div>

          <button
            onClick={() => {
              dispatch(clearAuditLogs());
              dispatch(addToast({ type: 'info', title: 'Audit réinitialisé', message: 'Le journal local d\'audit a été vidé.' }));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Purger</span>
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 space-y-2 pr-1">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isDenied = log.status === 'DENIED';

              return (
                <div key={log.id} className="pt-2.5 pb-2 text-xs flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isDenied
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[10px]">{log.resourceType}:{log.resourceId}</span>
                    </div>

                    <p className="text-slate-800 text-xs">{log.details}</p>

                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span>Acteur : <strong className="text-slate-600">{log.actor}</strong> ({log.role})</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        isDenied ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aucun événement d'audit enregistré.
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

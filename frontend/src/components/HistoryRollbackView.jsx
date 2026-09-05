import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../store/platformSlice.js';
import {
  History,
  RotateCcw,
  Clock,
  CheckCircle2,
  Shield,
  FileText,
  AlertTriangle,
  ArrowRight,
  Database,
} from 'lucide-react';

export default function HistoryRollbackView() {
  const dispatch = useDispatch();
  const selectedAppId = useSelector((state) => state.applications.selectedAppId);
  const applications = useSelector((state) => state.applications.applications);

  const currentApp =
    applications.find((a) => a.id === selectedAppId) ||
    applications.find((a) => a.id === 'app-0003') ||
    applications[0];

  const [historyItems, setHistoryItems] = useState([
    {
      id: 'snap-1',
      version: 'v1.0.0',
      timestamp: '25/08/2026 à 09:57',
      author: 'Ranja Avo Efraim',
      action: 'Publication Production validée',
      hash: 'sha256:4a91b...3f8e',
      isCurrentProd: true,
    },
    {
      id: 'snap-2',
      version: 'v0.9.4',
      timestamp: '20/08/2026 à 14:22',
      author: 'Alexandre D.',
      action: 'Mise à jour module catalogue & taxes',
      hash: 'sha256:7c22e...110a',
      isCurrentProd: false,
    },
    {
      id: 'snap-3',
      version: 'v0.9.0',
      timestamp: '15/08/2026 à 11:05',
      author: 'Jean Mbolo',
      action: 'Initialisation environnement Staging',
      hash: 'sha256:9d88a...4b5c',
      isCurrentProd: false,
    },
  ]);

  const handleRollback = (item) => {
    dispatch(
      addToast({
        type: 'warning',
        title: 'Rollback initié',
        message: `Restauration de l'état vers le point ${item.version} (${item.timestamp}).`,
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Historique & Points de Rollback
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                AUDITABILITÉ 100%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Registre immuable des versions et instantanés système pour {currentApp.name}.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Points de restauration disponibles</h2>
          <span className="text-xs text-slate-500 font-mono">3 snapshots certifiés</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{item.version}</span>
                    {item.isCurrentProd && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        PRODUCTION ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">{item.action}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{item.timestamp}</span>
                    <span>•</span>
                    <span>Par {item.author}</span>
                    <span>•</span>
                    <span>{item.hash}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {!item.isCurrentProd && (
                  <button
                    onClick={() => handleRollback(item)}
                    className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revenir à cette version</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

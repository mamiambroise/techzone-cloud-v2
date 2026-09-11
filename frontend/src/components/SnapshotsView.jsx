import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedSnapshotId,
  setCompareSelection,
  addSnapshot,
  setBaselineSnapshot,
  compareSnapshotsData,
} from '../store/snapshotsSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast } from '../store/platformSlice.js';
import { computeCanonicalHash } from '../utils/crypto.js';
import {
  Camera,
  GitCompare,
  Copy,
  Download,
  CheckCircle2,
  ShieldCheck,
  History,
  RotateCcw,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  FileJson,
} from 'lucide-react';

export default function SnapshotsView({ onOpenCreateSnapshot }) {
  const dispatch = useDispatch();

  const snapshots = useSelector((state) => state.snapshots.snapshots);
  const selectedSnapshotId = useSelector((state) => state.snapshots.selectedSnapshotId);
  const compareLeftId = useSelector((state) => state.snapshots.compareLeftId);
  const compareRightId = useSelector((state) => state.snapshots.compareRightId);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const searchQuery = useSelector((state) => state.platform.searchQuery);

  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showJsonExportModal, setShowJsonExportModal] = useState(false);

  const filteredSnapshots = snapshots.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.applicationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.environmentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedSnapshot =
    snapshots.find((s) => s.id === selectedSnapshotId) || filteredSnapshots[0] || snapshots[0];

  const leftSnap = snapshots.find((s) => s.id === compareLeftId) || snapshots[0];
  const rightSnap = snapshots.find((s) => s.id === compareRightId) || snapshots[1] || snapshots[0];
  const diffResult = compareSnapshotsData(leftSnap, rightSnap);

  const handleSetBaseline = (snap) => {
    if (activeUser.role !== 'PLATFORM_SUPER_ADMIN') {
      dispatch(
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seul le Super Admin peut définir une nouvelle baseline de production.',
        })
      );
      return;
    }

    dispatch(setBaselineSnapshot(snap.id));
    dispatch(
      addToast({
        type: 'success',
        title: 'Nouvelle Baseline certifiée 🎯',
        message: `${snap.name} est maintenant la baseline officielle de ${snap.environmentCode}.`,
      })
    );
    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'SET_BASELINE_SNAPSHOT',
        resourceType: 'SNAPSHOT',
        resourceId: snap.id,
        details: `Définition du snapshot ${snap.code} (${snap.hash.slice(0, 16)}...) comme baseline officielle pour ${snap.environmentCode}.`,
        status: 'SUCCESS',
      })
    );
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    dispatch(
      addToast({
        type: 'info',
        title: 'Empreinte SHA-256 copiée',
        message: hash,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
              PF-CDC-06
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Snapshots & Historique Reproductible</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Capture d'états immuables, hashables et comparables de la plateforme pour audit, validation avant release et rollback logique.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowCompareModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all active:scale-95"
          >
            <GitCompare className="w-4 h-4 text-blue-600" />
            <span>Comparer Deux Snapshots</span>
          </button>

          <button
            onClick={onOpenCreateSnapshot}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Générer un Snapshot</span>
          </button>
        </div>
      </div>

      {/* Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Snapshots List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Snapshots Enregistrés ({filteredSnapshots.length})
          </div>

          <div className="space-y-2.5">
            {filteredSnapshots.map((snap) => {
              const isSelected = snap.id === selectedSnapshot?.id;
              const isBaseline = snap.status === 'BASELINE';

              return (
                <div
                  key={snap.id}
                  onClick={() => dispatch(setSelectedSnapshotId(snap.id))}
                  className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{snap.code}</span>
                        {isBaseline && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>BASELINE</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">{snap.name}</div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold shrink-0">
                      {snap.environmentCode}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono text-xs">
                      {snap.applicationCode} v{snap.applicationVersion}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(snap.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Snapshot Detail View */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSnapshot ? (
            <>
              {/* Main Detail Header Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedSnapshot.name}</h2>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                        {selectedSnapshot.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedSnapshot.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedSnapshot.status !== 'BASELINE' && (
                      <button
                        onClick={() => handleSetBaseline(selectedSnapshot)}
                        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 transition-all active:scale-95"
                        title="Promouvoir ce snapshot comme baseline de référence officielle"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Définir comme Baseline</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowJsonExportModal(true)}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all active:scale-95"
                      title="Exporter le JSON canonique du snapshot"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                {/* Canonical SHA-256 Hash Display (PF-CDC-06 Section 4) */}
                <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono space-y-1.5 border border-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      Empreinte Canonique Déterministe (SHA-256)
                    </span>
                    <button
                      onClick={() => handleCopyHash(selectedSnapshot.hash)}
                      className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copier</span>
                    </button>
                  </div>
                  <div className="text-emerald-400 font-bold break-all">{selectedSnapshot.hash}</div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Application</span>
                    <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">
                      {selectedSnapshot.applicationCode} (v{selectedSnapshot.applicationVersion})
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Environnement</span>
                    <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{selectedSnapshot.environmentCode}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Auteur</span>
                    <span className="text-slate-700 text-[11px] truncate block mt-0.5">{selectedSnapshot.createdBy}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Horodatage</span>
                    <span className="text-slate-700 text-[11px] block mt-0.5">
                      {new Date(selectedSnapshot.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frozen Contracts & Configurations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contracts Included */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Contrats Figés ({selectedSnapshot.contractsIncluded?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {selectedSnapshot.contractsIncluded?.map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{c.id}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                            {c.hash}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          v{c.version}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configurations Included */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Paramètres Figés ({selectedSnapshot.configurations?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedSnapshot.configurations?.map((cfg) => (
                      <div key={cfg.key} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs flex items-center justify-between font-mono">
                        <span className="text-slate-600 truncate max-w-[180px]">{cfg.key}</span>
                        <span className="font-semibold text-slate-900">{cfg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400">
              Aucun snapshot sélectionné.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Snapshot Visual Diff Comparison (PF-CDC-06 Section 6) */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Comparateur Diff de Snapshots (PF-CDC-06 Section 6)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Différenciation canonique : ADDED, REMOVED, CHANGED, UNCHANGED
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selectors for Snapshot A & Snapshot B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Snapshot A (Référence)</label>
                <select
                  value={compareLeftId}
                  onChange={(e) => dispatch(setCompareSelection({ leftId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {snapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Snapshot B (Cible)</label>
                <select
                  value={compareRightId}
                  onChange={(e) => dispatch(setCompareSelection({ rightId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {snapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Diff Results */}
            <div className="flex-1 overflow-y-auto space-y-4 pt-2">
              {diffResult && (
                <>
                  {/* High level info */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Application :</span>
                      <span className={diffResult.application.changed ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                        {diffResult.application.left} ➔ {diffResult.application.right}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Environnement :</span>
                      <span className={diffResult.environment.changed ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                        {diffResult.environment.left} ➔ {diffResult.environment.right}
                      </span>
                    </div>
                  </div>

                  {/* Contracts Diff */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                      Différences sur les Contrats
                    </h4>
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {diffResult.contracts.map((c) => {
                        const statusColors = {
                          ADDED: 'bg-emerald-50 text-emerald-800 font-semibold',
                          REMOVED: 'bg-rose-50 text-rose-800 line-through',
                          CHANGED: 'bg-amber-50 text-amber-800 font-semibold',
                          UNCHANGED: 'bg-white text-slate-600',
                        }[c.status];

                        return (
                          <div key={c.id} className={`p-3 flex items-center justify-between ${statusColors}`}>
                            <span className="font-mono font-bold">{c.id}</span>
                            <div className="flex items-center gap-4 text-right">
                              <span className="text-[11px] font-mono">
                                {c.left} ➔ {c.right}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md border border-current font-mono">
                                {c.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Config Diff */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                      Différences sur les Configurations
                    </h4>
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {diffResult.configurations.map((cfg) => {
                        const statusColors = {
                          ADDED: 'bg-emerald-50 text-emerald-800 font-semibold',
                          REMOVED: 'bg-rose-50 text-rose-800 line-through',
                          CHANGED: 'bg-amber-50 text-amber-800 font-semibold',
                          UNCHANGED: 'bg-white text-slate-600',
                        }[cfg.status];

                        return (
                          <div key={cfg.key} className={`p-3 flex items-center justify-between ${statusColors}`}>
                            <span className="font-mono font-bold">{cfg.key}</span>
                            <div className="flex items-center gap-4 text-right">
                              <span className="text-[11px] font-mono">
                                {cfg.left} ➔ {cfg.right}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md border border-current font-mono">
                                {cfg.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export JSON */}
      {showJsonExportModal && selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileJson className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Export JSON Canonique — {selectedSnapshot.code}
                </h3>
              </div>
              <button
                onClick={() => setShowJsonExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl text-slate-200 font-mono text-xs max-h-96 overflow-y-auto border border-slate-900">
              <pre>{JSON.stringify(selectedSnapshot, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedSnapshot, null, 2));
                  dispatch(addToast({ type: 'success', title: 'Copié', message: 'JSON copié dans le presse-papier.' }));
                }}
                className="px-4 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Copier le JSON
              </button>
              <button
                onClick={() => setShowJsonExportModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

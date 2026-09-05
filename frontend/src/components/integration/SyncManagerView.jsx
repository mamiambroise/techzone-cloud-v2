import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedSyncJobId,
  startSyncPipeline,
  updatePipelineProgress,
  finishSyncPipeline,
  addSyncJob,
} from '../../store/integrationSlice.js';
import { logAuditAction } from '../../store/auditSlice.js';
import { addToast, setSearchQuery } from '../../store/platformSlice.js';
import {
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Database,
  Sliders,
  Filter,
  X,
  Layers,
  Terminal,
  FileCode2,
  FastForward,
  Check,
} from 'lucide-react';

const PIPELINE_STEPS = [
  'INITIALIZING',
  'READING_CHECKPOINT',
  'EXTRACTING_BATCH',
  'TRANSFORMING_SCHEMA',
  'RESOLVING_CONFLICTS',
  'WRITING_TARGET',
  'COMMITTING_CHECKPOINT',
];

export default function SyncManagerView() {
  const dispatch = useDispatch();

  const syncJobs = useSelector((state) => state.integration.syncJobs);
  const selectedSyncJobId = useSelector((state) => state.integration.selectedSyncJobId);
  const activePipelineRun = useSelector((state) => state.integration.activePipelineRun);
  const connectors = useSelector((state) => state.integration.connectors);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const activeUser = useSelector((state) => state.platform.activeUser);

  const [showCreateModal, setShowCreateModal] = useState(false);

  // New sync job form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState('INCREMENTAL');
  const [newSource, setNewSource] = useState(connectors[0]?.id || '');
  const [newTarget, setNewTarget] = useState(connectors[1]?.id || connectors[0]?.id || '');
  const [newConflictPolicy, setNewConflictPolicy] = useState('SOURCE_WINS');
  const [newSchedule, setNewSchedule] = useState('0 */2 * * *');

  // Filter sync jobs
  const filteredSyncJobs = syncJobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.code.toLowerCase().includes(q) ||
      job.name.toLowerCase().includes(q) ||
      job.mode.toLowerCase().includes(q) ||
      job.conflictPolicy.toLowerCase().includes(q)
    );
  });

  const selectedSyncJob =
    syncJobs.find((j) => j.id === selectedSyncJobId) || filteredSyncJobs[0] || syncJobs[0];

  // Pipeline simulation execution runner
  const handleRunPipeline = (job) => {
    if (activePipelineRun) return;

    dispatch(startSyncPipeline({ jobId: job.id }));
    dispatch(
      addToast({
        type: 'info',
        title: 'Pipeline Démarré (API-CDC-06)',
        message: `Pipeline ${job.code} en cours d'exécution.`,
      })
    );

    // Simulate step progression
    let currentStepIndex = 0;
    const interval = setInterval(() => {
      currentStepIndex += 1;
      if (currentStepIndex < PIPELINE_STEPS.length) {
        const stepName = PIPELINE_STEPS[currentStepIndex];
        const progress = Math.round(((currentStepIndex + 1) / PIPELINE_STEPS.length) * 100);
        dispatch(
          updatePipelineProgress({
            step: stepName,
            progress,
            log: `Étape ${stepName} terminée avec succès.`,
          })
        );
      } else {
        clearInterval(interval);
        const recordsRead = Math.floor(Math.random() * 200) + 120;
        const recordsWritten = recordsRead - 2;
        dispatch(
          finishSyncPipeline({
            recordsRead,
            recordsWritten,
            conflictsCount: 2,
          })
        );

        dispatch(
          addToast({
            type: 'success',
            title: 'Pipeline de Synchronisation Réussi (API-CDC-06)',
            message: `${job.code} : ${recordsWritten} enregistrements répliqués avec politique ${job.conflictPolicy}.`,
          })
        );

        dispatch(
          logAuditAction({
            action: 'RUN_SYNC_PIPELINE',
            resourceType: 'SYNC_JOB',
            resourceId: job.id,
            user: activeUser,
            details: {
              code: job.code,
              recordsWritten,
              conflictPolicy: job.conflictPolicy,
            },
          })
        );
      }
    }, 600);
  };

  const handleCreateSyncJob = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const newId = 'sync-' + newCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newJob = {
      id: newId,
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      sourceConnector: newSource,
      targetConnector: newTarget,
      mode: newMode,
      schedule: newSchedule,
      conflictPolicy: newConflictPolicy,
      batchSize: 250,
      checkpoint: {
        lastTimestamp: new Date().toISOString(),
        highWatermarkId: 'EVT-INITIAL-00',
      },
      status: 'ACTIVE',
      lastExecution: {
        startedAt: 'Jamais exécuté',
        durationMs: 0,
        recordsRead: 0,
        recordsWritten: 0,
        conflictsCount: 0,
        status: 'PENDING',
      },
    };

    dispatch(addSyncJob(newJob));
    setShowCreateModal(false);
    setNewCode('');
    setNewName('');

    dispatch(
      addToast({
        type: 'success',
        title: 'Pipeline Enregistré (API-CDC-06)',
        message: `Pipeline ${newJob.code} configuré avec politique ${newJob.conflictPolicy}.`,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              API-CDC-06
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <span className="text-xs text-slate-500 font-medium">Data Sync Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Pipelines de Synchronisation de Données
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {filteredSyncJobs.length} pipeline(s)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Modes Incrémentaux, Full & Bidirectionnels, gestion des checkpoints (High Watermark) et résolution déterministe des conflits.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Pipeline</span>
          </button>
        </div>
      </div>

      {/* Active Pipeline Progress Monitor (API-CDC-06 Section 4) */}
      {activePipelineRun && (
        <div className="p-5 bg-emerald-950 text-white rounded-3xl border border-emerald-800 shadow-xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <div>
                <h4 className="text-sm font-bold font-mono text-emerald-200">
                  Exécution en cours : {activePipelineRun.jobId}
                </h4>
                <p className="text-xs text-slate-300 font-mono">
                  Étape : <strong>{activePipelineRun.step}</strong> ({activePipelineRun.progress}%)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-200 border border-emerald-700">
              LEASING_ACTIVE 🔒
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-emerald-900/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${activePipelineRun.progress}%` }}
            />
          </div>

          {/* Execution Log Stream */}
          <div className="bg-black/40 p-3 rounded-2xl font-mono text-xs text-emerald-300 max-h-28 overflow-y-auto space-y-1 border border-emerald-800/40">
            {activePipelineRun.logs?.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredSyncJobs.length} pipeline(s) trouvé(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left Catalog, Right Selected Pipeline Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sync Jobs List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredSyncJobs.map((job) => {
            const isSelected = job.id === selectedSyncJob?.id;
            return (
              <div
                key={job.id}
                onClick={() => dispatch(setSelectedSyncJobId(job.id))}
                className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 font-mono">{job.code}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {job.mode}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 mt-1">{job.name}</div>
                  </div>

                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                  <span>Conflit: {job.conflictPolicy}</span>
                  <span>{job.schedule}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed View & Execution Trigger (7 cols) */}
        <div className="lg:col-span-7">
          {selectedSyncJob && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-700">{selectedSyncJob.code}</span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedSyncJob.mode}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedSyncJob.name}</h3>
                </div>

                <button
                  onClick={() => handleRunPipeline(selectedSyncJob)}
                  disabled={activePipelineRun !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Exécuter Pipeline</span>
                </button>
              </div>

              {/* Topology / Connectors Source -> Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Source (Origine)</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedSyncJob.sourceConnector}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target (Destination)</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">{selectedSyncJob.targetConnector}</span>
                </div>
              </div>

              {/* Conflict Policy & Checkpoint (API-CDC-06 Section 3 & 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Politique de Conflit</span>
                  <span className="font-bold text-slate-800 mt-1 block">{selectedSyncJob.conflictPolicy}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Taille de Lot (Batch)</span>
                  <span className="font-bold text-slate-800 mt-1 block">{selectedSyncJob.batchSize} docs/lot</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fréquence Cron</span>
                  <span className="font-bold text-slate-800 mt-1 block">{selectedSyncJob.schedule}</span>
                </div>
              </div>

              {/* Checkpoint High Watermark */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold">Checkpoint Persistant (High Watermark)</span>
                  <span className="text-[10px] text-emerald-400">ACID Resilient</span>
                </div>
                <pre className="text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedSyncJob.checkpoint, null, 2)}
                </pre>
              </div>

              {/* Last Execution Outcome */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Dernier Rapport d'Exécution
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Horodatage : {selectedSyncJob.lastExecution?.startedAt}</span>
                    <span className="text-slate-700 font-semibold mt-1 block">
                      {selectedSyncJob.lastExecution?.recordsWritten} écrits / {selectedSyncJob.lastExecution?.recordsRead} lus ({selectedSyncJob.lastExecution?.conflictsCount} conflits résolus)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      selectedSyncJob.lastExecution?.status === 'SUCCEEDED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedSyncJob.lastExecution?.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Sync Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Configurer un Pipeline de Synchronisation</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Conforme au contrat API-CDC-06</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSyncJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code Pipeline *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="EX: SYNC-CUSTOMERS-BI"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mode de Sync</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="INCREMENTAL">INCREMENTAL (High Watermark)</option>
                    <option value="FULL">FULL REFRESH</option>
                    <option value="BIDIRECTIONAL">BIDIRECTIONAL</option>
                    <option value="PULL">PULL ONLY</option>
                    <option value="PUSH">PUSH ONLY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom du Pipeline *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="EX: Synchronisation Clients Hubspot <> Techzone"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Connecteur Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {connectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Connecteur Cible</label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {connectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Politique de Conflit</label>
                  <select
                    value={newConflictPolicy}
                    onChange={(e) => setNewConflictPolicy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="SOURCE_WINS">SOURCE_WINS</option>
                    <option value="TARGET_WINS">TARGET_WINS</option>
                    <option value="MERGE_SAFE">MERGE_SAFE</option>
                    <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Planification Cron</label>
                  <input
                    type="text"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    placeholder="0 */2 * * *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Créer le pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

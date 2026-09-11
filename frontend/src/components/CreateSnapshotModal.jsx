import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addSnapshot } from '../store/snapshotsSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast } from '../store/platformSlice.js';
import { computeCanonicalHash } from '../utils/crypto.js';
import { Camera, Shield, X, Check } from 'lucide-react';

export default function CreateSnapshotModal({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const applications = useSelector((state) => state.applications.applications);
  const versions = useSelector((state) => state.applications.versions);
  const environments = useSelector((state) => state.environments.environments);
  const contracts = useSelector((state) => state.contracts.contracts);
  const configItems = useSelector((state) => state.config.items);
  const activeUser = useSelector((state) => state.platform.activeUser);

  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState(environments[0]?.id || '');
  const [snapshotCode, setSnapshotCode] = useState(`SNP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`);
  const [snapshotName, setSnapshotName] = useState('Release Baseline Pré-Déploiement');
  const [snapshotDesc, setSnapshotDesc] = useState('Capture canonique de l’état plateforme pour validation.');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const appVersions = versions.filter((v) => v.applicationId === selectedAppId);
  const targetVersion = versions.find((v) => v.id === selectedVersionId) || appVersions[0];
  const targetApp = applications.find((a) => a.id === selectedAppId);
  const targetEnv = environments.find((e) => e.id === selectedEnvId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetApp || !targetVersion || !targetEnv) return;

    setIsGenerating(true);

    // Canonical payload for hash calculation
    const payload = {
      applicationCode: targetApp.code,
      applicationVersion: targetVersion.version,
      environmentCode: targetEnv.code,
      contracts: contracts.map((c) => ({ id: c.id, version: c.contractVersion, hash: c.hash })),
      configurations: configItems.map((c) => ({ key: c.key, value: c.isSecret ? 'vault://masked' : c.value })),
      timestamp: new Date().toISOString(),
    };

    const deterministicHash = await computeCanonicalHash(payload);

    dispatch(
      addSnapshot({
        code: snapshotCode.trim(),
        name: snapshotName.trim(),
        applicationId: targetApp.id,
        applicationCode: targetApp.code,
        applicationVersionId: targetVersion.id,
        applicationVersion: targetVersion.version,
        environmentId: targetEnv.id,
        environmentCode: targetEnv.code,
        contractsIncluded: contracts.map((c) => ({ id: c.id, version: c.contractVersion, hash: c.hash })),
        configurations: configItems.slice(0, 6).map((c) => ({ key: c.key, value: c.value })),
        createdBy: activeUser.email,
        hash: deterministicHash,
        status: 'VALIDATED',
        description: snapshotDesc.trim(),
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: 'Snapshot Canonique Généré',
        message: `Empreinte SHA-256 certifiée pour ${snapshotCode}.`,
      })
    );

    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'CREATE_SNAPSHOT',
        resourceType: 'SNAPSHOT',
        resourceId: snapshotCode,
        details: `Snapshot ${snapshotCode} créé pour ${targetApp.code} v${targetVersion.version} sur ${targetEnv.code}. Hash: ${deterministicHash.slice(0, 16)}...`,
        status: 'SUCCESS',
      })
    );

    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Générer un Snapshot Reproductible (PF-CDC-06)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code Snapshot</label>
              <input
                type="text"
                required
                value={snapshotCode}
                onChange={(e) => setSnapshotCode(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Environnement Cible</label>
              <select
                value={selectedEnvId}
                onChange={(e) => setSelectedEnvId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.code} ({env.name.split('(')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Snapshot</label>
            <input
              type="text"
              required
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application</label>
              <select
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  const matching = versions.find((v) => v.applicationId === e.target.value);
                  setSelectedVersionId(matching?.id || '');
                }}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version</label>
              <select
                value={selectedVersionId || targetVersion?.id}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {appVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Justification</label>
            <textarea
              rows={2}
              value={snapshotDesc}
              onChange={(e) => setSnapshotDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold block text-slate-800">Inclusions automatiques :</span>
            <div>• {contracts.length} contrats du registre (hashes canoniques)</div>
            <div>• Configurations actives du scope {targetEnv?.code || 'ENV'}</div>
            <div>• Calcul temps réel du hash SHA-256 déterministe</div>
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
              disabled={isGenerating}
              className="px-4.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 shadow-sm transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Calcul du Hash...' : 'Figer et Hasher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../../services/apiClient.js';
import { UiRenderer } from '../../features/ui-builder/renderer/Renderer.jsx';

function validPublishedUi(ui) {
  return ui?.schemaVersion === '1.1'
    && Array.isArray(ui.pages)
    && Array.isArray(ui.navigation?.items)
    && Boolean(ui.businessContext)
    && ui.applicationVersionId === ui.businessContext.applicationVersionId;
}

/** Execution uses a fresh server gate and the effective UI, never the raw publication. */
export default function PublishedApplication({ packCode, packVersion, tenantId, resolutionId, effectiveManifest }) {
  const manifestContent = effectiveManifest?.content ?? effectiveManifest;
  const source = manifestContent?.source;
  const isExecutable = Boolean(resolutionId) && manifestContent?.status === 'EXECUTABLE' && manifestContent?.executable === true;
  if (
    !isExecutable ||
    manifestContent?.scope?.tenantId !== tenantId ||
    source?.packCode !== packCode ||
    source?.packVersion !== packVersion ||
    !source?.manifestHash
  ) {
    return <p role="alert">Interface bloquée : une résolution Runtime exécutable est requise.</p>;
  }
  const identity = `${tenantId}:${packCode}:${packVersion}:${resolutionId}`;
  return <PublishedWorkspace key={identity} packCode={packCode} packVersion={packVersion} resolutionId={resolutionId} expectedHash={source.manifestHash} effectiveManifest={manifestContent} />;
}

function PublishedWorkspace({ packCode, packVersion, resolutionId, expectedHash, effectiveManifest }) {
  const [definition, setDefinition] = useState(null), [error, setError] = useState('');
  const [selection, setSelection] = useState({ key: null, recordId: null });
  useEffect(() => {
    let active = true;
    api.get(`/runtime/resolutions/${encodeURIComponent(resolutionId)}/execution-manifest`)
      .then(response => {
        const { effectiveManifest: effective, runtimeContext } = response.data;
        const ui = effective?.ui?.definition;
        if (effective?.status !== 'EXECUTABLE' || effective?.executable !== true || effective.scope?.tenantId !== tenantId || effective.source?.packCode !== packCode || effective.source?.packVersion !== packVersion || effective.source?.manifestHash !== expectedHash || runtimeContext?.resolutionId !== resolutionId || runtimeContext?.status !== 'ACTIVE' || runtimeContext?.readiness !== 'READY' || !validPublishedUi(ui) || ui.applicationVersionId !== effective.scope?.businessVersionId) throw new Error('RUNTIME_CONTEXT_NOT_ACTIVE');
        if (active) { setError(''); setDefinition({ ...ui, businessContext: { ...ui.businessContext, runtimeProof: { resolutionId } } }); }
      }).catch(() => active && setError('Interface publiée indisponible : contexte Runtime inactif, expiré ou incompatible.'));
    return () => { active = false; };
  }, [resolutionId, tenantId, expectedHash, packCode, packVersion]);
  if (error) return <p role="alert">{error}</p>;
  if (!definition) return <p role="status">Chargement de l’application publiée…</p>;
  const page = definition.pages.find(p => p.key === selection.key) || definition.pages[0];
  const navigate = (key, recordId = null) => setSelection({ key, recordId });
  return <section className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="Application publiée">
    <nav aria-label="Pages de l’application" className="mb-4 flex flex-wrap gap-2">{definition.navigation.items.map(item => <button key={item.id} onClick={() => navigate(item.pageKey)} aria-current={page?.key === item.pageKey ? 'page' : undefined} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500">{item.label}</button>)}</nav>
    {page ? <UiRenderer key={page.key} tree={page.components} businessContext={definition.businessContext} theme={definition.theme} mode="runtime" resolutionId={resolutionId} recordId={selection.recordId} onNavigate={navigate} /> : <p>Aucune page publiée.</p>}
  </section>;
}

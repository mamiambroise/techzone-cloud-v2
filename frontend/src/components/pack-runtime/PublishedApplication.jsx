import React, { useEffect, useState } from 'react';
import { api } from '../../services/apiClient.js';
import { UiRenderer } from '../../features/ui-builder/renderer/Renderer.jsx';

/** Loads only the immutable published manifest. No working-UI endpoint. */
export default function PublishedApplication({ packCode, packVersion, tenantId }) {
  const identity = `${tenantId}:${packCode}:${packVersion}`;
  return <PublishedWorkspace key={identity} packCode={packCode} packVersion={packVersion} />;
}
function PublishedWorkspace({ packCode, packVersion }) {
  const [definition, setDefinition] = useState(null), [error, setError] = useState('');
  const [selection, setSelection] = useState({ key: null, recordId: null });
  useEffect(() => {
    let active = true;
    api.get(`/runtime/manifests/${encodeURIComponent(packCode)}/${encodeURIComponent(packVersion)}`)
      .then(response => {
        const manifest = response.data;
        const artifact = manifest.definition?.ui;
        const ui = artifact?.definition;
        if (!Array.isArray(ui?.pages) || !Array.isArray(ui.navigation?.items) || !ui.businessContext
          || !['1.0', '1.1'].includes(ui.schemaVersion)
          || !ui.applicationVersionId || artifact.applicationVersionId !== ui.applicationVersionId
          || ui.applicationVersionId !== ui.businessContext.applicationVersionId
          || ui.pages.some(page => !page || typeof page.key !== 'string' || !page.components)
          || ui.navigation.items.some(item => !item || !ui.pages.some(page => page.key === item.pageKey))) throw new Error('Published UI metadata missing or inconsistent');
        if (active) setDefinition(ui);
      }).catch(() => active && setError('Interface publiée indisponible pour ce tenant.'));
    return () => { active = false; };
  }, [packCode, packVersion]);
  if (error) return <p role="alert">{error}</p>;
  if (!definition) return <p role="status">Chargement de l’application publiée…</p>;
  const page = definition.pages.find(p => p.key === selection.key) || definition.pages[0];
  const navigate = (key, recordId = null) => setSelection({ key, recordId });
  return <section className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="Application publiée">
    <nav aria-label="Pages de l’application" className="mb-4 flex flex-wrap gap-2">{definition.navigation.items.map(item => <button key={item.id} onClick={() => navigate(item.pageKey)} aria-current={page?.key === item.pageKey ? 'page' : undefined} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500">{item.label}</button>)}</nav>
    {page ? <UiRenderer key={page.key} tree={page.components} businessContext={definition.businessContext} mode="runtime" recordId={selection.recordId} onNavigate={navigate} /> : <p>Aucune page publiée.</p>}
  </section>;
}

/**
 * UI Builder — catalogue des composants (mission §12-§13) : reflète le
 * Component Registry réel (une seule source de vérité).
 */
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { componentsByCategory, CATEGORY_LABELS, componentRegistry } from '../registry/componentRegistry.js';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmCard, BmBadge, BmEmptyState } from '../../../components/business-manager/bm/ui.jsx';

export default function UiComponentsCatalog() {
  return (
    <UiBuilderLayout subTab="components">
      <CatalogBody />
    </UiBuilderLayout>
  );
}

function CatalogBody() {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return componentsByCategory()
      .map((group) => ({ ...group, items: group.items.filter((c) => `${c.label} ${c.key} ${c.description}`.toLocaleLowerCase().includes(q)) }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher parmi les composants supportés…"
          aria-label="Rechercher un composant"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />
      </div>

      {groups.length === 0 ? (
        <BmEmptyState title="Aucun composant" description="Aucun composant ne correspond à la recherche." />
      ) : (
        groups.map((group) => (
          <BmCard key={group.category} title={group.label} subtitle={`${group.items.length} composant(s) — rendus par le Shared Renderer`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((component) => (
                <article key={component.key} className="bm-hover-lift rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{component.label}</p>
                      <p className="truncate font-mono text-[10px] text-slate-400">{component.key}</p>
                    </div>
                    <BmBadge tone="violet">{CATEGORY_LABELS[component.category]}</BmBadge>
                  </div>
                  <p className="mt-2 min-h-[32px] text-xs text-slate-500">{component.description}</p>
                  <dl className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                    <div className="flex justify-between gap-2"><dt className="shrink-0">Bindings</dt><dd className="truncate font-mono">{component.bindingCapabilities.length ? component.bindingCapabilities.join(', ') : '—'}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="shrink-0">Actions</dt><dd className="truncate font-mono">{component.supportedActions.length ? component.supportedActions.join(', ') : '—'}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="shrink-0">Enfants</dt><dd className="truncate">{component.allowedChildren === '*' ? 'Tous types' : component.allowedChildren.length ? component.allowedChildren.join(', ') : 'Aucun (feuille)'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </BmCard>
        ))
      )}

      <p className="text-center text-[11px] text-slate-400">{componentRegistry.length} composants enregistrés — un composant absent du registry n'est pas rendable par le Runtime.</p>
    </div>
  );
}

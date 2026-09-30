/**
 * UI Builder — Navigation (mission §23) : présentation de la navigation
 * de l'UI Definition (ordre, icône, visibilité). La structure fonctionnelle
 * reste propriété du Business Manager (Menu Engine) — aucun doublon.
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Compass } from 'lucide-react';

import { fetchPages, submitReorder, updatePageSettings, saveCurrentPage } from '../store/uiBuilderSlice.js';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmCard, BmBadge, BmEmptyState, BmIconButton, BmLoading } from '../../../components/business-manager/bm/ui.jsx';
import { ArrowUp, ArrowDown } from 'lucide-react';

const ICON_SUGGESTIONS = ['LayoutTemplate', 'List', 'Users', 'ShoppingCart', 'Settings', 'Calendar', 'FileText', 'ChartBar'];

export default function UiNavigationPresentation() {
  return (
    <UiBuilderLayout subTab="navigation">
      <NavigationBody />
    </UiBuilderLayout>
  );
}

function NavigationBody() {
  const dispatch = useDispatch();
  const { pages, pagesStatus, applicationVersionId } = useSelector((state) => state.uiBuilder);
  const [error, setError] = useState('');

  useEffect(() => {
    if (applicationVersionId) dispatch(fetchPages(applicationVersionId));
  }, [applicationVersionId, dispatch]);

  const sorted = useMemo(() => [...pages].sort((a, b) => a.order - b.order), [pages]);
  const visibleItems = sorted.filter((p) => p.visibility !== 'HIDDEN');

  const persistIcon = async (page, icon) => {
    dispatch(updatePageSettings({ pageId: page.id, patch: { metadata: { ...(page.metadata || {}), icon } } }));
    try {
      await dispatch(saveCurrentPage()).unwrap();
      setError('');
    } catch {
      setError('Sauvegarde impossible pour le moment.');
    }
  };

  const move = async (page, direction) => {
    const index = sorted.findIndex((p) => p.id === page.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    const reordered = [...sorted];
    reordered[index] = swapWith;
    reordered[index + direction] = page;
    try {
      await dispatch(submitReorder({ applicationVersionId, pageIds: reordered.map((p) => p.id) })).unwrap();
    } catch {
      setError('Réordonnancement impossible pour le moment.');
    }
  };

  if (pagesStatus === 'LOADING') return <BmLoading />;

  return (
    <div className="space-y-5">
      <BmCard
        title="Présentation de la navigation applicative"
        subtitle="Ordre visuel, icône et visibilité des pages. La structure fonctionnelle des menus reste gérée par le Business Manager."
      >
        {visibleItems.length === 0 ? (
          <BmEmptyState icon={Compass} title="Aucun élément de navigation" description="Créez et rendez visibles des pages pour composer la navigation." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleItems.map((page, index) => (
              <li key={page.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex shrink-0 flex-col">
                  <BmIconButton label={`Monter ${page.title}`} disabled={index === 0} onClick={() => move(page, -1)}><ArrowUp className="h-3.5 w-3.5" /></BmIconButton>
                  <BmIconButton label={`Descendre ${page.title}`} disabled={index === visibleItems.length - 1} onClick={() => move(page, 1)}><ArrowDown className="h-3.5 w-3.5" /></BmIconButton>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{page.title}</p>
                  <p className="truncate font-mono text-xs text-slate-400">{page.route}</p>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-500">
                  Icône
                  <select
                    value={page.metadata?.icon || ''}
                    onChange={(event) => persistIcon(page, event.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                  >
                    <option value="">—</option>
                    {ICON_SUGGESTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </label>
                <BmBadge tone={page.visibility === 'ALWAYS' ? 'green' : 'amber'}>{page.visibility}</BmBadge>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
      </BmCard>

      <BmCard title="Liens masqués" subtitle="Pages HIDDEN — non exposées dans la navigation de l’UI Definition">
        {sorted.filter((p) => p.visibility === 'HIDDEN').length === 0 ? (
          <p className="text-xs text-slate-400">Aucune page masquée.</p>
        ) : (
          <ul className="space-y-1">
            {sorted.filter((p) => p.visibility === 'HIDDEN').map((page) => (
              <li key={page.id} className="flex items-center justify-between text-sm"><span className="text-slate-700">{page.title}</span><span className="font-mono text-xs text-slate-400">{page.route}</span></li>
            ))}
          </ul>
        )}
      </BmCard>
    </div>
  );
}

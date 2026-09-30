/**
 * UI Builder — Page Manager (mission §10) : create/update/delete contrôlé,
 * ordre, route/title/type/layout/visibility/permissions/metadata, validation
 * des routes (backend + UX locale), détection de doublons.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

import {
  fetchPages, submitCreatePage, submitDeletePage, submitReorder, updatePageSettings, saveCurrentPage,
} from '../store/uiBuilderSlice.js';
import { PAGE_TYPES, PAGE_LAYOUTS, PAGE_VISIBILITIES, describeError } from '../model/uiDefinition.js';
import {
  BmCard, BmTable, BmBadge, BmButton, BmIconButton, BmEmptyState, BmErrorState, BmLoading, BmSelect, BmSearchInput, bmSafeError,
} from '../../../components/business-manager/bm/ui.jsx';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { ROUTES } from '../../../app/routes.js';

const ROUTE_RE = /^\/[a-zA-Z0-9_\-/:{}]*$/;
const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const EMPTY_FORM = { key: '', route: '', title: '', description: '', type: 'CUSTOM', layout: 'SIDEBAR', visibility: 'ALWAYS' };

export default function UiPagesManager() {
  return (
    <UiBuilderLayout subTab="pages">
      <PagesBody />
    </UiBuilderLayout>
  );
}

function PagesBody() {
  const dispatch = useDispatch();
  const { pages, pagesStatus, applicationVersionId, lastActionError } = useSelector((state) => state.uiBuilder);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (applicationVersionId) dispatch(fetchPages(applicationVersionId));
  }, [applicationVersionId, dispatch]);

  const localErrors = useMemo(() => {
    const errors = {};
    const routes = new Map();
    const keys = new Map();
    for (const page of pages) {
      if (routes.has(page.route)) errors[page.id] = 'Route dupliquée';
      else routes.set(page.route, page.id);
      if (keys.has(page.key)) errors[page.id] = 'Key dupliquée';
      else keys.set(page.key, page.id);
    }
    return errors;
  }, [pages]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const sorted = [...pages].sort((a, b) => a.order - b.order);
    if (!query) return sorted;
    return sorted.filter((p) => `${p.title} ${p.key} ${p.route}`.toLocaleLowerCase().includes(query));
  }, [pages, search]);

  const validateForm = () => {
    if (!KEY_RE.test(form.key)) return 'Key invalide : minuscules, chiffres et tirets (ex. customers-list).';
    if (!form.route.startsWith('/')) return 'La route doit commencer par « / ».';
    if (!ROUTE_RE.test(form.route)) return 'Route invalide : caractères autorisés : lettres, chiffres, - _ / : { }.';
    if (!form.title.trim()) return 'Le titre est requis.';
    if (pages.some((p) => p.key === form.key)) return `Une page avec la key « ${form.key} » existe déjà.`;
    if (pages.some((p) => p.route === form.route)) return `Une page avec la route « ${form.route} » existe déjà.`;
    return '';
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) { setFormError(validationError); return; }
    setFormError('');
    setCreating(true);
    try {
      await dispatch(submitCreatePage({
        applicationVersionId,
        key: form.key,
        route: form.route,
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        layout: form.layout,
        visibility: form.visibility,
      })).unwrap();
      setForm(EMPTY_FORM);
    } catch (error) {
      setFormError(describeError(error));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Supprimer définitivement la page « ${page.title} » (${page.route}) ?`)) return;
    try {
      await dispatch(submitDeletePage(page.id)).unwrap();
    } catch (error) {
      setFormError(describeError(error));
    }
  };

  const handleMove = async (page, direction) => {
    const sorted = [...pages].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((p) => p.id === page.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    const reordered = [...sorted];
    reordered[index] = swapWith;
    reordered[index + direction] = page;
    try {
      await dispatch(submitReorder({ applicationVersionId, pageIds: reordered.map((p) => p.id) })).unwrap();
    } catch (error) {
      setFormError(describeError(error));
    }
  };

  const handleSettingsChange = async (page, patch) => {
    dispatch(updatePageSettings({ pageId: page.id, patch }));
    try {
      await dispatch(saveCurrentPage()).unwrap();
    } catch {
      /* erreur exposée par le save state global de l'éditeur */
    }
  };

  if (pagesStatus === 'LOADING') return <BmLoading label="Chargement des pages…" />;
  if (pagesStatus === 'ERROR') return <BmErrorState message={lastActionError || undefined} onRetry={() => applicationVersionId && dispatch(fetchPages(applicationVersionId))} />;

  return (
    <div className="space-y-5">
      <BmCard title="Nouvelle page" subtitle="Route, type, layout et visibilité — validés côté backend">
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Key technique *">
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toLocaleLowerCase() })} placeholder="customers-list" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            </Field>
            <Field label="Route *">
              <input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="/customers" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            </Field>
            <Field label="Titre *" >
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Liste des clients" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            </Field>
            <Field label="Type">
              <BmSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={PAGE_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Layout">
              <BmSelect value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })} options={PAGE_LAYOUTS.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Visibilité">
              <BmSelect value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} options={PAGE_VISIBILITIES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Description">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optionnel" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            </Field>
          </div>
          {formError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <BmButton type="submit" disabled={creating}>{creating ? 'Création…' : 'Créer la page'}</BmButton>
          </div>
        </form>
      </BmCard>

      <BmCard
        title={`Pages (${pages.length})`}
        subtitle="Ordre, routes et visibilité de la version"
        headerExtra={<div className="w-56"><BmSearchInput value={search} onChange={(e) => setSearch(e.target.value)} /></div>}
      >
        {filtered.length === 0 ? (
          <BmEmptyState icon={FileText} title={pages.length ? 'Aucun résultat' : 'Aucune page'} description={pages.length ? 'Ajustez la recherche.' : 'Créez la première page ci-dessus.'} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((page, index) => (
              <li key={page.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{page.title}</p>
                    {localErrors[page.id] && <BmBadge tone="rose" dot>{localErrors[page.id]}</BmBadge>}
                    {page.visibility !== 'ALWAYS' && <BmBadge tone="amber">{page.visibility}</BmBadge>}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{page.route} · {page.key} · {page.type} · {page.layout}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <BmIconButton label="Monter" disabled={index === 0} onClick={() => handleMove(page, -1)}><ArrowUp className="h-4 w-4" /></BmIconButton>
                  <BmIconButton label="Descendre" disabled={index === filtered.length - 1} onClick={() => handleMove(page, 1)}><ArrowDown className="h-4 w-4" /></BmIconButton>
                  <Link to={ROUTES.uiBuilder.replace(':pageId', page.id)} className="rounded-lg p-2 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-blue-600" aria-label={`Ouvrir l’éditeur de ${page.title}`}><Pencil className="h-4 w-4" /></Link>
                  <BmIconButton label={`Supprimer ${page.title}`} variant="ghost" onClick={() => handleDelete(page)}><Trash2 className="h-4 w-4 text-rose-500" /></BmIconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </BmCard>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

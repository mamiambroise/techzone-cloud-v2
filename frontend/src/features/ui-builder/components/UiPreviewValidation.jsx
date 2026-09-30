/**
 * UI Builder — Aperçu & Test (mission §26, §32) :
 *  - Preview via le SHARED RENDERER (même moteur que le runtime) ;
 *  - Sélecteur de device DESKTOP / TABLET / MOBILE ;
 *  - Cockpit de validation (ERROR / WARNING / INFO) avec navigation
 *    cliquable erreur → page → éditeur (composant ciblé).
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Monitor, Tablet, Smartphone, ShieldCheck, XCircle, TriangleAlert, Info, RefreshCw, ExternalLink } from 'lucide-react';

import { fetchPages, fetchValidation, fetchBusinessContext, setDevice } from '../store/uiBuilderSlice.js';
import { DEVICE_KINDS, DEVICE_WIDTHS } from '../model/uiDefinition.js';
import { createBindingResolver } from '../renderer/bindingResolver.js';
import { UiRenderer } from '../renderer/Renderer.jsx';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmCard, BmBadge, BmButton, BmEmptyState, BmLoading } from '../../../components/business-manager/bm/ui.jsx';
import { ROUTES } from '../../../app/routes.js';

const LEVEL_STYLES = {
  ERROR: { icon: XCircle, tone: 'rose', label: 'Erreur' },
  WARNING: { icon: TriangleAlert, tone: 'amber', label: 'Avertissement' },
  INFO: { icon: Info, tone: 'blue', label: 'Info' },
};

export default function UiPreviewValidation() {
  return (
    <UiBuilderLayout subTab="preview">
      <PreviewBody />
    </UiBuilderLayout>
  );
}

function PreviewBody() {
  const dispatch = useDispatch();
  const { pages, pagesStatus, validation, validationStatus, businessContext, device, applicationVersionId } = useSelector((state) => state.uiBuilder);
  const [previewPageId, setPreviewPageId] = useState('');

  useEffect(() => {
    if (!applicationVersionId) return undefined;
    dispatch(fetchPages(applicationVersionId));
    dispatch(fetchBusinessContext(applicationVersionId));
    dispatch(fetchValidation(applicationVersionId));
    return undefined;
  }, [applicationVersionId, dispatch]);

  const sorted = useMemo(() => [...pages].sort((a, b) => a.order - b.order), [pages]);
  const page = sorted.find((p) => p.id === previewPageId) || sorted[0];

  const resolveBinding = useMemo(
    () => createBindingResolver({ businessContext }),
    [businessContext],
  );

  const errors = validation?.issues?.filter((issue) => issue.level === 'ERROR') || [];
  const warnings = validation?.issues?.filter((issue) => issue.level === 'WARNING') || [];
  const infos = validation?.issues?.filter((issue) => issue.level === 'INFO') || [];

  if (pagesStatus === 'LOADING') return <BmLoading label="Préparation de l’aperçu…" />;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------- Preview ---------- */}
        <BmCard
          title="Aperçu — Shared Renderer"
          subtitle="Le même moteur rendra la version publiée côté Runtime"
          headerExtra={
            <div role="group" aria-label="Device d’aperçu" className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
              {DEVICE_KINDS.map((kind) => {
                const Icon = kind === 'DESKTOP' ? Monitor : kind === 'TABLET' ? Tablet : Smartphone;
                return (
                  <button
                    key={kind}
                    onClick={() => dispatch(setDevice(kind))}
                    aria-pressed={device === kind}
                    title={kind}
                    className={`rounded-md p-1.5 transition-colors duration-150 ${device === kind ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          }
        >
          {sorted.length === 0 ? (
            <BmEmptyState
              title="Aucune page à prévisualiser"
              description="Créez et composez une page pour voir son rendu ici."
              action={<Link to={ROUTES.uiPages} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Créer une page →</Link>}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Page prévisualisée"
                  value={page?.id || ''}
                  onChange={(event) => setPreviewPageId(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                >
                  {sorted.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.route}</option>)}
                </select>
                {page && <BmBadge tone="violet">{page.type}</BmBadge>}
                <button
                  onClick={() => applicationVersionId && dispatch(fetchValidation(applicationVersionId))}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir l’aperçu
                </button>
              </div>
              {page && (
                <div className="mx-auto rounded-xl border border-slate-200 bg-[#f1f5f9] p-4" style={{ maxWidth: DEVICE_WIDTHS[device] }}>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <UiRenderer tree={page.components} resolveBinding={resolveBinding} businessContext={businessContext} mode="preview" />
                  </div>
                </div>
              )}
            </div>
          )}
        </BmCard>

        {/* ---------- Validation cockpit ---------- */}
        <BmCard
          title="Cockpit de validation"
          subtitle="ERROR / WARNING / INFO — cliquable vers l’éditeur"
          headerExtra={
            <button
              onClick={() => applicationVersionId && dispatch(fetchValidation(applicationVersionId))}
              aria-label="Relancer la validation"
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-blue-600"
            >
              <RefreshCw className={`h-4 w-4 ${validationStatus === 'LOADING' ? 'animate-spin' : ''}`} />
            </button>
          }
        >
          {validationStatus === 'LOADING' ? (
            <BmLoading label="Validation en cours…" />
          ) : !validation ? (
            <BmEmptyState icon={ShieldCheck} title="Validation non exécutée" description="Lancez une validation pour analyser l’UI Definition." />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {validation.status === 'VALID' && <BmBadge tone="green" dot>Valide</BmBadge>}
                {validation.status === 'VALID_WITH_WARNINGS' && <BmBadge tone="amber" dot>Valide avec avertissements</BmBadge>}
                {validation.status === 'INVALID' && <BmBadge tone="rose" dot>Invalide</BmBadge>}
                <span className="ml-auto text-[10px] text-slate-400">{new Date(validation.checkedAt).toLocaleTimeString('fr-FR')}</span>
              </div>

              {errors.length === 0 && warnings.length === 0 && infos.length === 0 && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  Aucun problème détecté : routes, composants, bindings et actions sont conformes.
                </p>
              )}

              <IssueList level="ERROR" issues={errors} />
              <IssueList level="WARNING" issues={warnings} />
              <IssueList level="INFO" issues={infos} />
            </div>
          )}
        </BmCard>
      </div>
    </div>
  );
}

function IssueList({ level, issues }) {
  if (issues.length === 0) return null;
  const style = LEVEL_STYLES[level];
  const Icon = style.icon;
  return (
    <section aria-label={`${style.label}s (${issues.length})`}>
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className={`h-3.5 w-3.5 ${level === 'ERROR' ? 'text-rose-500' : level === 'WARNING' ? 'text-amber-500' : 'text-blue-500'}`} />
        {style.label}s ({issues.length})
      </h3>
      <ul className="space-y-1.5">
        {issues.map((issue, index) => {
          const targetRoute = issue.pageId
            ? ROUTES.uiBuilder.replace(':pageId', issue.pageId)
            : ROUTES.uiPages;
          return (
            <li key={`${issue.code}-${index}`}>
              <Link
                to={targetRoute}
                className="group flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${level === 'ERROR' ? 'bg-rose-500' : level === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-slate-700">{issue.message}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                    {issue.pageKey || 'global'}{issue.componentId ? ` · ${issue.componentId}` : ''} · {issue.code}
                  </span>
                </span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-300 transition-colors duration-150 group-hover:text-blue-500" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

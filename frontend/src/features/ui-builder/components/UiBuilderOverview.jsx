/**
 * UI Builder — Vue d'ensemble (mission §9) : données 100% réelles du backend
 * (application, version, pages, composants, thème, validation), aucun compteur
 * fabriqué. États LOADING / LOADED / EMPTY / ERROR gérés.
 */
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import {
  LayoutTemplate, Boxes, Palette, ShieldCheck, ArrowRight, CircleAlert, TriangleAlert, Info, FileText,
} from 'lucide-react';

import { fetchOverview, fetchValidation } from '../store/uiBuilderSlice.js';
import { BmCard, BmKpiCard, BmErrorState, BmLoading, BmBadge, BmEmptyState } from '../../../components/business-manager/bm/ui.jsx';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { ROUTES } from '../../../app/routes.js';

function ValidationBadge({ validation }) {
  if (!validation) return <BmBadge tone="neutral">Non exécutée</BmBadge>;
  if (validation.status === 'VALID') return <BmBadge tone="green" dot>Valide</BmBadge>;
  if (validation.status === 'VALID_WITH_WARNINGS') return <BmBadge tone="amber" dot>Avec avertissements</BmBadge>;
  return <BmBadge tone="rose" dot>Invalide</BmBadge>;
}

export default function UiBuilderOverview() {
  return (
    <UiBuilderLayout subTab="overview">
      <OverviewBody />
    </UiBuilderLayout>
  );
}

function OverviewBody() {
  const dispatch = useDispatch();
  const { overview, overviewStatus, applicationVersionId, lastActionError } = useSelector((state) => state.uiBuilder);

  useEffect(() => {
    if (applicationVersionId) dispatch(fetchOverview(applicationVersionId));
  }, [applicationVersionId, dispatch]);

  if (overviewStatus === 'LOADING') return <BmLoading label="Chargement de la vue d’ensemble…" />;
  if (overviewStatus === 'ERROR') return <BmErrorState message={lastActionError || undefined} onRetry={() => applicationVersionId && dispatch(fetchOverview(applicationVersionId))} />;
  if (!overview) {
    return (
      <BmEmptyState
        icon={LayoutTemplate}
        title="Aucun contexte chargé"
        description="Sélectionnez une application et une version ci-dessus pour afficher la vue d’ensemble du UI Builder."
      />
    );
  }

  const { application, applicationVersion, counts, themeConfigured, validation, lastPages } = overview;
  const validationIssueCount = (validation?.counts?.errors || 0) + (validation?.counts?.warnings || 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BmKpiCard label="Pages" value={counts.pages} hint={`${counts.forms} formulaire(s)`} icon={FileText} tone="blue" />
        <BmKpiCard label="Composants" value={counts.components} hint="Toutes pages confondues" icon={Boxes} tone="violet" />
        <BmKpiCard label="Thème" value={themeConfigured ? 'Configuré' : 'Par défaut'} hint="Design tokens" icon={Palette} tone="amber" />
        <BmKpiCard
          label="Validation"
          value={validation ? (validation.status === 'VALID' ? 'Valide' : validation.status === 'VALID_WITH_WARNINGS' ? 'Avertissements' : 'Invalide') : '—'}
          hint={validationIssueCount > 0 ? `${validation.counts.errors} erreur(s), ${validation.counts.warnings} alerte(s)` : 'Aucun problème détecté'}
          icon={ShieldCheck}
          tone={validation?.status === 'VALID' ? 'green' : validation?.status === 'VALID_WITH_WARNINGS' ? 'amber' : validation ? 'rose' : 'blue'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <BmCard title="Contexte" subtitle="Tenant → Application → Version" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Application</dt><dd className="font-semibold text-slate-800">{application.name || application.code || '—'}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Version</dt><dd className="font-semibold text-slate-800">{applicationVersion.version}</dd></div>
            <div className="flex items-center gap-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Statut</dt>
              <dd><BmBadge tone={applicationVersion.editable ? 'green' : 'amber'} dot>{applicationVersion.status}</BmBadge></dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">UI Definition</dt>
              <dd className="mt-1"><ValidationBadge validation={validation} /></dd>
            </div>
          </dl>
        </BmCard>

        <BmCard
          title="Accès rapides"
          subtitle="Construire, tester et valider"
          className="lg:col-span-2"
          headerExtra={<ValidationBadge validation={validation} />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickLink to={ROUTES.uiPages} icon={LayoutTemplate} title="Pages" description="Créer, ordonner et configurer les pages de la version." />
            <QuickLink to={ROUTES.uiBuilder.replace(':pageId', 'editor')} icon={Boxes} title="Éditeur visuel" description="Canvas, composants, Inspector, bindings et actions." />
            <QuickLink to={ROUTES.uiPreview} icon={ShieldCheck} title="Aperçu & Test" description="Rendu Shared Renderer + cockpit de validation." />
            <QuickLink to={ROUTES.uiThemes} icon={Palette} title="Thème" description="Design tokens : couleurs, typographie, espacements." />
          </div>
        </BmCard>
      </div>

      <BmCard
        title="Dernières pages modifiées"
        subtitle="Données réelles de la version"
        headerExtra={<Link to={ROUTES.uiPages} className="text-xs font-medium text-blue-600 hover:text-blue-700">Toutes les pages →</Link>}
      >
        {lastPages.length === 0 ? (
          <BmEmptyState
            icon={FileText}
            title="Aucune page"
            description="Créez votre première page pour démarrer la construction de l’interface."
            action={<Link to={ROUTES.uiPages} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors duration-150">Créer une page <ArrowRight className="h-3.5 w-3.5" /></Link>}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {lastPages.map((page) => (
              <li key={page.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{page.title}</p>
                  <p className="truncate text-xs text-slate-400">{page.key} · maj {new Date(page.updatedAt).toLocaleString('fr-FR')}</p>
                </div>
                <Link to={ROUTES.uiBuilder.replace(':pageId', page.id)} className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700">Ouvrir l’éditeur →</Link>
              </li>
            ))}
          </ul>
        )}
      </BmCard>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="bm-hover-lift group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon className="h-4.5 w-4.5" /></span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-bold text-slate-900">{title}<ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-500" /></span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
    </Link>
  );
}

/**
 * UI Builder — Vue d'ensemble : dashboard du projet UI Builder.
 *
 * Toutes les valeurs proviennent de `GET /api/ui-builder/overview/:versionId`
 * (pages, composants, formulaires, bindings, thème, validation). Aucun
 * compteur ni pourcentage fabriqué : la progression affiche des états
 * (À configurer / En cours / Prêt) calculés côté serveur sur les données
 * réelles.
 *
 * États gérés : LOADING / ERROR(FORBIDDEN) / NO_UI_PROJECT / EMPTY_PROJECT /
 * LOADED.
 */
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import {
  LayoutTemplate, Boxes, FileText, ShieldCheck, CircleAlert, TriangleAlert, ArrowRight,
  Plus, PencilRuler, ListTree, Palette, FlaskConical, Compass, Route as RouteIcon,
  CheckCircle2, CircleDashed, Loader2, Lock,
} from 'lucide-react';

import { fetchOverview } from '../store/uiBuilderSlice.js';
import {
  BmCard, BmKpiCard, BmErrorState, BmLoading, BmBadge, BmEmptyState, BmForbiddenState,
} from '../../../components/business-manager/bm/ui.jsx';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { ROUTES } from '../../../app/routes.js';

const PAGE_TYPE_LABELS = {
  LIST: 'Liste',
  FORM: 'Formulaire',
  DASHBOARD: 'Tableau de bord',
  DETAIL: 'Détail',
  CUSTOM: 'Personnalisée',
};

const PROGRESSION_TONES = {
  TODO: { label: 'À configurer', tone: 'neutral', icon: CircleDashed },
  IN_PROGRESS: { label: 'En cours', tone: 'amber', icon: Loader2 },
  READY: { label: 'Prêt', tone: 'green', icon: CheckCircle2 },
};

const VALIDATION_BADGE = {
  VALID: { label: 'Valide', tone: 'green' },
  VALID_WITH_WARNINGS: { label: 'Avec avertissements', tone: 'amber' },
  INVALID: { label: 'Invalide', tone: 'rose' },
};

const editorRoute = (pageId) => ROUTES.uiBuilder.replace(':pageId', pageId);

function formatDate(value) {
  if (!value) return 'Jamais';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function ValidationBadge({ status }) {
  const badge = VALIDATION_BADGE[status];
  if (!badge) return <BmBadge tone="neutral">Non exécutée</BmBadge>;
  return <BmBadge tone={badge.tone} dot>{badge.label}</BmBadge>;
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

  if (overviewStatus === 'LOADING' || !overview) {
    if (overviewStatus === 'ERROR') {
      if (/403|forbidden/i.test(lastActionError || '')) {
        return <BmCard title="Vue d’ensemble"><BmForbiddenState /></BmCard>;
      }
      return (
        <BmCard title="Vue d’ensemble">
          <BmErrorState
            message="Définition UI indisponible pour cette version."
            onRetry={() => applicationVersionId && dispatch(fetchOverview(applicationVersionId))}
          />
        </BmCard>
      );
    }
    return <BmLoading label="Chargement de la vue d’ensemble…" />;
  }

  const { application, applicationVersion, counts, uiProject, themeConfigured, validation, progression, lastSavedAt, lastPages } = overview;
  const isEmptyProject = counts.pages === 0;

  return (
    <div className="space-y-5">
      <ContextHeader
        application={application}
        applicationVersion={applicationVersion}
        validationStatus={validation?.status}
        lastSavedAt={lastSavedAt}
        editable={applicationVersion.editable}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <BmKpiCard label="Pages" value={counts.pages} hint={`${counts.navigationItems} visible(s) dans la navigation`} icon={<LayoutTemplate className="h-6 w-6" />} tone="blue" />
        <BmKpiCard label="Composants" value={counts.components} hint={`${counts.bindings} binding(s) Data Runtime`} icon={<Boxes className="h-6 w-6" />} tone="violet" />
        <BmKpiCard label="Formulaires" value={counts.forms} hint={`${themeConfigured ? 'thème configuré' : 'thème par défaut'}`} icon={<FileText className="h-6 w-6" />} tone="green" />
        <BmKpiCard
          label="Erreurs"
          value={validation?.counts?.errors ?? 0}
          hint={validation?.checkedAt ? `validé le ${formatDate(validation.checkedAt)}` : 'validation non exécutée'}
          icon={<CircleAlert className="h-6 w-6" />}
          tone={(validation?.counts?.errors ?? 0) > 0 ? 'rose' : 'blue'}
        />
        <BmKpiCard
          label="Avertissements"
          value={validation?.counts?.warnings ?? 0}
          hint={`statut ${VALIDATION_BADGE[validation?.status]?.label.toLowerCase() || '—'}`}
          icon={<TriangleAlert className="h-6 w-6" />}
          tone={(validation?.counts?.warnings ?? 0) > 0 ? 'amber' : 'blue'}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ProgressionCard progression={progression} uiProject={uiProject} />

        <BmCard
          title="Validation"
          subtitle="Moteur de validation réel"
          className="lg:col-span-2"
          headerExtra={<ValidationBadge status={validation?.status} />}
        >
          <ValidationPanel validation={validation} />
        </BmCard>
      </div>

      <RecentPagesCard pages={lastPages} isEmptyProject={isEmptyProject} />

      <BmCard
        title="Accès rapides"
        subtitle="Raccourcis vers les écrans existants du UI Builder"
      >
        <QuickActions />
      </BmCard>
    </div>
  );
}

function ContextHeader({ application, applicationVersion, validationStatus, lastSavedAt, editable }) {
  return (
    <BmCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <HeaderField label="Application" value={application?.name || application?.code || '—'} />
          <HeaderField label="Version" value={applicationVersion?.version || '—'} />
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Statut UI</dt>
            <dd className="mt-1">
              <ValidationBadge status={validationStatus} />
            </dd>
          </div>
          <HeaderField label="Dernière sauvegarde" value={formatDate(lastSavedAt)} />
        </dl>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <BmBadge tone={editable ? 'green' : 'amber'} dot>
            Version {editable ? 'éditable' : 'lecture seule'} · {applicationVersion?.status}
          </BmBadge>
          <PrimaryCta />
        </div>
      </div>
    </BmCard>
  );
}

function HeaderField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

/** CTA principale : reprend la page la plus récemment modifiée, sinon la création. */
function PrimaryCta() {
  const lastPages = useSelector((state) => state.uiBuilder.overview?.lastPages || []);
  const target = lastPages[0];
  const to = target ? editorRoute(target.id) : ROUTES.uiPages;

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700"
    >
      <Compass className="h-4 w-4" aria-hidden="true" />
      Continuer la conception
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

function ProgressionCard({ progression, uiProject }) {
  const steps = Array.isArray(progression) ? progression : [];

  return (
    <BmCard
      title="Progression de la conception"
      subtitle="États issus des données réelles"
      className="lg:col-span-1"
      footer={uiProject ? `UI Definition · ${uiProject.pageCount} page(s) · ${uiProject.hasTheme ? 'thème persisté' : 'sans thème'}` : undefined}
    >
      {steps.length === 0 ? (
        <BmEmptyState icon={Loader2} title="Progression indisponible" description="Le serveur n’a pas renvoyé d’état de progression." />
      ) : (
        <ol className="space-y-2.5">
          {steps.map((step) => {
            const meta = PROGRESSION_TONES[step.status] || PROGRESSION_TONES.TODO;
            const Icon = meta.icon;
            return (
              <li key={step.id} className="flex items-start gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${step.status === 'READY' ? 'bg-emerald-50 text-emerald-600' : step.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon className={`h-3.5 w-3.5 ${step.status === 'IN_PROGRESS' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{step.label}</p>
                    <BmBadge tone={meta.tone}>{meta.label}</BmBadge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </BmCard>
  );
}

function ValidationPanel({ validation }) {
  const issues = useMemo(() => validation?.issues || [], [validation]);

  if (!validation) {
    return <BmEmptyState icon={Lock} title="Validation indisponible" description="Aucun résultat de validation n’a pu être chargé." />;
  }

  if (issues.length === 0) {
    return (
      <BmEmptyState
        icon={ShieldCheck}
        title="Aucun problème détecté"
        description="Le moteur de validation n’a trouvé ni erreur ni avertissement sur cette version."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {issues.map((issue, index) => (
        <li key={`${issue.code}-${issue.pageId || 'version'}-${issue.componentId || index}`} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="flex min-w-0 items-start gap-2.5">
            {issue.level === 'ERROR' ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
            ) : (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-800">{issue.message}</p>
              <p className="truncate text-xs text-slate-400">
                {issue.code}
                {issue.pageKey ? ` · ${issue.pageKey}` : ''}
                {issue.componentId ? ` · ${issue.componentId}` : ''}
              </p>
            </div>
          </div>
          {issue.pageId && (
            <Link to={editorRoute(issue.pageId)} className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700">
              Ouvrir →
            </Link>
          )}
        </li>
      ))}
      {validation.truncated && (
        <li className="pt-2.5 text-xs text-slate-500">
          Liste tronquée à 50 problèmes. La totalité est disponible dans l’onglet Aperçu & Test.
        </li>
      )}
    </ul>
  );
}

function RecentPagesCard({ pages, isEmptyProject }) {
  return (
    <BmCard
      title="Pages récemment modifiées"
      subtitle={isEmptyProject ? 'Aucune page dans cette version' : 'Données réelles de la version'}
      headerExtra={<Link to={ROUTES.uiPages} className="text-xs font-medium text-blue-600 hover:text-blue-700">Toutes les pages →</Link>}
    >
      {pages.length === 0 ? (
        <BmEmptyState
          icon={FileText}
          title="Aucune page créée"
          description="Créez votre première page pour démarrer la construction de l’interface."
          action={
            <Link to={ROUTES.uiPages} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-700">
              Créer une page <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {pages.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{page.title}</p>
                <p className="truncate text-xs text-slate-400">
                  {page.route} · {PAGE_TYPE_LABELS[page.type] || page.type} · {page.components} composant(s) · maj {formatDate(page.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <BmBadge tone={page.status === 'READY' ? 'green' : 'neutral'}>{page.status}</BmBadge>
                <BmBadge tone={page.visibility === 'HIDDEN' ? 'neutral' : 'blue'}>{page.visibility}</BmBadge>
                <Link to={editorRoute(page.id)} className="text-xs font-medium text-blue-600 hover:text-blue-700">Ouvrir dans l’éditeur →</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BmCard>
  );
}

function QuickActions({ className = '' }) {
  const lastPages = useSelector((state) => state.uiBuilder.overview?.lastPages || []);
  const editorTarget = lastPages[0] ? editorRoute(lastPages[0].id) : ROUTES.uiBuilder.replace(':pageId', 'editor');

  const actions = [
    { to: ROUTES.uiPages, icon: Plus, label: 'Créer une page' },
    { to: editorTarget, icon: PencilRuler, label: 'Ouvrir l’éditeur' },
    { to: ROUTES.uiForms, icon: ListTree, label: 'Générer un formulaire' },
    { to: ROUTES.uiNavigation, icon: RouteIcon, label: 'Configurer la navigation' },
    { to: ROUTES.uiThemes, icon: Palette, label: 'Modifier le thème' },
    { to: ROUTES.uiPreview, icon: FlaskConical, label: 'Aperçu & Test' },
  ];

  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${className}`}>
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:border-blue-200 hover:text-blue-700"
        >
          <action.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
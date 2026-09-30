import BMContractsPanel from './BMContractsPanel.jsx';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Database, Boxes, Compass, Settings2, ShieldCheck, ChevronDown, ChevronRight,
  ArrowRight, Pencil, Archive, Trash2, MoreVertical, Plus, Layers, CircleDot,
  AlertTriangle, XCircle, CheckCircle2, Clock, Rocket,
} from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';
import { PageHeader } from '../ui/PageHeader.jsx';
import {
  BmPage, BmBreadcrumb, BmContextBar, BmCard, BmTabs, BmTable, BmBadge, BmStatusBadge,
  BmButton, BmIconButton, BmEmptyState, BmSearchEmptyState, BmErrorState, BmLoading,
  BmPlannedState, bmSafeError,
} from './bm/ui.jsx';
import { BMResourceEditor, inputClass } from './BMResourceEditor.jsx';

const root = '/business-manager';
const get = (path) => api.get(root + path).then((r) => r.data);

const SECTION_ICONS = { 'data-model': Database, features: Boxes, navigation: Compass, validation: ShieldCheck };
const SECTIONS = [
  ['data-model', 'Modèles de données'],
  ['features', 'Fonctionnalités'],
  ['navigation', 'Navigation'],
  ['validation', 'Validation & publication'],
];

const fieldTypes = 'TEXT LONG_TEXT INTEGER BIG_INTEGER DECIMAL CURRENCY PERCENTAGE BOOLEAN DATE DATETIME TIME EMAIL PHONE URL ENUM MULTI_ENUM UUID SEQUENCE FILE IMAGE JSON RELATION FORMULA'.split(' ');

// Metadonnées d'un champ du formulaire BMResourceEditor (aucune donnée inventée :
// les listes d'options reflètent les enums réels du schéma Prisma).
const COMMON_FIELDS = [{ key: 'code', label: 'Code technique', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'description', label: 'Description' }];

export default function BMWorkspaceRoute() {
  const { activeTenant } = useTenant();
  return <Workspace key={activeTenant?.id || 'none'} tenant={activeTenant} />;
}

function Workspace({ tenant }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const storageKey = `bm-context:${tenant?.id}`;
  const [saved, setSaved] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { return {}; } });

  const applicationId = params.applicationId || saved.applicationId || '';
  const versionId = params.versionId || (applicationId === saved.applicationId ? saved.versionId : '') || '';
  const suffix = location.pathname.split('/').pop();
  const section = SECTIONS.some(([id]) => id === suffix) ? suffix : 'data-model';

  const [applications, setApplications] = useState([]);
  const [versions, setVersions] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true); setError(''); setApplications([]); setVersions([]); setEnvironments([]);
    if (!tenant) { setLoading(false); return undefined; }
    (async () => {
      const [apps, envs] = await Promise.all([get('/applications'), get('/environments')]);
      const vers = applicationId && apps.some((a) => a.id === applicationId) ? await get(`/applications/${applicationId}/versions`) : [];
      if (live) { setApplications(apps); setVersions(vers); setEnvironments(envs); }
    })().catch(() => { if (live) setError(bmSafeError); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [tenant?.id, applicationId, revision]);

  const application = applications.find((a) => a.id === applicationId);
  const version = versions.find((v) => v.id === versionId);

  useEffect(() => {
    if (application && version) {
      sessionStorage.setItem(storageKey, JSON.stringify({ applicationId, versionId }));
      setSaved((previous) => (previous.applicationId === applicationId && previous.versionId === versionId ? previous : { applicationId, versionId }));
    }
  }, [application, version, storageKey, applicationId, versionId]);

  const path = (appId, verId, targetSection = section) => `${root}/applications/${appId}/versions${verId ? `/${verId}/${targetSection}` : ''}`;

  const versionOptions = [{ value: '', label: 'Sélectionner une version' }, ...versions.map((v) => ({ value: v.id, label: `${v.version} — ${v.status}` }))];
  const applicationOptions = [{ value: '', label: 'Sélectionner une application' }, ...applications.map((a) => ({ value: a.id, label: a.name }))];

  return (
    <BmPage>
      <BmBreadcrumb
        items={[
          { label: 'Business Manager', onClick: () => navigate(root) },
          { label: 'Applications', onClick: () => navigate(`${root}/applications`) },
          ...(application ? [{ label: application.name, onClick: () => navigate(`${root}/applications/${application.id}`) }] : []),
          ...(version ? [{ label: `Version ${version.version}` }] : []),
          { label: SECTIONS.find(([id]) => id === section)?.[1] },
        ]}
      />
      <PageHeader
        title={SECTIONS.find(([id]) => id === section)?.[1]}
        subtitle="Définition de la version d’application sélectionnée."
      />

      <BmContextBar
        items={[
          { label: 'Application', value: application?.name },
          { label: 'Version', value: version?.version },
          { label: 'Statut', value: version?.status },
          { label: 'Environnement', value: version?.environment?.name },
          { label: 'Tenant', value: tenant?.name },
        ]}
      />

      {/* Sélecteurs Application / Version (besoin réel du CDC : le contexte pilote tout l'écran) */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <label className="text-xs font-semibold text-slate-600">
          Application
          <select aria-label="Application" className={`${inputClass} mt-1 w-64`} value={application?.id || ''} onChange={(event) => navigate(path(event.target.value, ''))}>
            {applicationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Version
          <select aria-label="Version" className={`${inputClass} mt-1 w-56`} value={version?.id || ''} disabled={!applicationId} onChange={(event) => navigate(path(applicationId, event.target.value))}>
            {versionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {/* Navigation secondaire entre sections */}
      <nav aria-label="Sections de la version" className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-2xs">
        {SECTIONS.map(([id, label]) => {
          const Icon = SECTION_ICONS[id];
          const isActive = id === section;
          return (
            <Link
              key={id}
              to={path(applicationId, versionId, id)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 bm-focus ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {loading ? (
        <BmLoading label="Chargement du contexte…" />
      ) : error ? (
        <BmErrorState message={error} onRetry={() => setRevision((r) => r + 1)} />
      ) : !version ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
          <BmEmptyState
            icon={Layers}
            title="Aucune version sélectionnée"
            description="Choisissez une application et une version ci-dessus pour accéder à ses modèles de données, fonctionnalités, navigation et validation."
          />
        </div>
      ) : (
        <Domain key={`${versionId}:${section}`} versionId={versionId} section={section} navigate={navigate} applicationId={applicationId} />
      )}
    </BmPage>
  );
}

// =====================================================================
// Domain : contenu par section (data-model / features / navigation / validation)
// =====================================================================

const TABS = {
  'data-model': ['overview', 'entities', 'fields', 'relations', 'constraints'],
  features: ['features', 'capabilities', 'dependencies'],
  navigation: ['menus', 'items'],
  validation: ['workflow', 'reports'],
};

const TAB_LABELS = {
  overview: 'Vue d’ensemble', entities: 'Entités', fields: 'Champs', relations: 'Relations', constraints: 'Contraintes',
  features: 'Features', capabilities: 'Capacités', dependencies: 'Dépendances',
  menus: 'Menus', items: 'Éléments',
  workflow: 'Workflow de publication', reports: 'Historique des validations',
};

function Domain({ versionId, section, navigate, applicationId }) {
  const tabs = TABS[section];
  const [tab, setTab] = useState(tabs[0]);
  const [rows, setRows] = useState([]);
  const [relations, setRelations] = useState([]);
  const [dependencies, setDependencies] = useState(null);
  const [parent, setParent] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [validationField, setValidationField] = useState(null);

  const base = section === 'data-model' ? `/data-model/${versionId}/schema`
    : section === 'features' ? `/features/${versionId}`
    : section === 'navigation' ? `/navigation/${versionId}/menus`
    : `/validation/${versionId}/reports`;

  useEffect(() => {
    let live = true;
    setLoading(true); setError(''); setSearch(''); setParent('');
    const requests = [get(base)];
    if (section === 'data-model') requests.push(get(`/data-model/${versionId}/relations`));
    if (section === 'features') requests.push(get(`/features/${versionId}/dependencies`));
    Promise.all(requests)
      .then(([data, extra]) => {
        if (!live) return;
        setRows(data || []);
        setRelations(section === 'data-model' ? extra || [] : []);
        setDependencies(section === 'features' ? extra : null);
      })
      .catch(() => { if (live) setError(bmSafeError); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [base, versionId, section, revision]);

  function refresh() { setRevision((r) => r + 1); }

  async function mutate(action) {
    setBusy(true); setError('');
    try { await action(); refresh(); } catch { setError(bmSafeError); } finally { setBusy(false); }
  }

  const selected = rows.find((row) => row.id === parent);
  const parentOptions = rows.map((row) => ({ value: row.id, label: row.name || row.code }));

  // ---- État vide réel (pas de faux contenu) — libellés selon la section ----
  const emptyLabel = section === 'data-model' ? 'Aucune entité' : section === 'features' ? 'Aucune fonctionnalité' : section === 'navigation' ? 'Aucun menu' : 'Aucun rapport';
  const emptyHint = {
    'data-model': 'Créez votre première entité pour définir les données métier de cette version.',
    features: 'Créez une fonctionnalité puis ses capacités pour décrire ce que fait l’application.',
    navigation: 'Créez un menu pour structurer la navigation de l’application.',
    validation: 'Lancez une première validation pour évaluer la préparation de cette version.',
  }[section];

  // ---- Configuration CRUD par section (identique aux contrats backend réels) ----
  let data = rows;
  let fields = COMMON_FIELDS;
  let createPath = '';
  let updatePath;
  let removePath;
  let removeMethod = 'post';
  let removeLabel = 'Archiver';
  let columns = [];
  let createLabel = 'Créer';
  let needsParent = false;
  let parentKind = 'Entité';

  if (section === 'data-model') {
    if (tab === 'fields') {
      needsParent = true; parentKind = 'Entité';
      data = selected?.fields || [];
      createPath = `/data-model/entities/${parent}/fields`;
      updatePath = (row) => `/data-model/fields/${row.id}`;
      removePath = updatePath; removeMethod = 'delete'; removeLabel = 'Supprimer';
      fields = [COMMON_FIELDS[0], { key: 'label', label: 'Libellé' }, { key: 'type', label: 'Type', required: true, options: fieldTypes, default: 'TEXT' }, { key: 'required', label: 'Obligatoire', type: 'checkbox' }, { key: 'defaultValue', label: 'Valeur par défaut' }, { key: 'configuration', label: 'Configuration (JSON)', type: 'json' }];
      columns = [
        { key: 'label', label: 'Libellé', render: (row) => <span className="font-medium text-slate-800">{row.label || '—'}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'type', label: 'Type', render: (row) => <BmBadge tone="violet">{row.type}</BmBadge> },
        { key: 'required', label: 'Obligatoire', render: (row) => (row.required ? <BmBadge tone="green">Oui</BmBadge> : <BmBadge tone="neutral">Non</BmBadge>) },
      ];
      createLabel = 'Créer un champ';
    } else if (tab === 'relations') {
      data = relations;
      createPath = `/data-model/${versionId}/relations`;
      fields = [COMMON_FIELDS[0], { key: 'sourceEntityId', label: 'Entité source', required: true, options: parentOptions }, { key: 'targetEntityId', label: 'Entité cible', required: true, options: parentOptions }, { key: 'deleteBehavior', label: 'Comportement de suppression', options: ['RESTRICT', 'CASCADE', 'SET_NULL'], default: 'RESTRICT' }];
      columns = [
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'sourceEntityId', label: 'Source', render: (row) => rows.find((e) => e.id === row.sourceEntityId)?.name || 'Indisponible' },
        { key: 'targetEntityId', label: 'Cible', render: (row) => rows.find((e) => e.id === row.targetEntityId)?.name || 'Indisponible' },
        { key: 'deleteBehavior', label: 'Suppression', render: (row) => <BmBadge tone="neutral">{row.deleteBehavior}</BmBadge> },
      ];
      createLabel = 'Créer une relation';
    } else if (tab === 'constraints') {
      needsParent = true; parentKind = 'Entité';
      data = selected?.constraints || [];
      createPath = `/data-model/entities/${parent}/constraints`;
      fields = [COMMON_FIELDS[0], COMMON_FIELDS[1], { key: 'definition', label: 'Définition (JSON)', type: 'json' }];
      columns = [
        { key: 'name', label: 'Nom', render: (row) => <span className="font-medium text-slate-800">{row.name || '—'}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
      ];
      createLabel = 'Créer une contrainte';
    } else {
      createPath = `/data-model/${versionId}/entities`;
      updatePath = (row) => `/data-model/entities/${row.id}`;
      removePath = (row) => `${updatePath(row)}/archive`;
      columns = [
        { key: 'name', label: 'Nom', render: (row) => <span className="flex items-center gap-2 font-medium text-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Database className="h-4 w-4" aria-hidden="true" /></span>{row.name || row.code}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'description', label: 'Description', render: (row) => <span className="line-clamp-1 max-w-[280px] text-slate-500">{row.description || '—'}</span> },
        { key: 'fields', label: 'Champs', className: 'text-center', render: (row) => <BmBadge tone="neutral">{row.fields?.length ?? 0}</BmBadge> },
        { key: 'relations', label: 'Relations', className: 'text-center', render: (row) => <BmBadge tone="neutral">{relations.filter((rel) => rel.sourceEntityId === row.id || rel.targetEntityId === row.id).length}</BmBadge> },
        { key: 'status', label: 'Statut', render: (row) => <BmStatusBadge value={row.status} /> },
      ];
      createLabel = 'Créer une entité';
    }
  } else if (section === 'features') {
    if (tab === 'capabilities') {
      needsParent = true; parentKind = 'Feature';
      data = selected?.capabilities || [];
      createPath = `/features/feature/${parent}/capabilities`;
      fields = [...COMMON_FIELDS, { key: 'required', label: 'Obligatoire', type: 'checkbox' }];
      updatePath = (row) => `/features/capabilities/${row.id}`;
      removePath = (row) => `${updatePath(row)}/archive`;
      columns = [
        { key: 'name', label: 'Nom', render: (row) => <span className="font-medium text-slate-800">{row.name || row.code}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'required', label: 'Obligatoire', render: (row) => (row.required ? <BmBadge tone="green">Oui</BmBadge> : <BmBadge tone="neutral">Non</BmBadge>) },
        { key: 'status', label: 'Statut', render: (row) => <BmStatusBadge value={row.status} /> },
      ];
      createLabel = 'Créer une capacité';
    } else if (tab === 'dependencies') {
      // Endpoint réel : GET /features/:versionId/dependencies
      data = (dependencies || []).flatMap((feature) => feature.capabilities.flatMap((capability) => capability.dependencies.map((dependency) => ({
        id: `${capability.code}:${dependency.targetCapabilityCode}:${dependency.dependencyType}`,
        featureName: feature.name,
        capabilityCode: capability.code,
        ...dependency,
      }))));
      columns = [
        { key: 'featureName', label: 'Feature', render: (row) => <span className="font-medium text-slate-800">{row.featureName}</span> },
        { key: 'capabilityCode', label: 'Capacité', render: (row) => <span className="font-mono text-xs text-slate-500">{row.capabilityCode || '—'}</span> },
        { key: 'targetCapabilityCode', label: 'Capacité cible', render: (row) => <span className="font-mono text-xs text-slate-500">{row.targetCapabilityCode || '—'}</span> },
        { key: 'dependencyType', label: 'Type', render: (row) => <BmBadge tone={row.dependencyType === 'REQUIRED' ? 'red' : 'blue'}>{row.dependencyType}</BmBadge> },
      ];
    } else {
      createPath = `/features/${versionId}`;
      updatePath = (row) => `/features/feature/${row.id}`;
      removePath = (row) => `${updatePath(row)}/archive`;
      columns = [
        { key: 'name', label: 'Nom', render: (row) => <span className="flex items-center gap-2 font-medium text-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Boxes className="h-4 w-4" aria-hidden="true" /></span>{row.name || row.code}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'capabilities', label: 'Capacités', className: 'text-center', render: (row) => <BmBadge tone="neutral">{row.capabilities?.length ?? 0}</BmBadge> },
        { key: 'status', label: 'Statut', render: (row) => <BmStatusBadge value={row.status} /> },
      ];
      createLabel = 'Créer une fonctionnalité';
    }
  } else if (section === 'navigation') {
    if (tab === 'items') {
      needsParent = true; parentKind = 'Menu';
      data = selected?.items || [];
      createPath = `/navigation/menus/${parent}/items`;
      updatePath = (row) => `/navigation/items/${row.id}`;
      fields = [COMMON_FIELDS[0], { key: 'label', label: 'Libellé' }, { key: 'itemType', label: 'Type', options: ['LINK', 'GROUP', 'SEPARATOR', 'EXTERNAL_LINK'], default: 'LINK', required: true }, { key: 'routePath', label: 'Route' }, { key: 'icon', label: 'Icône' }, { key: 'parentItemId', label: 'Élément parent (UUID, vide = racine)' }, { key: 'orderIndex', label: 'Ordre', type: 'number', default: 0 }, { key: 'visibility', label: 'Visibilité', options: ['VISIBLE', 'HIDDEN', 'DISABLED'], default: 'VISIBLE' }];
      columns = [
        { key: 'label', label: 'Libellé', render: (row) => <span className="font-medium text-slate-800">{row.label || row.code}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'itemType', label: 'Type', render: (row) => <BmBadge tone="blue">{row.itemType}</BmBadge> },
        { key: 'routePath', label: 'Route', render: (row) => <span className="font-mono text-xs text-slate-500">{row.routePath || '—'}</span> },
        { key: 'orderIndex', label: 'Ordre', className: 'text-center', render: (row) => row.orderIndex ?? 0 },
        { key: 'visibility', label: 'Visibilité', render: (row) => <BmStatusBadge value={row.visibility} /> },
      ];
      createLabel = 'Ajouter un élément';
    } else {
      createPath = `/navigation/${versionId}/menus`;
      updatePath = (row) => `/navigation/menus/${row.id}`;
      fields = [...COMMON_FIELDS, { key: 'location', label: 'Emplacement', options: ['SIDEBAR', 'TOPBAR', 'CONTEXT_MENU', 'FOOTER', 'DASHBOARD', 'CUSTOM'], default: 'SIDEBAR' }];
      columns = [
        { key: 'name', label: 'Nom', render: (row) => <span className="flex items-center gap-2 font-medium text-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Compass className="h-4 w-4" aria-hidden="true" /></span>{row.name || row.code}</span> },
        { key: 'code', label: 'Code technique', render: monoCode },
        { key: 'location', label: 'Emplacement', render: (row) => <BmBadge tone="neutral">{row.location}</BmBadge> },
        { key: 'items', label: 'Éléments', className: 'text-center', render: (row) => <BmBadge tone="neutral">{row.items?.length ?? 0}</BmBadge> },
        { key: 'status', label: 'Statut', render: (row) => <BmStatusBadge value={row.status} /> },
      ];
      createLabel = 'Créer un menu';
    }
  }

  // Liste affichée : data est réassignée par la configuration de section (onglets
  // dépendants d'un parent : Champs, Contraintes, Capacités, Éléments). La recherche
  // s'applique au-dessus de cette liste déjà scopée par le parent.
  const dataSearch = String(search).toLowerCase();
  const filtered = data.filter((row) => {
    if (!dataSearch.trim()) return true;
    const q = dataSearch;
    return [row.name, row.code, row.label, row.description].some((value) => String(value || '').toLowerCase().includes(q));
  });

  function createButton() {
    if (!createPath) return null;
    return (
      <BmButton size="sm" icon={<Plus className="h-4 w-4" />} disabled={busy || (needsParent && !selected)} onClick={() => setEditor({})}>
        {createLabel}
      </BmButton>
    );
  }

  // État vide réel : construit après la configuration CRUD pour réutiliser createPath.
  const emptyState = (
    <BmEmptyState
      title={search ? 'Aucun résultat' : emptyLabel}
      description={search ? 'Ajustez votre recherche.' : emptyHint}
      action={search ? undefined : createButton()}
    />
  );

  const actionsColumn = (onView) => ({
    key: 'actions',
    label: 'Actions',
    className: 'text-right',
    render: (row) => (
      <div className="flex items-center justify-end gap-1">
        {onView && <BmIconButton label="Voir" onClick={() => onView(row)}><MoreVertical className="h-4 w-4" /></BmIconButton>}
        {updatePath && <BmIconButton label="Modifier" disabled={row.status === 'ARCHIVED' || busy} onClick={() => setEditor(row)}><Pencil className="h-4 w-4" /></BmIconButton>}
        {removePath && <BmIconButton label={removeLabel} variant="danger" disabled={row.status === 'ARCHIVED' || busy} onClick={() => { if (window.confirm(`${removeLabel} « ${row.name || row.label || row.code} » ?`)) mutate(() => api[removeMethod](root + removePath(row))); }}><Archive className="h-4 w-4" /></BmIconButton>}
      </div>
    ),
  });

  return (
    <section className="space-y-4">
      <BmTabs tabs={tabs.map((id) => ({ id, label: TAB_LABELS[id] }))} active={tab} onChange={(id) => { setTab(id); setEditor(null); setValidationField(null); }} ariaLabel={`Onglets ${section}`} />

      {needsParent && (
        <label className="block max-w-md text-xs font-semibold text-slate-600">
          {parentKind}
          <select aria-label={parentKind} className={`${inputClass} mt-1`} value={parent} onChange={(event) => { setParent(event.target.value); setEditor(null); setValidationField(null); }}>
            <option value="">Sélectionner</option>
            {parentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      )}

      {error && <BmErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <BmLoading />
      ) : !error && (
        <>
          {/* ---- Validation & publication : workflow réel ---- */}
          {section === 'validation' && tab === 'workflow' && (
            <><BMContractsPanel versionId={versionId} applicationId={applicationId}/><ValidationWorkflow versionId={versionId} applicationId={applicationId} navigate={navigate} onError={setError} /></>
          )}

          {section === 'validation' && tab === 'reports' && (
            <>
              {createButton()}
              <BmTable
                columns={[
                  { key: 'completedAt', label: 'Date', render: (row) => (row.completedAt ? new Date(row.completedAt).toLocaleString('fr-FR') : 'En cours') },
                  { key: 'code', label: 'Rapport', render: monoCode },
                  { key: 'gateResult', label: 'Résultat', render: (row) => <BmStatusBadge value={row.gateResult} /> },
                  { key: 'score', label: 'Score', render: (row) => (row.score != null ? `${row.score}` : '—') },
                  { key: 'issues', label: 'Problèmes', className: 'text-center', render: (row) => <BmBadge tone={row.issues?.length ? 'red' : 'green'}>{row.issues?.length ?? 0}</BmBadge> },
                ]}
                rows={rows}
                emptyState={emptyState}
              />
              {rows.map((report) => report.issues?.map((issue) => (
                <div key={issue.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${issue.severity === 'BLOCKER' || issue.severity === 'ERROR' ? 'border-rose-100 bg-rose-50 text-rose-700' : issue.severity === 'WARNING' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span><strong>{issue.severity}</strong> — {issue.message || issue.code}</span>
                </div>
              )))}
            </>
          )}

          {section !== 'validation' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="search"
                  aria-label="Rechercher dans la liste"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 bm-focus focus:border-blue-400"
                />
                {createButton()}
              </div>

              {editor && (
                <BMResourceEditor
                  key={`${tab}:${editor.id || 'new'}`}
                  fields={fields.filter((field) => !(editor.id && field.key === 'code'))}
                  initial={editor}
                  onCancel={() => setEditor(null)}
                  onSave={async (body) => {
                    await (editor.id ? api.patch(root + updatePath(editor), body) : api.post(root + createPath, body));
                    setEditor(null); refresh();
                  }}
                />
              )}

              {validationField && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <h3 className="mb-2 text-sm font-bold text-slate-900">Validation du champ : {validationField.label || validationField.code}</h3>
                  <BMResourceEditor
                    fields={[{ key: 'validationType', label: 'Validation', required: true, options: ['REQUIRED', 'MIN', 'MAX', 'MIN_LENGTH', 'MAX_LENGTH', 'REGEX', 'EMAIL', 'URL', 'ALLOWED_VALUES', 'PRECISION', 'SCALE'] }, { key: 'value', label: 'Valeur' }, { key: 'message', label: 'Message' }]}
                    onCancel={() => setValidationField(null)}
                    onSave={async (body) => { await api.post(root + '/data-model/field-validations', { ...body, fieldId: validationField.id }); setValidationField(null); refresh(); }}
                  />
                </div>
              )}

              <BmTable
                columns={[...columns, actionsColumn(section === 'data-model' && ['overview', 'entities'].includes(tab) ? (row) => { setParent(row.id); setTab('fields'); setEditor(null); } : section === 'data-model' && tab === 'fields' ? (row) => setValidationField(row) : undefined)]}
                rows={filtered}
                emptyState={emptyState}
                footer={<> {filtered.length} élément(s) sur {rows.length}</>}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}

// render(row, index) : BmTable passe la ligne en premier argument. L'ancien helper
// `mono(value)` rendait l'objet ligne entier comme enfant JSX → crash React dès
// qu'il y a des données réelles. On sélectionne explicitement la colonne.
function monoCode(row) {
  return <span className="font-mono text-xs text-slate-500">{row?.code ?? '—'}</span>;
}

// =====================================================================
// Validation & publication — workflow réel uniquement
// Sources : POST /validation/:versionId/run, GET /validation/:versionId/gate-status,
// GET /validation/:versionId/reports, POST /versions/:id/status/:status (transition réelle).
// La publication orchestrée (quality gate + readiness + snapshot atomique) n'existe
// pas côté backend : elle est signalée comme planned, jamais simulée.
// =====================================================================

const WORKFLOW_STEPS = [
  { id: 'data-model', label: 'Modèles de données', detail: (checks) => checks && `${checks.entities.length} entité(s), ${checks.relations.length} relation(s)` },
  { id: 'features', label: 'Fonctionnalités', detail: (checks) => checks && `${checks.features.length} fonctionnalité(s)` },
  { id: 'navigation', label: 'Navigation', detail: (checks) => checks && `${checks.menus.length} menu(s)` },
  { id: 'configuration', label: 'Configuration', detail: () => 'Voir l’écran Configuration' },
  { id: 'tests', label: 'Tests & validation', detail: (checks) => checks && `${checks.reports.length} rapport(s) de validation` },
  { id: 'publication', label: 'Publication', detail: (checks) => checks && `Statut : ${checks.version?.status}` },
];

function ValidationWorkflow({ versionId, applicationId, navigate, onError }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [busy, setBusy] = useState(false);
  const [environmentId, setEnvironmentId] = useState('');

  function load() {
    setState({ loading: true, error: '', data: null });
    Promise.all([
      get(`/data-model/${versionId}/schema`),
      get(`/data-model/${versionId}/relations`),
      get(`/features/${versionId}`),
      get(`/navigation/${versionId}/menus`),
      get(`/validation/${versionId}/reports`),
      get(`/validation/${versionId}/gate-status`),
      get(`/versions/${versionId}`),
      get('/environments'),
    ])
      .then(([schema, relations, features, menus, reports, gate, version, environments]) => {
        setState({ loading: false, error: '', data: { schema, relations, features, menus, reports, gate, version, environments } });
      })
      .catch(() => { setState({ loading: false, error: bmSafeError, data: null }); });
  }
  useEffect(load, [versionId]);

  if (state.loading) return <BmLoading label="Évaluation de la préparation…" />;
  if (state.error) return <BmErrorState message={state.error} onRetry={load} />;
  const { schema, relations, features, menus, reports, gate, version, environments } = state.data;

  const checks = { entities: schema || [], relations: relations || [], features: features || [], menus: menus || [], reports: reports || [], version };
  const stepStates = {
    'data-model': checks.entities.length > 0 ? 'done' : 'todo',
    features: checks.features.length > 0 ? 'done' : 'todo',
    navigation: checks.menus.length > 0 ? 'done' : 'todo',
    configuration: 'todo',
    tests: gate?.overallStatus === 'PASS' ? 'done' : gate?.overallStatus === 'NOT_EVALUATED' ? 'todo' : 'current',
    publication: version?.status === 'ACTIVE' ? 'done' : 'todo',
  };
  const doneCount = Object.values(stepStates).filter((s) => s === 'done').length;
  const percent = Math.round((doneCount / WORKFLOW_STEPS.length) * 100);

  const latestReport = reports[0];
  const blocking = (latestReport?.issues || []).filter((issue) => issue.severity === 'BLOCKER' || issue.severity === 'ERROR');
  const warnings = (latestReport?.issues || []).filter((issue) => issue.severity === 'WARNING' || issue.severity === 'INFO');

  async function runValidation() {
    setBusy(true); onError('');
    try { await api.post(`${root}/validation/${versionId}/run`, {}); load(); }
    catch { onError(bmSafeError); } finally { setBusy(false); }
  }

  async function promote() {
    // Transition de statut réelle : DRAFT → CONFIGURING → VALIDATING → READY (machine à états backend).
    const order = ['DRAFT', 'CONFIGURING', 'VALIDATING', 'READY'];
    const currentIndex = order.indexOf(version?.status);
    if (currentIndex < 0 || currentIndex >= order.length - 1) return;
    setBusy(true); onError('');
    try {
      await api.post(`${root}/versions/${versionId}/status/${order[currentIndex + 1]}`, {});
      load();
    } catch { onError(bmSafeError); } finally { setBusy(false); }
  }

  const canPromote = ['DRAFT', 'CONFIGURING', 'VALIDATING'].includes(version?.status);

  return (
    <div className="space-y-4">
      {/* Étapes du workflow (états calculés depuis les données réelles) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {WORKFLOW_STEPS.map((step, index) => {
            const state2 = stepStates[step.id];
            const tones = { done: 'bg-emerald-500 text-white', todo: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', current: 'bg-blue-600 text-white' };
            return (
              <li key={step.id} className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${tones[state2]}`} aria-current={state2 === 'current' ? 'step' : undefined}>
                  {state2 === 'done' ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className={`text-sm ${state2 === 'todo' ? 'text-slate-500' : 'font-semibold text-slate-800'}`}>{step.label}</span>
                {index < WORKFLOW_STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* État de préparation */}
        <BmCard title="État de préparation" className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <span className="text-xl font-bold text-blue-700">{percent}%</span>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {WORKFLOW_STEPS.map((step) => {
                const state2 = stepStates[step.id];
                return (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    {state2 === 'done' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      : state2 === 'current' ? <Clock className="h-4 w-4 text-blue-500" aria-hidden="true" />
                      : <CircleDot className="h-4 w-4 text-slate-300" aria-hidden="true" />}
                    <span className={state2 === 'todo' ? 'text-slate-500' : 'font-medium text-slate-800'}>{step.label}</span>
                    <span className="ml-auto hidden text-xs text-slate-400 sm:block">{step.detail(checks) || ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </BmCard>

        {/* Actions de publication */}
        <BmCard title="Actions de publication">
          <div className="space-y-3">
            <BmButton className="w-full" icon={<ShieldCheck className="h-4 w-4" />} disabled={busy} onClick={runValidation}>
              Lancer la validation
            </BmButton>
            <BmButton className="w-full" variant="secondary" icon={<Rocket className="h-4 w-4" />} disabled={busy || !canPromote} onClick={promote} title={canPromote ? 'Faire avancer le statut de la version' : 'Version déjà publiée ou archivée'}>
              Faire avancer le statut{version ? ` (${version.status})` : ''}
            </BmButton>
            <label className="block text-xs font-semibold text-slate-600">
              Environnement de publication
              <select aria-label="Environnement de publication" className={`${inputClass} mt-1 w-full`} value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)}>
                <option value="">Sélectionner un environnement…</option>
                {(environments || []).map((environment) => <option key={environment.id} value={environment.id}>{environment.name} ({environment.type})</option>)}
              </select>
            </label>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
              La publication complète (gate qualité + readiness runtime + snapshot) n’est pas encore orchestrée par la plateforme. Seule la transition de statut de la version est réelle.
            </p>
            <BmPlannedState
              title="Publication orchestrée"
              description="Le pipeline complet de publication (quality gate → runtime readiness → snapshot immuable) sera livré avec le Runtime Bridge."
            />
          </div>
        </BmCard>
      </div>

      {/* Problèmes & avertissements — issus du dernier rapport réel */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BmCard title={`Problèmes bloquants (${blocking.length})`}>
          {blocking.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Aucun problème bloquant dans le dernier rapport.</p>
          ) : (
            <ul className="space-y-2">
              {blocking.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span><strong>{issue.severity}</strong> — {issue.message || issue.code}</span>
                </li>
              ))}
            </ul>
          )}
        </BmCard>
        <BmCard title={`Avertissements (${warnings.length})`}>
          {warnings.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Aucun avertissement dans le dernier rapport.</p>
          ) : (
            <ul className="space-y-2">
              {warnings.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span><strong>{issue.severity}</strong> — {issue.message || issue.code}</span>
                </li>
              ))}
            </ul>
          )}
        </BmCard>
      </div>

      {/* Historique réel (rapports) */}
      <BmCard title="Historique des validations" headerExtra={<BmBadge tone="neutral">{reports.length} rapport(s)</BmBadge>}>
        {reports.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Aucune validation exécutée pour cette version. Lancez la première validation ci-dessus.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.slice(0, 8).map((report) => (
              <li key={report.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <BmStatusBadge value={report.gateResult} />
                <span className="font-medium text-slate-800">{report.name || report.code}</span>
                <span className="text-xs text-slate-400">Score : {report.score ?? '—'}</span>
                <BmBadge tone="neutral">{report.issues?.length ?? 0} problème(s)</BmBadge>
                <time className="ml-auto text-xs text-slate-400" dateTime={report.completedAt}>{report.completedAt ? new Date(report.completedAt).toLocaleString('fr-FR') : 'En cours'}</time>
              </li>
            ))}
          </ul>
        )}
      </BmCard>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Copy, Play, Power, RefreshCw, ShieldCheck } from 'lucide-react';
import { BmButton, BmEmptyState, BmLoading, BmTable, BmTabs } from '../business-manager/bm/ui.jsx';
import PublishedApplication from './PublishedApplication.jsx';
import { RuntimeError, RuntimeFacts, RuntimeJson, RuntimePanel, RuntimeStatus } from './RuntimePrimitives.jsx';
import { canActivate, canOpen, effectiveOf, formatDate, resolutionIdentity, resolutionStatus, shortId } from './runtimeModel.js';

const stages = { 'manifest.load': 'Chargement du pack', 'manifest.validate': 'Intégrité du manifeste', 'context.resolve': 'Contexte métier', 'module_feature.resolve': 'Modules et fonctionnalités', 'capability_dependency.resolve': 'Capacités et dépendances', 'rules.evaluate': 'Règles applicables', 'effective_manifest.build': 'Manifeste effectif' };
const tabs = [{ id: 'summary', label: 'Synthèse' }, { id: 'manifest', label: 'Manifeste' }, { id: 'capabilities', label: 'Capacités' }, { id: 'dependencies', label: 'Dépendances' }, { id: 'configuration', label: 'Configuration' }, { id: 'bindings', label: 'Données & services' }, { id: 'logs', label: 'Journal des étapes' }];

export default function RuntimeDetail({ state, tenantId, applications, contexts, allowed, busy, onAction, onDeactivate, onRetry, initialTab = 'summary', now }) {
  const [tab, setTab] = useState(initialTab);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (state.loading) return <BmLoading label="Chargement de la résolution…" />;
  if (state.error) return <RuntimeError error={state.error} onRetry={onRetry} />;
  const resolution = state.resolution;
  if (!resolution) return <RuntimePanel title="Détail d’exécution"><BmEmptyState title="Sélectionnez une résolution" description="Ouvrez une résolution ou un contexte pour examiner son parcours, ses diagnostics et son manifeste effectif." /></RuntimePanel>;
  const effective = effectiveOf(resolution);
  const identity = resolutionIdentity(resolution, applications);
  const context = contexts.find(c => c.resolutionId === resolution.id) || (resolution.result?.runtimeContext ? { ...resolution.result.runtimeContext, expiresAt: resolution.result.expiresAt } : null);
  const status = resolutionStatus(resolution, now);
  const executable = canActivate(resolution, now);
  const runnable = canOpen(resolution, context, now);
  const diagnostics = state.diagnostics || (Array.isArray(resolution.diagnostics) ? resolution.diagnostics : []);
  const mismatch = diagnostics.some(d => /VERSION_MISMATCH/.test(d.code));
  const capabilities = (effective?.capabilities || []).map(c => typeof c === 'string' ? { code: c } : c);
  const checks = [
    ['Résolution serveur', status],
    ['Manifeste effectif', effective ? (resolution.effectiveManifest.executable === true ? 'VALID' : 'BLOCKED') : 'UNKNOWN'],
    ['Contexte actif', context?.status || 'INACTIVE'],
    ['Readiness du contexte', context?.readiness || 'UNKNOWN'],
  ];
  async function copyId() { try { await navigator.clipboard.writeText(resolution.id); setCopied(true); } catch { setCopied(false); } }
  return <div className="rt-detail" aria-label="Détail de la résolution">
    <RuntimePanel title={identity.application} subtitle={`${identity.pack} · ${identity.packVersion} · ${identity.environment}`} headerExtra={<RuntimeStatus value={status} />}>
      <div className="rt-detail-heading"><div><p className="rt-muted">Résolution <code title={resolution.id}>{shortId(resolution.id)}</code></p><button type="button" className="rt-link rt-inline" onClick={copyId}><Copy size={13} aria-hidden="true" />{copied ? 'Identifiant copié' : 'Copier l’identifiant'}</button></div><div className="rt-actions">
        {executable && context?.status !== 'ACTIVE' && allowed('runtime.activate') && <BmButton disabled={busy} icon={<Play size={15} />} onClick={() => onAction(`/resolutions/${resolution.id}/activate`, {}, 'Application activée.')}>Activer l’application</BmButton>}
        {runnable && allowed('runtime.effective.manifest.read') && <BmButton disabled={busy} icon={<ArrowUpRight size={15} />} onClick={() => setOpen(o => !o)}>{open ? 'Fermer l’application' : 'Ouvrir l’application'}</BmButton>}
        {context?.status === 'ACTIVE' && allowed('runtime.deactivate') && <BmButton variant="danger" disabled={busy} icon={<Power size={15} />} onClick={() => onDeactivate(resolution, context)}>Désactiver</BmButton>}
        {allowed('runtime.resolution.reresolve') && <BmButton variant="secondary" disabled={busy} icon={<RefreshCw size={15} />} onClick={() => { setOpen(false); onAction(`/resolutions/${resolution.id}/reresolve`, {}, 'Nouvelle résolution enregistrée.'); }}>Relancer la résolution</BmButton>}
      </div></div>
      <RuntimeFacts facts={[
        ['Version de l’application', identity.version], ['Pack publié', `${identity.pack} ${identity.packVersion}`],
        ['Environnement', identity.environment], ['Créée le', formatDate(resolution.startedAt)],
        ['Expire le', formatDate(resolution.result?.expiresAt)], ['Contexte', context ? shortId(context.id) : 'Non activé'],
      ]} />
      <div className="rt-launch-steps" aria-label="Progression de l’exécution">{[['Résolution', executable], ['Activation', context?.status === 'ACTIVE'], ['Readiness', runnable], ['Application', runnable && open]].map(([label, done], i) => <span key={label} className={done ? 'is-complete' : ''}>{done ? <CheckCircle2 size={15} aria-hidden="true" /> : <span className="rt-step-index">{i + 1}</span>}{label}</span>)}</div>
    </RuntimePanel>

    {!executable && <div className="rt-blocked" role="alert"><AlertTriangle size={24} aria-hidden="true" /><div><h2>{mismatch ? 'Version de l’application incompatible' : status === 'EXPIRED' ? 'La résolution a expiré' : 'Exécution bloquée'}</h2><p>{status === 'EXPIRED' ? 'Relancez la résolution pour vérifier à nouveau la version et les exigences du pack.' : 'L’application reste fermée. Corrigez les exigences indiquées avant de relancer la résolution.'}</p><Link className="rt-link" to={`/runtime/diagnostics?resolution=${resolution.id}`}>Consulter les diagnostics</Link></div></div>}

    <RuntimePanel title="Contrôle de l’exécution" subtitle="Les états ci-dessous proviennent de la résolution et du contexte persistés." headerExtra={<ShieldCheck size={17} aria-hidden="true" />}>
      <div className="rt-readiness">{checks.map(([label, value]) => <div key={label}><span>{label}</span><RuntimeStatus value={value} /></div>)}</div>
      {context && <RuntimeFacts facts={[
        ['Activation', formatDate(context.activatedAt)], ['Acteur', context.activatedBy || 'Non renseigné'],
        ['Désactivation', formatDate(context.deactivatedAt)], ['Configuration', context.configurationHash || 'Non renseignée'],
      ]} />}
      {!context && executable && <p className="rt-footnote">La résolution est exécutable. Une activation serveur est encore nécessaire avant d’ouvrir l’application.</p>}
    </RuntimePanel>

    {open && runnable && <RuntimePanel title="Application publiée" subtitle="Le serveur revalide le contexte avant de fournir l’interface effective."><PublishedApplication packCode={effective.source.packCode} packVersion={effective.source.packVersion} tenantId={tenantId} resolutionId={resolution.id} effectiveManifest={effective} /></RuntimePanel>}

    <RuntimePanel title="Inspecter la résolution">
      <BmTabs tabs={tabs} active={tab} onChange={setTab} ariaLabel="Inspection de la résolution" />
      <div className="rt-tab-content" role="tabpanel" aria-label={tabs.find(t => t.id === tab)?.label}>
        {tab === 'summary' && <>
          <div className="rt-stage-list">{(resolution.steps || []).map((step, index) => <div key={step.id || step.code}><span className="rt-step-index">{index + 1}</span><div><strong>{stages[step.code] || step.code}</strong><p className="rt-muted">{formatDate(step.completedAt)}</p></div><RuntimeStatus value={step.status} /></div>)}</div>
          {!(resolution.steps || []).length && <BmEmptyState title="Aucune étape enregistrée" />}
          <RuntimeError error={state.diagnosticError} onRetry={onRetry} />
          {diagnostics.length > 0 && <div className="rt-diagnostics-list">{diagnostics.map((d, i) => <div key={d.id || `${d.code}:${i}`} className="rt-notice rt-notice--danger"><AlertTriangle size={16} aria-hidden="true" /><div><strong>{d.code}</strong><p>{d.message}</p>{d.traceId && <p>Trace : <code>{d.traceId}</code></p>}</div></div>)}</div>}
        </>}
        {tab === 'manifest' && <><RuntimeFacts facts={[
          ['Contrat', effective?.contract], ['Version du contrat', effective?.contractVersion], ['Hash du manifeste source', effective?.source?.manifestHash], ['Hash effectif', resolution.effectiveManifest?.functionalHash],
        ]} /><RuntimeJson value={effective} label="Voir le manifeste effectif complet" /><p className="rt-footnote">Le manifeste effectif est en lecture seule. L’ouverture de l’application passe toujours par le contrôle serveur.</p></>}
        {tab === 'capabilities' && <><BmTable rows={capabilities} keyOf={c => c.code} columns={[{ key: 'code', label: 'Capacité' }, { key: 'state', label: 'État du provider', render: c => c.state ? <RuntimeStatus value={c.state} /> : 'Non fourni' }]} emptyState={<BmEmptyState title="Aucune capacité fournie dans le manifeste" />} /><p className="rt-footnote">Une capacité déclarée ne constitue pas à elle seule une preuve de disponibilité. Les diagnostics serveur restent déterminants.</p></>}
        {tab === 'dependencies' && <BmTable rows={effective?.dependencies || []} keyOf={(d, i) => d.id || `${d.targetRef}:${i}`} columns={[{ key: 'targetRef', label: 'Dépendance', render: d => d.targetRef || d.code || '—' }, { key: 'targetVersionRange', label: 'Version requise' }, { key: 'required', label: 'Obligatoire', render: d => d.required === false ? 'Non' : 'Oui' }, { key: 'state', label: 'Résolution', render: d => d.state || d.status || 'Voir les diagnostics' }]} emptyState={<BmEmptyState title="Aucune dépendance déclarée" />} />}
        {tab === 'configuration' && <><RuntimeJson value={effective?.configuration} label="Configuration effective" /><RuntimeFacts facts={[["Empreinte d’activation", context?.configurationHash], ['Révision métier', effective?.businessConfiguration?.revision]]} /></>}
        {tab === 'bindings' && <div className="rt-binding-sections"><div><h3>Données métier</h3><RuntimeJson value={effective?.businessConfiguration?.dataModel || effective?.data} label="Modèles et bindings" /></div><div><h3>Interface publiée</h3><RuntimeFacts facts={[["Version de l’interface", effective?.ui?.applicationVersionId], ['Pages publiées', effective?.ui?.definition?.pages?.length]]} /></div><div><h3>Intégrations</h3><RuntimeJson value={effective?.integrations} label="Exigences d’intégration" /></div><div><h3>Automation</h3><RuntimeJson value={effective?.automation} label="Exigences Automation" /></div></div>}
        {tab === 'logs' && <><BmTable rows={resolution.steps || []} keyOf={(s, i) => s.id || `${s.code}:${i}`} columns={[{ key: 'code', label: 'Étape' }, { key: 'status', label: 'Statut', render: s => <RuntimeStatus value={s.status} /> }, { key: 'completedAt', label: 'Date', render: s => formatDate(s.completedAt) }, { key: 'details', label: 'Détails', render: s => <RuntimeJson value={s.details} label="Inspecter" /> }]} emptyState={<BmEmptyState title="Aucun journal d’étape" />} /><p className="rt-footnote">Journal des étapes persistées de cette résolution. Aucun flux de logs d’infrastructure n’est exposé par les API actuelles.</p></>}
      </div>
    </RuntimePanel>
  </div>;
}

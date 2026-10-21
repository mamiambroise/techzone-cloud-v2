import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, LockKeyhole } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { BmButton, BmEmptyState } from '../business-manager/bm/ui.jsx';
import { RuntimeError, RuntimePanel, RuntimeResource } from './RuntimePrimitives.jsx';
import { runtimeError } from './useRuntimeData.js';

function readContext(tenantId) {
  try { const value = JSON.parse(sessionStorage.getItem(`runtime-context:${tenantId}`) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
export default function RuntimeLaunch({ tenantId, resources, allowed, busy, onResolve, initialQuery }) {
  const [form, setForm] = useState(() => {
    const saved = readContext(tenantId);
    return { applicationId: initialQuery.get('applicationId') || saved.applicationId || '', businessVersionId: initialQuery.get('businessVersionId') || saved.businessVersionId || '', packCode: initialQuery.get('pack') || saved.packCode || '', packVersion: initialQuery.get('packVersion') || saved.packVersion || '', environment: saved.environment || '' };
  });
  const [versions, setVersions] = useState({ applicationId: '', loading: false, rows: [] });
  const [attempt, setAttempt] = useState(0);
  const canRead = allowed('bm:read');
  useEffect(() => {
    if (!form.applicationId || !canRead) return undefined;
    const controller = new AbortController();
    setVersions({ applicationId: form.applicationId, loading: true, rows: [] });
    api.get(`/business-manager/applications/${encodeURIComponent(form.applicationId)}/versions`, { signal: controller.signal, errorHandling: 'local' }).then(r => {
      if (!controller.signal.aborted) setVersions({ applicationId: form.applicationId, loading: false, rows: Array.isArray(r.data) ? r.data : [] });
    }).catch(error => { if (!controller.signal.aborted) setVersions({ applicationId: form.applicationId, loading: false, rows: [], error: runtimeError(error) }); });
    return () => controller.abort();
  }, [form.applicationId, tenantId, attempt, canRead]);
  const applications = resources.applications?.data || [];
  const packs = resources.packs?.data || [];
  const environments = (resources.environments?.data || []).filter(e => e.status === 'ACTIVE');
  const currentVersions = versions.applicationId === form.applicationId ? versions.rows : [];
  const ready = applications.some(a => a.id === form.applicationId) && currentVersions.some(v => v.id === form.businessVersionId) && environments.some(e => e.code === form.environment) && packs.some(p => p.code === form.packCode && p.versionNumber === form.packVersion);
  function change(values) {
    setForm(previous => {
      const next = { ...previous, ...values };
      try { sessionStorage.setItem(`runtime-context:${tenantId}`, JSON.stringify(next)); } catch { /* Storage is optional. */ }
      return next;
    });
  }
  return <RuntimePanel title="Lancer un pack publié" subtitle="Sélectionnez le contexte, puis vérifiez sa résolution avant l’activation." headerExtra={<LockKeyhole size={17} aria-hidden="true" />}>
    {!allowed('runtime.resolve') ? <BmEmptyState title="Résolution en lecture seule" description="La permission runtime.resolve est nécessaire pour lancer une résolution." /> :
      <RuntimeResource resource={resources.packs} label="Les packs publiés">
        {packs.length === 0 ? <BmEmptyState title="Aucun pack publié accessible" description="Publiez une version validée dans Pack Manager pour démarrer son exécution." action={allowed('pack.read') && <Link className="rt-link" to="/packs/registry">Ouvrir le registre des packs</Link>} /> : <>
          <RuntimeError error={versions.error} onRetry={() => setAttempt(a => a + 1)} />
          {['applications','environments'].filter(k => resources[k]?.status === 'error' || resources[k]?.status === 'forbidden').map(k => <RuntimeResource key={k} resource={resources[k]} label={k === 'applications' ? 'Les applications' : 'Les environnements'} />)}
          <form className="rt-launch-form" onSubmit={e => { e.preventDefault(); if (ready && !busy) onResolve(form); }}>
            <label>Application<select required value={form.applicationId} onChange={e => change({ applicationId: e.target.value, businessVersionId: '' })} disabled={busy || resources.applications?.status !== 'ready'}><option value="">Choisir une application</option>{applications.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label>Version de l’application<select required value={form.businessVersionId} onChange={e => change({ businessVersionId: e.target.value })} disabled={busy || !form.applicationId || versions.loading}><option value="">{versions.loading ? 'Chargement des versions…' : 'Choisir une version'}</option>{currentVersions.map(v => <option key={v.id} value={v.id}>{v.version} · {v.status}</option>)}</select></label>
            <label>Pack et version publiée<select required value={form.packCode && form.packVersion ? `${form.packCode}@${form.packVersion}` : ''} onChange={e => { const p = packs.find(p => `${p.code}@${p.versionNumber}` === e.target.value); change({ packCode: p?.code || '', packVersion: p?.versionNumber || '' }); }} disabled={busy}><option value="">Choisir un pack publié</option>{packs.map(p => <option key={p.id} value={`${p.code}@${p.versionNumber}`}>{p.name} · {p.versionNumber}</option>)}</select></label>
            <label>Environnement<select required value={form.environment} onChange={e => change({ environment: e.target.value })} disabled={busy || resources.environments?.status !== 'ready'}><option value="">Choisir un environnement actif</option>{environments.map(e => <option key={e.id} value={e.code}>{e.name}</option>)}</select></label>
            <div className="rt-launch-footer"><p>La résolution contrôle la version verrouillée et les exigences du pack.</p><BmButton type="submit" disabled={!ready || busy} icon={busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}>{busy ? 'Résolution en cours…' : 'Résoudre le pack'}</BmButton></div>
          </form>
        </>}
      </RuntimeResource>}
  </RuntimePanel>;
}

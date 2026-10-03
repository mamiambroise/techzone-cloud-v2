import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiClient.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import ErpErrorPanel from './ErpErrorPanel.jsx';

const blank = { code: '', nom: '', url: '', entity: 1, apiKey: '', status: 'INACTIVE' };
export default function ErpConnection() {
  const { user } = useAuth();
  const canWrite = user?.permissions?.some(p => p === '*' || p === 'erp:write');
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState(blank);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState(null);
  const [history, setHistory] = useState(null);
  const requests = useRef(new Set());
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const request = async (method, path, data) => {
    const controller = new AbortController(); requests.current.add(controller);
    try { return await api.request({ method, url: path, data, signal: controller.signal, errorHandling: 'local' }); }
    finally { requests.current.delete(controller); }
  };
  const select = (id, list = connections) => {
    const record = list.find(item => item.id === id);
    setSelected(id); setHealth(null); setSaved(false); setUsers(null); setHistory(null); setError(null);
    setForm(record ? { code: record.code, nom: record.nom, url: record.url, entity: record.capabilities?.entity || 1, apiKey: '', status: record.status.toUpperCase() } : blank);
  };
  useEffect(() => {
    mounted.current = true;
    request('get', '/erp-registry').then(response => {
      if (!mounted.current) return;
      setConnections(response.data); select(response.data[0]?.id || '', response.data);
    }).catch(failure => { if (mounted.current) setError(failure); }).finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; requests.current.forEach(controller => controller.abort()); };
  }, []);
  const run = async operation => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null);
    try { await operation(); } catch (failure) { if (mounted.current) setError(failure); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  const save = event => { event.preventDefault(); run(async () => {
    const payload = { nom: form.nom, url: form.url, entity: Number(form.entity), ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}) };
    const response = selected ? await request('put', `/erp-registry/${selected}`, { ...payload, status: form.status }) : await request('post', '/erp-registry', { ...payload, code: form.code, type: 'DOLIBARR' });
    if (!mounted.current) return;
    const list = [...connections.filter(item => item.id !== response.data.id), response.data];
    setConnections(list); select(response.data.id, list); setSaved(true);
  }); };
  const test = () => run(async () => {
    setHealth(null);
    const response = await request('get', `/erp/health/tenant?connectorId=${encodeURIComponent(selected)}`);
    if (mounted.current) setHealth(response.data);
  });
  const field = (name, value) => { setSaved(false); setHealth(null); setForm(previous => ({ ...previous, [name]: value })); };
  const current = connections.find(item => item.id === selected);
  if (loading) return <p role="status">Chargement de la configuration ERP…</p>;
  return <div className="space-y-6 max-w-6xl mx-auto">
    <header><Link className="text-sm text-blue-700" to="/erp">ERP / Dolibarr</Link><h1 className="mt-2 text-2xl font-semibold">Connexion ERP</h1><p className="text-slate-600">Configurer la connexion à votre ERP Dolibarr.</p></header>
    <label className="block text-sm font-medium">Connexion<select disabled={busy} className="mt-1 block w-full rounded-lg border p-2" value={selected} onChange={event => select(event.target.value)}><option value="">Nouvelle connexion</option>{connections.map(item => <option key={item.id} value={item.id}>{item.nom} · {item.status}</option>)}</select></label>
    {error && <ErpErrorPanel errors={[{ resource: 'connection', label: 'Connexion ERP', error }]} onDismiss={() => setError(null)} />}
    {saved && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">Configuration enregistrée. Testez la connexion pour vérifier sa disponibilité.</p>}
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={save} className="rounded-xl border bg-white p-5 space-y-4"><h2 className="font-semibold">Paramètres de connexion</h2>
        <fieldset disabled={!canWrite || busy} className="space-y-4">
          {!selected && <label className="block text-sm">Code<input required maxLength={80} className="mt-1 block w-full rounded-lg border p-2" value={form.code} onChange={event => field('code', event.target.value)} /></label>}
          <label className="block text-sm">Nom<input required maxLength={120} className="mt-1 block w-full rounded-lg border p-2" value={form.nom} onChange={event => field('nom', event.target.value)} /></label>
          <label className="block text-sm">URL Dolibarr<input required type="url" className="mt-1 block w-full rounded-lg border p-2" value={form.url} onChange={event => field('url', event.target.value)} placeholder="https://erp.example.com" /></label>
          <label className="block text-sm">Entité Dolibarr<input type="number" min="1" max="2147483647" required className="mt-1 block w-full rounded-lg border p-2" value={form.entity} onChange={event => field('entity', event.target.value)} /></label>
          <label className="block text-sm">Nouvelle clé API<input type="password" autoComplete="new-password" maxLength={4096} className="mt-1 block w-full rounded-lg border p-2" value={form.apiKey} onChange={event => field('apiKey', event.target.value)} aria-describedby="credential-hint" /></label>
          <p id="credential-hint" className="text-xs text-slate-500">Clé enregistrée : {current?.capabilities?.credentialStatus === 'CONFIGURED' ? 'configurée' : 'manquante'}. Laissez vide pour conserver la clé existante.</p>
          {selected && <label className="block text-sm">Activation<select className="mt-1 block w-full rounded-lg border p-2" value={form.status} onChange={event => field('status', event.target.value)}><option value="INACTIVE">Inactive</option><option value="ACTIVE">Active</option><option value="DISABLED">Désactivée</option></select></label>}
          {!selected && <p className="text-xs text-slate-500">Une nouvelle connexion est créée inactive. Activez-la après enregistrement.</p>}
          <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Traitement…' : 'Enregistrer'}</button>
        </fieldset>{!canWrite && <p className="text-sm text-slate-500">Configuration en lecture seule.</p>}
      </form>
      <section className="rounded-xl border bg-white p-5 space-y-4"><h2 className="font-semibold">Test de connexion et diagnostics</h2><p className="text-sm text-slate-600">Le test utilise la configuration enregistrée et les permissions du tenant actif.</p>
        <button disabled={!selected || busy} onClick={test} className="rounded-lg border border-blue-600 px-4 py-2 text-blue-700 disabled:opacity-50">{busy ? 'Traitement…' : 'Tester la connexion'}</button>
        <dl className="space-y-3 text-sm"><div><dt>Configuration</dt><dd>{selected ? current?.status : 'Non configurée'}</dd></div><div><dt>Authentification</dt><dd>DOLAPIKEY · {current?.capabilities?.credentialStatus === 'CONFIGURED' ? 'clé enregistrée' : 'clé manquante'}</dd></div><div><dt>Disponibilité vérifiée</dt><dd>{health?.status || 'Non testée'}</dd></div>{health && <div><dt>Dernier test</dt><dd>{new Date(health.timestamp).toLocaleString('fr-FR')}</dd></div>}</dl>
        {health?.code && <p className="rounded-lg bg-amber-50 p-3 text-sm">{health.message}<br /><code>{health.code}</code></p>}
        <p className="text-xs text-slate-500">Un test de connexion réussi ne garantit pas l’accès à chaque module. Consultez les ressources pour vérifier leurs permissions.</p>
      </section>
    </div>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Utilisateurs ERP</h2><button disabled={busy} className="mt-3 text-sm text-blue-700 underline" onClick={() => run(async () => { const response = await request('get', '/erp/users'); if (mounted.current) setUsers(response.data); })}>Charger les utilisateurs de la connexion active</button>{users && <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">ID</th><th className="text-left">Login</th></tr></thead><tbody>{users.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.login}</td></tr>)}</tbody></table>{users.length === 0 && <p>Aucun utilisateur reçu.</p>}</div>}</section>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Historique de connexion</h2><button disabled={!selected || busy} className="mt-3 text-sm text-blue-700 underline disabled:opacity-50" onClick={() => run(async () => { const response = await request('get', `/erp-registry/${selected}/history`); if (mounted.current) setHistory(response.data); })}>Actualiser l’historique</button>{history && <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Date</th><th className="text-left">Opération</th><th className="text-left">Résultat</th><th className="text-left">TraceId</th></tr></thead><tbody>{history.map(row => <tr key={row.id} className="border-t"><td className="py-2">{new Date(row.createdAt).toLocaleString('fr-FR')}</td><td>{row.action}</td><td>{row.result}</td><td className="break-all">{row.traceId}</td></tr>)}</tbody></table>{history.length === 0 && <p>Aucun événement enregistré.</p>}<p className="mt-2 text-xs text-slate-500">50 événements les plus récents.</p></div>}</section>
  </div>;
}

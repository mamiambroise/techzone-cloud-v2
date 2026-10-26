import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Save, Settings2 } from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';

const SIGNALS = ['AUDIT', 'SECURITY_EVENTS', 'ALERTS', 'INCIDENTS', 'DIAGNOSTICS', 'LOGS', 'METRICS', 'TRACES'];
const CHANNELS = ['EMAIL', 'IN_APP', 'SMS', 'WHATSAPP', 'WEBHOOK'];

const initialRoute = { name: '', channel: 'EMAIL', severity: '', recipients: '', cooldownSec: '300' };
const initialPolicy = { signalType: 'AUDIT', retentionDays: '365', archive: false, enabled: true };

function messageFor(error, fallback) {
  return error?.normalized?.message || error?.response?.data?.message || fallback;
}

export default function ObservabilitySettingsPage() {
  const [routes, setRoutes] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [routeInput, setRouteInput] = useState(initialRoute);
  const [policyInput, setPolicyInput] = useState(initialPolicy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [routesResponse, policiesResponse] = await Promise.all([
        iamObservabilityService.notificationRoutes(),
        iamObservabilityService.retentionPolicies(),
      ]);
      setRoutes(Array.isArray(routesResponse.data) ? routesResponse.data : []);
      setPolicies(Array.isArray(policiesResponse.data) ? policiesResponse.data : []);
    } catch (requestError) {
      setError(messageFor(requestError, 'Les paramètres d’observabilité sont indisponibles.'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRoute = async (event) => {
    event.preventDefault(); setError(null); setNotice(null);
    const recipients = routeInput.recipients.split(/[;,\n]/).map((value) => value.trim()).filter(Boolean);
    if (!routeInput.name.trim() || !recipients.length) {
      setError('Saisissez un nom et au moins un destinataire.'); return;
    }
    setSaving(true);
    try {
      await iamObservabilityService.createNotificationRoute({
        name: routeInput.name.trim(), channel: routeInput.channel, recipients,
        severity: routeInput.severity || undefined, cooldownSec: Number(routeInput.cooldownSec),
      });
      setRouteInput(initialRoute); setNotice('Canal enregistré. La remise dépend de la configuration réelle du fournisseur.'); await load();
    } catch (requestError) {
      setError(messageFor(requestError, 'Le canal n’a pas pu être enregistré.'));
    } finally { setSaving(false); }
  };

  const savePolicy = async (event) => {
    event.preventDefault(); setError(null); setNotice(null);
    const retentionDays = Number(policyInput.retentionDays);
    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      setError('La durée de conservation doit être comprise entre 1 et 3650 jours.'); return;
    }
    setSaving(true);
    try {
      await iamObservabilityService.upsertRetentionPolicy({ ...policyInput, retentionDays });
      setNotice('Politique de rétention enregistrée. Les exécutions planifiées restent en simulation.'); await load();
    } catch (requestError) {
      setError(messageFor(requestError, 'La politique n’a pas pu être enregistrée.'));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 flex justify-center min-h-[320px]"><ModernSpinner /></div>;

  return <main className="tz-page p-4 sm:p-6 space-y-5">
    <header className="flex items-start justify-between gap-4">
      <div><h1 className="text-xl font-semibold text-slate-900">Paramètres d’observabilité</h1><p className="text-sm text-slate-500 mt-1">Canaux d’alerte et conservation des données de votre périmètre.</p></div>
      <button type="button" aria-label="Actualiser les paramètres" onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
    </header>
    {error && <div role="alert" className="tz-surface p-4 text-red-700">{error}</div>}
    {notice && <div role="status" className="tz-surface p-4 text-green-700">{notice}</div>}
    <section className="grid xl:grid-cols-2 gap-5">
      <div className="tz-surface p-5 space-y-5">
        <div><h2 className="font-semibold text-slate-900">Routage des alertes</h2><p className="text-sm text-slate-500 mt-1">Les tentatives et leurs statuts sont consignés côté serveur. Aucun succès n’est simulé.</p></div>
        <form onSubmit={createRoute} className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm text-slate-700 sm:col-span-2">Nom<input required value={routeInput.name} onChange={(event) => setRouteInput({ ...routeInput, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" maxLength="255" /></label>
          <label className="text-sm text-slate-700">Canal<select value={routeInput.channel} onChange={(event) => setRouteInput({ ...routeInput, channel: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
          <label className="text-sm text-slate-700">Sévérité (facultatif)<select value={routeInput.severity} onChange={(event) => setRouteInput({ ...routeInput, severity: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Toutes</option>{['INFO', 'WARNING', 'ERROR', 'CRITICAL'].map((severity) => <option key={severity}>{severity}</option>)}</select></label>
          <label className="text-sm text-slate-700 sm:col-span-2">Destinataires (séparés par une virgule)<textarea required value={routeInput.recipients} onChange={(event) => setRouteInput({ ...routeInput, recipients: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows="2" maxLength="5000" /></label>
          <label className="text-sm text-slate-700">Silence entre tentatives (secondes)<input required type="number" min="1" max="86400" value={routeInput.cooldownSec} onChange={(event) => setRouteInput({ ...routeInput, cooldownSec: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <div className="flex items-end"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Plus className="w-4 h-4" />Ajouter le canal</button></div>
        </form>
        <div className="space-y-2">{routes.map((route) => <article key={route.id} className="rounded-lg border border-slate-200 p-3 text-sm"><div className="flex justify-between gap-3"><strong className="text-slate-800">{route.name}</strong><span className="text-slate-500">{route.channel}</span></div><p className="mt-1 text-slate-600 break-all">{(route.recipients || []).join(', ')}</p><p className="mt-1 text-xs text-slate-500">{route.severity || 'Toutes sévérités'} · délai {route.cooldownSec}s</p></article>)}{!routes.length && <p className="text-sm text-slate-500">Aucun canal configuré.</p>}</div>
      </div>
      <div className="tz-surface p-5 space-y-5">
        <div><h2 className="font-semibold text-slate-900">Conservation</h2><p className="text-sm text-slate-500 mt-1">Les politiques ne purgent rien depuis cet écran. La purge réelle exige une confirmation d’administration explicite.</p></div>
        <form onSubmit={savePolicy} className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm text-slate-700">Type de signal<select value={policyInput.signalType} onChange={(event) => setPolicyInput({ ...policyInput, signalType: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{SIGNALS.map((signal) => <option key={signal}>{signal}</option>)}</select></label>
          <label className="text-sm text-slate-700">Durée (jours)<input required type="number" min="1" max="3650" value={policyInput.retentionDays} onChange={(event) => setPolicyInput({ ...policyInput, retentionDays: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={policyInput.enabled} onChange={(event) => setPolicyInput({ ...policyInput, enabled: event.target.checked })} />Active</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={policyInput.archive} onChange={(event) => setPolicyInput({ ...policyInput, archive: event.target.checked })} />Archivage demandé</label>
          <div className="sm:col-span-2"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Save className="w-4 h-4" />Enregistrer la politique</button></div>
        </form>
        <div className="space-y-2">{policies.map((policy) => <article key={policy.id} className="rounded-lg border border-slate-200 p-3 text-sm"><div className="flex justify-between gap-3"><strong className="text-slate-800">{policy.signalType}</strong><span className="text-slate-500">{policy.retentionDays} jours</span></div><p className="mt-1 text-xs text-slate-500">{policy.enabled ? 'Active' : 'Inactive'} · {policy.archive ? 'Archivage demandé' : 'Sans archivage'} · {policy.runs?.length ?? 0} exécution(s) récente(s)</p></article>)}{!policies.length && <p className="text-sm text-slate-500">Aucune politique configurée.</p>}</div>
      </div>
    </section>
    <p className="flex items-center gap-2 text-xs text-slate-500"><Settings2 className="w-4 h-4" />Les droits IAM sont vérifiés côté serveur pour chaque lecture et écriture.</p>
  </main>;
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import {
  BmPage, BmBreadcrumb, BmCard, BmEmptyState, BmKpiCard, BmStatusBadge,
  BmTabs, BmButton, BmErrorState, BmLoading, bmSafeError,
} from './bm/ui.jsx';
import { BMResourceEditor } from './BMResourceEditor.jsx';
import BMContractsPanel from './BMContractsPanel.jsx';

const detailTabs = [
  { id: 'summary', label: 'Résumé' },
  { id: 'versions', label: 'Versions' },
  { id: 'metadata', label: 'Métadonnées' },
  { id: 'contracts', label: 'Contrats' },
  { id: 'history', label: 'Historique' },
];

export function BMApplicationDetailRoute() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activityUnavailable, setActivityUnavailable] = useState(false);
  const [latestReport, setLatestReport] = useState(null);
  const [validationUnavailable, setValidationUnavailable] = useState(false);
  const [tab, setTab] = useState('summary');
  const [contractVersionId, setContractVersionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [edit, setEdit] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const path = '/business-manager/applications/' + applicationId;
  useEffect(() => {
    let live = true;
    setApp(null); setVersions([]); setActivity([]); setLatestReport(null);
    setActivityUnavailable(false); setValidationUnavailable(false); setError(''); setNotice('');
    Promise.all([
      api.get(path),
      api.get(`${path}/versions`).catch(() => ({ data: [] })),
      api.get('/business-manager/activity').catch(() => null),
    ])
      .then(async ([application, versionResponse, activityResponse]) => {
        if (!live) return;
        const realVersions = versionResponse.data || [];
        setApp(application.data);
        setVersions(realVersions);
        setActivity(activityResponse?.data || []);
        setActivityUnavailable(!activityResponse);
        const latestVersion = [...realVersions]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
        if (!latestVersion) return;
        setContractVersionId(latestVersion.id);
        try {
          const reports = await api.get(`/business-manager/validation/${latestVersion.id}/reports`);
          if (live) setLatestReport((reports.data || [])[0] || null);
        } catch {
          if (live) setValidationUnavailable(true);
        }
      })
      .catch(() => { if (live) setError(bmSafeError); });
    return () => { live = false; };
  }, [path, revision]);

  // Archive / restauration et duplication passent par les endpoints réels du
  // backend : aucun état local n'est simulé après l'appel.
  async function run(action, successMessage) {
    setBusy(true); setError('');
    try {
      await action();
      setNotice(successMessage);
      setRevision((r) => r + 1);
    } catch { setError(bmSafeError); } finally { setBusy(false); }
  }

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt),
  );
  const selectedContractVersion = versions.find((version) => version.id === contractVersionId);
  const readyVersions = versions.filter((version) => version.status === 'READY').length;
  const relatedActivity = activity.filter((event) =>
    event.applicationId === applicationId
    || event.resourceId === applicationId
    || versions.some((version) => version.id === event.resourceId),
  );

  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'Business Manager', onClick: () => navigate('/business-manager') }, { label: 'Applications', onClick: () => navigate('/business-manager/applications') }, { label: app?.name || '…' }]} />
      <PageHeader
        title={app?.name || 'Application'}
        subtitle={app?.description || undefined}
        action={(
          <>
            <BmButton variant="secondary" disabled={!app} onClick={() => navigate(path + '/versions')}>Versions</BmButton>
            {app?.status === 'ARCHIVED' ? (
              <BmButton disabled={busy} onClick={() => run(() => api.post(`${path}/restore`), 'Application restaurée.')}>Restaurer</BmButton>
            ) : (
              <>
                <BmButton disabled={busy || !app} onClick={() => setDuplicate(true)}>Dupliquer</BmButton>
                <BmButton variant="danger" disabled={busy || !app} onClick={() => {
                  if (window.confirm(`Archiver l’application « ${app.name || app.code} » ?`)) {
                    run(() => api.post(`${path}/archive`), 'Application archivée.');
                  }
                }}>Archiver</BmButton>
              </>
            )}
            <BmButton disabled={busy || !app || app?.status === 'ARCHIVED'} onClick={() => setEdit(true)}>Modifier</BmButton>
          </>
        )}
      />
      {notice && <p role="status" className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error ? (
        <BmErrorState message={error} onRetry={() => setRevision((r) => r + 1)} />
      ) : !app ? (
        <BmLoading />
      ) : (
        <section className="space-y-4">
          <BmTabs tabs={detailTabs} active={tab} onChange={setTab} ariaLabel="Détail de l’application" />

          {tab === 'summary' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <BmKpiCard label="Versions" value={versions.length} hint="données réelles" />
                <BmKpiCard label="Versions READY" value={readyVersions} hint="prêtes selon le backend" tone="green" />
                <BmKpiCard label="Problèmes de validation" value={latestReport?.issues?.length ?? (validationUnavailable ? '—' : 0)} hint={validationUnavailable ? 'Source indisponible' : 'dernier rapport connu'} tone="amber" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <BmCard title="Définition métier" subtitle="Informations propres à cette application">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs font-semibold text-slate-500">Code technique</dt><dd className="mt-1 font-mono font-semibold text-slate-800">{app.code || '—'}</dd></div>
                    <div><dt className="text-xs font-semibold text-slate-500">Statut</dt><dd className="mt-1"><BmStatusBadge value={app.status} /></dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Description</dt><dd className="mt-1 text-slate-700">{app.description || 'Aucune description renseignée.'}</dd></div>
                  </dl>
                </BmCard>
                <BmCard title="Validation de la définition" subtitle="Dernière version connue">
                  {sortedVersions[0] ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-slate-800">Version {sortedVersions[0].version || sortedVersions[0].code}</span><BmStatusBadge value={sortedVersions[0].status} /></div>
                      {latestReport ? <p className="text-slate-600">{latestReport.issues?.length ?? 0} problème(s) dans le dernier rapport de validation.</p> : <p className="text-slate-500">{validationUnavailable ? 'Les rapports de validation sont indisponibles.' : 'Aucun rapport de validation pour cette version.'}</p>}
                      <Link className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800 bm-focus" to={`${path}/versions/${sortedVersions[0].id}/validation`}>Ouvrir la validation</Link>
                    </div>
                  ) : <p className="text-sm text-slate-500">Créez une version pour accéder aux contrôles de validation.</p>}
                </BmCard>
              </div>
            </div>
          )}

          {tab === 'versions' && (
            <BmCard title="Versions" subtitle="Chaque version ouvre son espace de définition métier.">
              {sortedVersions.length ? <ul className="divide-y divide-slate-100">{sortedVersions.map((version) => <li key={version.id} className="flex flex-wrap items-center gap-3 py-3"><span className="min-w-0 flex-1 font-medium text-slate-800">{version.version || version.code || version.id}</span><BmStatusBadge value={version.status} /><Link className="text-sm font-semibold text-blue-700 hover:text-blue-800 bm-focus" to={`${path}/versions/${version.id}/data-model`}>Ouvrir</Link></li>)}</ul> : <BmEmptyState title="Aucune version" description="Créez une version depuis les fonctions existantes de l’application." />}
            </BmCard>
          )}

          {tab === 'metadata' && (
            <BmCard title="Métadonnées" subtitle="Identifiants et dates réellement enregistrés.">
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs font-semibold text-slate-500">Identifiant</dt><dd className="mt-1 break-all font-mono text-slate-800">{app.id}</dd></div>
                <div><dt className="text-xs font-semibold text-slate-500">Code</dt><dd className="mt-1 font-mono text-slate-800">{app.code || '—'}</dd></div>
                <div><dt className="text-xs font-semibold text-slate-500">Créée le</dt><dd className="mt-1 text-slate-800">{app.createdAt ? new Date(app.createdAt).toLocaleString('fr-FR') : '—'}</dd></div>
                <div><dt className="text-xs font-semibold text-slate-500">Modifiée le</dt><dd className="mt-1 text-slate-800">{app.updatedAt ? new Date(app.updatedAt).toLocaleString('fr-FR') : '—'}</dd></div>
              </dl>
            </BmCard>
          )}

          {tab === 'contracts' && (
            <BmCard title="Contrats" subtitle="Les contrats restent rattachés à une version réelle.">
              {versions.length ? <><label className="mb-4 block max-w-sm text-xs font-semibold text-slate-600">Version<select aria-label="Version des contrats" className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 bm-focus focus:border-blue-400" value={contractVersionId} onChange={(event) => setContractVersionId(event.target.value)}>{sortedVersions.map((version) => <option key={version.id} value={version.id}>{version.version || version.code} — {version.status}</option>)}</select></label><BMContractsPanel versionId={contractVersionId} applicationId={applicationId} readOnly={selectedContractVersion?.status === 'PUBLISHED'} /></> : <BmEmptyState title="Aucune version" description="Les contrats deviennent disponibles après la création d’une version." />}
            </BmCard>
          )}

          {tab === 'history' && (
            <BmCard title="Historique" subtitle="Événements réels associés à l’application et à ses versions.">
              {activityUnavailable ? <p className="text-sm text-slate-500">L’historique est actuellement indisponible.</p> : relatedActivity.length ? <ul className="divide-y divide-slate-100">{relatedActivity.slice(0, 20).map((event, index) => <li key={`${event.resourceId || 'event'}-${event.action}-${event.timestamp || index}`} className="flex flex-wrap items-center gap-3 py-3 text-sm"><span className="min-w-0 flex-1 font-medium text-slate-800">{event.resource || 'Ressource'} — {String(event.action || 'MODIFIED').replaceAll('_', ' ')}</span><time className="text-xs text-slate-500" dateTime={event.timestamp}>{event.timestamp ? new Date(event.timestamp).toLocaleString('fr-FR') : '—'}</time></li>)}</ul> : <BmEmptyState title="Aucune activité" description="Aucun événement associé à cette application n’est enregistré." />}
            </BmCard>
          )}
        </section>
      )}
      {duplicate && app && (
        <BMResourceEditor
          fields={[
            { key: 'code', label: 'Code technique de la copie', required: true, default: `${app.code}-copie` },
            { key: 'name', label: 'Nom de la copie', default: `${app.name} (copie)` },
            { key: 'copyDefinition', label: 'Copier la définition métier', type: 'checkbox' },
          ]}
          initial={{ code: `${app.code}-copie`, name: `${app.name} (copie)`, copyDefinition: true }}
          onCancel={() => setDuplicate(false)}
          onSave={async (body) => {
            const created = await api.post(`${path}/duplicate`, body);
            setDuplicate(false);
            navigate(`/business-manager/applications/${created.data.id}`);
          }}
        />
      )}
      {edit && app && (
        <BMResourceEditor
          fields={[{ key: 'name', label: 'Nom', required: true }, { key: 'description', label: 'Description' }]}
          initial={app}
          onCancel={() => setEdit(false)}
          onSave={async (body) => { const r = await api.patch(path, body); setApp(r.data); setEdit(false); }}
        />
      )}
    </BmPage>
  );
}

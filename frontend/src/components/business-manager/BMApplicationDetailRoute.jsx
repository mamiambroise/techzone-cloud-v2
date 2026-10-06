import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import {
  BmPage, BmBreadcrumb, BmBadge, BmStatusBadge, BmButton, BmErrorState, BmLoading, bmSafeError,
} from './bm/ui.jsx';
import { BMResourceEditor } from './BMResourceEditor.jsx';

export function BMApplicationDetailRoute() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [edit, setEdit] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const path = '/business-manager/applications/' + applicationId;
  useEffect(() => {
    let live = true;
    setApp(null); setError(''); setNotice('');
    api.get(path).then((r) => { if (live) setApp(r.data); }).catch(() => { if (live) setError(bmSafeError); });
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

  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'Business Manager', onClick: () => navigate('/business-manager') }, { label: 'Applications', onClick: () => navigate('/business-manager/applications') }, { label: app?.name || '…' }]} />
      <PageHeader
        title={app?.name || 'Application'}
        subtitle={app?.description || undefined}
        action={(
          <>
            <BmButton variant="secondary" onClick={() => navigate(path + '/versions')}>Versions</BmButton>
            {app?.status === 'ARCHIVED' ? (
              <BmButton disabled={busy} onClick={() => run(() => api.post(`${path}/restore`), 'Application restaurée.')}>Restaurer</BmButton>
            ) : (
              <BmButton disabled={busy} onClick={() => setDuplicate(true)}>Dupliquer</BmButton>
            )}
            <BmButton disabled={busy || app?.status === 'ARCHIVED'} onClick={() => setEdit(true)}>Modifier</BmButton>
          </>
        )}
      />
      {notice && <p role="status" className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error ? (
        <BmErrorState message={error} onRetry={() => setRevision((r) => r + 1)} />
      ) : !app ? (
        <BmLoading />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Code technique</dt>
              <dd className="mt-0.5 font-mono font-semibold text-slate-800">{app.code}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Statut</dt>
              <dd className="mt-0.5"><BmStatusBadge value={app.status} /></dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Créée le</dt>
              <dd className="mt-0.5 text-slate-700">{app.createdAt ? new Date(app.createdAt).toLocaleDateString('fr-FR') : '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Modifiée le</dt>
              <dd className="mt-0.5 text-slate-700">{app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('fr-FR') : '—'}</dd>
            </div>
          </dl>
        </div>
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

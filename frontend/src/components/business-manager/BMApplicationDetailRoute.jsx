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
  const [edit, setEdit] = useState(false);
  const [revision, setRevision] = useState(0);
  const path = '/business-manager/applications/' + applicationId;
  useEffect(() => {
    let live = true;
    setApp(null); setError('');
    api.get(path).then((r) => { if (live) setApp(r.data); }).catch(() => { if (live) setError(bmSafeError); });
    return () => { live = false; };
  }, [path, revision]);

  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'Business Manager', onClick: () => navigate('/business-manager') }, { label: 'Applications', onClick: () => navigate('/business-manager/applications') }, { label: app?.name || '…' }]} />
      <PageHeader
        title={app?.name || 'Application'}
        subtitle={app?.description || undefined}
        action={(
          <>
            <BmButton variant="secondary" onClick={() => navigate(path + '/versions')}>Versions</BmButton>
            <BmButton disabled={app?.status === 'ARCHIVED'} onClick={() => setEdit(true)}>Modifier</BmButton>
          </>
        )}
      />
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

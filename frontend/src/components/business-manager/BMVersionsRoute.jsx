import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import {
  BmPage, BmBreadcrumb, BmTable, BmStatusBadge, BmButton, BmBadge,
  BmEmptyState, BmErrorState, BmLoading, bmSafeError,
} from './bm/ui.jsx';
import { BMResourceEditor } from './BMResourceEditor.jsx';

export function BMVersionsRoute() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [revision, setRevision] = useState(0);
  const path = applicationId ? '/business-manager/applications/' + applicationId + '/versions' : '/business-manager/versions';

  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    api.get(path).then((r) => { if (live) setVersions(r.data); }).catch(() => { if (live) setError(bmSafeError); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [path, revision]);

  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'Business Manager', onClick: () => navigate('/business-manager') }, { label: 'Applications', onClick: () => navigate('/business-manager/applications') }, { label: 'Versions' }]} />
      <PageHeader
        title="Versions"
        subtitle="Versions réelles de vos applications."
        action={applicationId ? <BmButton icon={<Plus className="h-4 w-4" />} onClick={() => setEditor({})}>Nouvelle version</BmButton> : undefined}
      />
      {error ? (
        <BmErrorState message={error} onRetry={() => setRevision((r) => r + 1)} />
      ) : loading ? (
        <BmLoading />
      ) : (
        <BmTable
          columns={[
            { key: 'version', label: 'Version', render: (row) => <span className="font-semibold text-slate-800">{row.version}</span> },
            { key: 'status', label: 'Statut', render: (row) => <BmStatusBadge value={row.status} /> },
            { key: 'releaseNotes', label: 'Notes', render: (row) => <span className="line-clamp-1 max-w-[280px] text-slate-500">{row.releaseNotes || '—'}</span> },
            { key: 'publishedAt', label: 'Publiée le', render: (row) => (row.publishedAt ? new Date(row.publishedAt).toLocaleDateString('fr-FR') : <BmBadge tone="neutral">Non publiée</BmBadge>) },
            { key: 'actions', label: 'Actions', className: 'text-right', render: (row) => (
              <button
                onClick={() => navigate('/business-manager/applications/' + (row.applicationId || applicationId) + '/versions/' + row.id + '/data-model')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors duration-150 hover:bg-blue-100 bm-focus"
              >
                Ouvrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) },
          ]}
          rows={versions}
          keyOf={(row) => row.id}
          emptyState={(
            <BmEmptyState
              title="Aucune version"
              description={applicationId ? 'Créez la première version de cette application pour commencer.' : 'Sélectionnez une application pour voir ses versions.'}
            />
          )}
        />
      )}
      {editor && (
        <BMResourceEditor
          fields={[...(!editor.id ? [{ key: 'version', label: 'Version', required: true }] : []), { key: 'releaseNotes', label: 'Notes de version' }]}
          initial={editor}
          onCancel={() => setEditor(null)}
          onSave={async (body) => {
            await (editor.id ? api.patch('/business-manager/versions/' + editor.id, body) : api.post(path, body));
            setEditor(null); setRevision((r) => r + 1);
          }}
        />
      )}
    </BmPage>
  );
}

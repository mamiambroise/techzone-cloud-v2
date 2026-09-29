import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader.jsx';
import { ApplicationCard } from './ApplicationCard.jsx';
import { getApplications } from '../../services/api/platformApplicationsService.js';

export function BMApplicationsRoute() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setLoading(true); setError(false);
    getApplications()
      .then(setApplications)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [revision]);

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Applications du Business Manager"
        action={{ label: 'Nouvelle application', onClick: () => navigate('/business-manager/applications/new') }}
      />
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : error ? <p role="alert" className="p-6">Impossible de charger les applications. <button onClick={()=>setRevision(r=>r+1)}>Réessayer</button></p> : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune application. Créez votre première application pour commencer.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
          {applications.map(app => (
            <ApplicationCard key={app.id} app={app} onClick={() => navigate(`/business-manager/applications/${app.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}

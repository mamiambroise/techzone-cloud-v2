import { useState, useEffect } from 'react';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Card } from '../ui/Card.jsx';
import { getApplications } from '../../services/api/platformApplicationsService.js';
import { getEnvironments } from '../../services/api/platformEnvironmentsService.js';

export default function BMOverview() {
  const [appCount, setAppCount] = useState(null);
  const [envCount, setEnvCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [apps, envs] = await Promise.allSettled([getApplications(), getEnvironments()]);
        if (apps.status === 'fulfilled') setAppCount((apps.value || []).length);
        if (envs.status === 'fulfilled') setEnvCount((envs.value || []).length);
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
  }, []);

  return (
    <>
      <PageHeader
        title="Business Manager"
        subtitle="Vue d'ensemble du Business Manager"
      />
      <div className="p-6"><a href="/business-manager/applications" className="text-blue-700 underline">Gérer les applications</a></div>
      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Applications" description="Gérer les applications métier">
          <div className="text-3xl font-bold">{loading ? '...' : appCount ?? 'Indisponible'}</div>
        </Card>
        <Card title="Environnements" description="Déploiements et environnements">
          <div className="text-3xl font-bold">{loading ? '...' : envCount ?? 'Indisponible'}</div>
        </Card>
        <Card title="Contrats" description="Registre des contrats applicatifs">
          <p>Consultez les contrats dans le contexte de la version.</p>
        </Card>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader.jsx';
import { BMApplicationForm } from './BMApplicationForm.jsx';
import { createApplication } from '../../services/api/platformApplicationsService.js';

export function BMApplicationNewRoute() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error,setError] = useState('');

  const handleSubmit = async (data) => {
    setSubmitting(true); setError('');
    try {
      await createApplication(data);
      navigate('/business-manager/applications');
    } catch (err) {
      setError('Création impossible. Vérifiez le code, le nom et la disponibilité du service, puis réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Nouvelle application"
        subtitle="Créer une nouvelle application métier"
      />
      <div className="p-6">
        {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
        <BMApplicationForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/business-manager/applications')}
          submitting={submitting}
        />
      </div>
    </>
  );
}

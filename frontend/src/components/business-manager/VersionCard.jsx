import { Card } from '../ui/Card.jsx';

export function VersionCard({ version, onClick }) {
  return (
    <Card
      title={version.version || version.code}
      description={version.description || ''}
      footer={`Statut: ${version.status || 'brouillon'}`}
      onClick={onClick}
    />
  );
}

import { Card } from '../ui/Card.jsx';

export function ApplicationCard({ app, onClick }) {
  return (
    <Card
      title={app.name || app.code}
      description={app.description || ''}
      onClick={onClick}
      action={{ label: 'Ouvrir', onClick }}
    />
  );
}

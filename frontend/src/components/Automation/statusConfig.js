// Table unique des statuts. Cycle de vie aligné sur le CDC :
// DRAFT → CONFIGURING → VALIDATION → READY → PUBLISHED → ACTIVE (+ INACTIVE, ARCHIVED).
// PAUSED est conservé car le backend actuel l'utilise.
export const STATUS = {
  DRAFT: { label: 'Brouillon', tone: 'amber' },
  CONFIGURING: { label: 'Configuration', tone: 'amber' },
  VALIDATION: { label: 'Validation', tone: 'blue' },
  READY: { label: 'Prêt', tone: 'blue' },
  PUBLISHED: { label: 'Publié', tone: 'violet' },
  ACTIVE: { label: 'Actif', tone: 'green' },
  INACTIVE: { label: 'Inactif', tone: 'red' },
  PAUSED: { label: 'En pause', tone: 'amber' },
  ARCHIVED: { label: 'Archivé', tone: 'slate' },
  ENABLED: { label: 'Activé', tone: 'green' },
  DISABLED: { label: 'Désactivé', tone: 'slate' },
  PENDING: { label: 'En attente', tone: 'slate' },
  RUNNING: { label: 'En cours', tone: 'blue' },
  SUCCEEDED: { label: 'Réussi', tone: 'green' },
  FAILED: { label: 'Échoué', tone: 'red' },
  TIMEOUT: { label: 'Timeout', tone: 'amber' },
};

export const TRIGGER_TYPES = {
  EVENT: { label: 'Événement', tone: 'violet' },
  DATA_CHANGE: { label: 'Données', tone: 'blue' },
  MANUAL: { label: 'Manuel', tone: 'green' },
  SCHEDULE: { label: 'Planifié', tone: 'amber' },
};

const UNKNOWN = { label: '—', tone: 'slate' };

export function getStatusMeta(value, catalog = STATUS) {
  if (value === null || value === undefined || String(value).trim() === '') return UNKNOWN;
  const key = String(value).trim().toUpperCase();
  if (catalog[key]) return catalog[key];
  if (catalog === STATUS) {
    if (key === 'SUCCESS' || key === 'COMPLETED') return STATUS.SUCCEEDED;
    if (key.includes('FAIL') || key === 'ERROR') return STATUS.FAILED;
    if (key.includes('TIME')) return STATUS.TIMEOUT;
    if (key.includes('RUN') || key === 'IN_PROGRESS') return STATUS.RUNNING;
  }
  return { label: String(value), tone: 'slate' };
}

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Clock3, Search, ShieldAlert } from 'lucide-react';
import { BmButton, BmCard, BmEmptyState, BmLoading, BmTable } from '../business-manager/bm/ui.jsx';
import { publicRuntimeJson } from './runtimeModel.js';

const labels = { ACTIVE: 'Actif', INACTIVE: 'Inactif', EXECUTABLE: 'Exécutable', BLOCKED: 'Bloqué', ERROR: 'Erreur', EXPIRED: 'Expiré', RESOLVING: 'En résolution', PENDING: 'En attente', READY: 'Prêt', NOT_READY: 'Non prêt', DEGRADED: 'Dégradé', UP: 'Disponible', DOWN: 'Indisponible', FRESH: 'Valide', COMPLETED: 'Terminé', VALID: 'Valide', UNKNOWN: 'Non renseigné', WARNING: 'Avertissement', INFO: 'Information' };
export function RuntimeStatus({ value = 'UNKNOWN' }) {
  const positive = ['ACTIVE','EXECUTABLE','READY','UP','FRESH','COMPLETED','VALID'].includes(value);
  const negative = ['BLOCKED','ERROR','DOWN','FAILED'].includes(value);
  const pending = ['EXPIRED','DEGRADED','WARNING','NOT_READY','RESOLVING','PENDING','ACTIVATING'].includes(value);
  const Icon = positive ? CheckCircle2 : negative ? ShieldAlert : pending ? Clock3 : Circle;
  return <span className={`rt-status rt-status--${positive ? 'success' : negative ? 'danger' : pending ? 'warning' : 'neutral'}`}><Icon size={13} aria-hidden="true" />{labels[value] || value}</span>;
}
export function RuntimeError({ error, onRetry }) {
  if (!error) return null;
  return <div role="alert" className="rt-notice rt-notice--danger"><AlertTriangle size={18} aria-hidden="true" /><div><strong>{error.status === 403 ? 'Accès refusé' : error.status === 401 ? 'Session expirée' : 'Opération indisponible'}</strong><p>{error.message}</p>{error.code && <code>{error.code}</code>}{error.traceId && <p className="rt-muted">Trace : <code>{error.traceId}</code></p>}{onRetry && error.status !== 401 && error.status !== 403 && <BmButton variant="secondary" size="sm" onClick={onRetry}>Réessayer</BmButton>}</div></div>;
}
export function RuntimeResource({ resource, children, onRetry, label = 'Ces informations' }) {
  if (!resource || resource.status === 'loading') return <BmLoading label="Chargement du Runtime…" />;
  if (resource.status === 'forbidden') return <BmEmptyState icon={ShieldAlert} title="Consultation non autorisée" description={`${label} nécessitent une permission supplémentaire.`} />;
  if (resource.status === 'error') return <RuntimeError error={resource.error} onRetry={onRetry} />;
  return children;
}
export function RuntimePanel(props) { return <BmCard {...props} className={`rt-panel ${props.className || ''}`} />; }
export function RuntimeJson({ value, label = 'Contrat JSON' }) {
  return value == null ? <p className="rt-muted">Information non fournie par le serveur.</p> : <details className="rt-json"><summary>{label}</summary><pre tabIndex={0}>{publicRuntimeJson(value)}</pre></details>;
}
export function RuntimeFacts({ facts }) {
  return <dl className="rt-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}
export function RuntimeCollection({ rows, columns, searchText, statuses = [], statusOf = row => row.status, emptyTitle, emptyDescription, label = 'Rechercher', footer }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const filtered = rows.filter(row => (!status || statusOf(row) === status) && (!query || String(searchText(row)).toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))));
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  return <div className="rt-collection">
    <div className="rt-toolbar"><label className="rt-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label={label} placeholder={label} value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label>{statuses.length > 0 && <label className="rt-filter">Statut<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tous les statuts</option>{statuses.map(s => <option value={s} key={s}>{labels[s] || s}</option>)}</select></label>}<span className="rt-muted">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span></div>
    <div className="rt-table" role="region" aria-label={label.replace('Rechercher', 'Tableau')} tabIndex={0}><BmTable columns={columns} rows={filtered.slice((current - 1) * 10, current * 10)} emptyState={<BmEmptyState title={query || status ? 'Aucun résultat pour ces filtres' : emptyTitle} description={emptyDescription} action={(query || status) && <BmButton variant="secondary" onClick={() => { setQuery(''); setStatus(''); }}>Effacer les filtres</BmButton>} />} /></div>
    {filtered.length > 10 && <nav aria-label="Pagination" className="rt-pagination"><BmButton variant="secondary" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Précédent</BmButton><span>Page {current} sur {Math.ceil(filtered.length / 10)}</span><BmButton variant="secondary" size="sm" disabled={current * 10 >= filtered.length} onClick={() => setPage(current + 1)}>Suivant</BmButton></nav>}
    {footer && <p className="rt-footnote">{footer}</p>}
  </div>;
}

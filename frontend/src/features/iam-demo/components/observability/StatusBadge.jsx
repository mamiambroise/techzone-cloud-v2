export function StatusBadge({ status }) {
  const cls = `obs-status-badge obs-status-${String(status).toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

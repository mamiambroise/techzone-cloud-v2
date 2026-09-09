export function SeverityBadge({ severity }) {
  const cls = `obs-severity-badge obs-severity-${String(severity).toLowerCase()}`;
  return <span className={cls}>{severity}</span>;
}

export function KpiCard({ label, value, context, icon, color, onClick, href }) {
  const content = (
    <div className="obs-kpi-card" onClick={onClick} role={onClick || href ? 'button' : undefined} tabIndex={onClick || href ? 0 : undefined}>
      <div className="obs-kpi-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="obs-kpi-content">
        <span className="obs-kpi-value">{value}</span>
        <span className="obs-kpi-label">{label}</span>
        {context && <span className="obs-kpi-context">{context}</span>}
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="obs-kpi-link">{content}</a>;
  }
  return content;
}

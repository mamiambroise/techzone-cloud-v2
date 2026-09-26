export function Timeline({ items, renderItem }) {
  return (
    <ol className="obs-timeline">
      {items.map((item, idx) => (
        <li key={item.id || idx} className="obs-timeline-item">
          <span className="obs-timeline-dot" />
          <div className="obs-timeline-body">
            {renderItem ? renderItem(item, idx) : <span className="obs-timeline-text">{item.message || item.title || item.action || JSON.stringify(item)}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

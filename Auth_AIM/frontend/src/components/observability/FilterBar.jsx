export function FilterBar({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="obs-filter-bar">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          className={`obs-filter-btn ${activeFilter === filter.key ? 'obs-filter-btn-active' : ''}`}
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label}
          {filter.count !== undefined && <span className="obs-filter-count">{filter.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function DataTable({ columns, rows, rowKey, onRowClick, emptyMessage = 'Aucune donnée' }) {
  if (!rows.length) {
    return <div className="obs-table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="obs-table-wrapper">
      <table className="obs-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align ? `obs-table-${col.align}` : ''} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={rowKey ? row[rowKey] : idx} className={onRowClick ? 'obs-table-row-clickable' : ''} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className={col.align ? `obs-table-${col.align}` : ''}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import './LineChart.css';

function LineChart({ data = [], width = 600, height = 180, stats = [] }) {
  const padding = { top: 10, right: 10, bottom: 25, left: 10 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const max = Math.max(...data, 1);
  const min = 0;
  const points = data.map((val, idx) => ({
    x: padding.left + (idx / (data.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((val - min) / (max - min)) * innerHeight,
    val,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  return (
    <div className="line-chart-wrapper">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="line-chart-svg">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGradient)" />
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
        ))}
        <g className="line-chart-axis">
          {hours.filter((_, i) => i % 4 === 0).map((label, i) => {
            const idx = i * 4;
            const x = padding.left + (idx / (data.length - 1)) * innerWidth;
            return (
              <text key={label} x={x} y={height - 5} textAnchor="middle" className="line-chart-tick">
                {label}
              </text>
            );
          })}
        </g>
      </svg>
      {stats.length > 0 && (
        <div className="line-chart-stats">
          {stats.map((stat, index) => (
            <div key={index} className="line-chart-stat">
              <span className="line-chart-stat-value">{stat.value}</span>
              <span className="line-chart-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LineChart;
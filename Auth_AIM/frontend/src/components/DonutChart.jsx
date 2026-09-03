import './DonutChart.css';

function DonutChart({ data, size = 180 }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const segments = data.map((item) => {
    const segmentLength = (item.value / total) * circumference;
    const offset = currentOffset;
    currentOffset += segmentLength;
    return {
      ...item,
      segmentLength,
      offset,
    };
  });

  return (
    <div className="donut-chart-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-chart-svg">
        {segments.map((seg, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${seg.segmentLength} ${circumference - seg.segmentLength}`}
            strokeDashoffset={-seg.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="donut-chart-center">
          {total}
        </text>
        <text x="50%" y="50%" dy="1.2em" dominantBaseline="central" textAnchor="middle" className="donut-chart-center-label">
          Total
        </text>
      </svg>
      <div className="donut-chart-legend">
        {data.map((item, index) => (
          <div key={index} className="donut-chart-legend-item">
            <span className="donut-chart-dot" style={{ backgroundColor: item.color }} />
            <span className="donut-chart-name">{item.name}</span>
            <span className="donut-chart-value">{item.value} <span className="donut-chart-percent">({Math.round((item.value / total) * 100)}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DonutChart;
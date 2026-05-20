// src/components/RangeSelector.jsx
const RANGES = [
  { label: '2W', days: 10 },
  { label: '1M', days: 22 },
  { label: '2M', days: 44 },
  { label: '3M', days: 66 },
  { label: 'ALL', days: 0 },
];

export default function RangeSelector({ active, onChange, onRefresh, lastUpdated }) {
  return (
    <div className="range-bar">
      {RANGES.map(r => (
        <button
          key={r.label}
          className={`range-btn ${active === r.days ? 'active' : ''}`}
          onClick={() => onChange(r.days)}
        >
          {r.label}
        </button>
      ))}
      <div className="range-divider" />
      {lastUpdated && (
        <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'JetBrains Mono', marginRight: 8 }}>
          Last load: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
      <button className="refresh-btn" onClick={onRefresh}>↻ Force Refresh</button>
    </div>
  );
}

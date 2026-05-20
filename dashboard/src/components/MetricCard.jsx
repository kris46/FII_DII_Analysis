// src/components/MetricCard.jsx
import { fmt } from '../utils/metrics.js';

export default function MetricCard({
  label, value, sub, delta, deltaLabel,
  accent = '#00e699', isRatio = false,
}) {
  const displayed = isRatio
    ? (typeof value === 'number' ? value.toFixed(2) : '—')
    : fmt(value);

  const deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const deltaSign  = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';

  return (
    <div className="card metric-card">
      <div className="card-accent" style={{ background: accent }} />
      <div className="metric-label">{label}</div>
      <div className="metric-value mono" style={{ color: accent }}>{displayed}</div>
      {sub && <div className="metric-sub">{sub}</div>}
      {delta !== undefined && delta !== 0 && (
        <div className={`metric-delta ${deltaClass}`}>
          {deltaSign} {isRatio ? Math.abs(delta).toFixed(3) : fmt(Math.abs(delta))}
          &nbsp;{deltaLabel ?? 'vs prev week'}
        </div>
      )}
    </div>
  );
}

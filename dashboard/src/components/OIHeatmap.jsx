// src/components/OIHeatmap.jsx
import { HEATMAP_METRICS } from '../utils/metrics.js';

function cellClass(val) {
  if (val >=  12) return 'cell-pos-3';
  if (val >=   5) return 'cell-pos-2';
  if (val >=   1) return 'cell-pos-1';
  if (val <= -12) return 'cell-neg-3';
  if (val <=  -5) return 'cell-neg-2';
  if (val <=  -1) return 'cell-neg-1';
  return 'cell-zero';
}

function fmt(v) {
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
}

export default function OIHeatmap({ rows }) {
  if (!rows?.length) {
    return (
      <p style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
        Need at least 10 trading days of data for the heatmap.
      </p>
    );
  }
  return (
    <div className="heatmap-wrap">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th>Week ending</th>
            {HEATMAP_METRICS.map(c => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.week}</td>
              {HEATMAP_METRICS.map(c => (
                <td key={c.key} className={cellClass(row[c.key])}>
                  {fmt(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

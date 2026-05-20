// src/components/OIMomentumChart.jsx
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function addDelta(data) {
  return data.map((d, i) => ({
    ...d,
    oi_chg: i > 0 ? d.total_oi - data[i - 1].total_oi : 0,
  }));
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map(p => (
        <div className="tooltip-row" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: p.color }}>
            {p.value >= 0 ? '+' : ''}{(p.value / 1000).toFixed(1)}K
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OIMomentumChart({ data }) {
  const enriched = addDelta(data);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={enriched} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#0e2040" strokeDasharray="3 3" />
        <XAxis dataKey="disp" tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis yAxisId="bar" tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={54} />
        <YAxis yAxisId="line" orientation="right" tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'}
          tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={54} />
        <Tooltip content={<Tip />} />
        <Bar yAxisId="bar" dataKey="oi_chg" name="Daily OI Δ" maxBarSize={6}>
          {enriched.map((d, i) => (
            <Cell key={i} fill={d.oi_chg >= 0 ? '#00e699' : '#ff3d5e'} fillOpacity={0.7} />
          ))}
        </Bar>
        <Line yAxisId="line" type="monotone" dataKey="total_oi" name="Total OI"
          stroke="#00c8ff" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

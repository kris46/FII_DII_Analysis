// src/components/FIIOptionsChart.jsx
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

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

export default function FIIOptionsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#0e2040" strokeDasharray="3 3" />
        <XAxis dataKey="disp" tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={54} />
        <Tooltip content={<Tip />} />
        <ReferenceLine y={0} stroke="#2152a0" />
        <Bar dataKey="fii_call_l" name="FII Call Long" fill="#00e699" fillOpacity={0.55} maxBarSize={5} />
        <Bar dataKey="fii_put_l"  name="FII Put Long"  fill="#ff3d5e" fillOpacity={0.55} maxBarSize={5} />
        <Line type="monotone" dataKey="fii_opt_net" name="Net C−P"
          stroke="#ffb300" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

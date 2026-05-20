// src/components/DivergenceChart.jsx
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map(p => (
        <div className="tooltip-row" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: p.color }}>{(p.value / 1000).toFixed(1)}K</span>
        </div>
      ))}
    </div>
  );
}

export default function DivergenceChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#0e2040" strokeDasharray="3 3" />
        <XAxis dataKey="disp" tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis yAxisId="bar" tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={54} />
        <YAxis yAxisId="line" orientation="right" tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={54} />
        <Tooltip content={<Tip />} />
        <ReferenceLine yAxisId="bar" y={0} stroke="#2152a0" />
        <Bar yAxisId="bar" dataKey="fii_dii_div" name="FII−DII Gap" maxBarSize={6}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fii_dii_div >= 0 ? '#00e699' : '#ff3d5e'} fillOpacity={0.75} />
          ))}
        </Bar>
        <Line yAxisId="line" type="monotone" dataKey="fii_net_idx" name="FII Net Idx"
          stroke="#00e699" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="line" type="monotone" dataKey="dii_net_idx" name="DII Net Idx"
          stroke="#00c8ff" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

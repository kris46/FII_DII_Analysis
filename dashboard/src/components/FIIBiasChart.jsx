// src/components/FIIBiasChart.jsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
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

export default function FIIBiasChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gFIIg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00e699" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00e699" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gFIIc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00c8ff" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#0e2040" strokeDasharray="3 3" />
        <XAxis dataKey="disp" tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={54} />
        <Tooltip content={<Tip />} />
        <ReferenceLine y={0} stroke="#2152a0" strokeDasharray="4 3" />
        <Area type="monotone" dataKey="fii_net_idx" name="FII Net Index Fut"
          stroke="#00e699" fill="url(#gFIIg)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="fii_net_stk" name="FII Net Stock Fut"
          stroke="#00c8ff" fill="url(#gFIIc)" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

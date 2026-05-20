// src/components/LSRatioChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
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
          <span style={{ color: p.color }}>{Number(p.value).toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}

export default function LSRatioChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#0e2040" strokeDasharray="3 3" />
        <XAxis dataKey="disp" tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={46} tickFormatter={v => v.toFixed(2)} />
        <Tooltip content={<Tip />} />
        <ReferenceLine y={1} stroke="#2152a0" strokeDasharray="3 3" label={{ value: '1.0', fill: '#2152a0', fontSize: 9 }} />
        <Line type="monotone" dataKey="fii_ls" name="FII"    stroke="#00e699" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="dii_ls" name="DII"    stroke="#00c8ff" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="cl_ls"  name="Client" stroke="#ffb300" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="pr_ls"  name="Pro"    stroke="#b87dff" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

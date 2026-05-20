// src/components/PCRChart.jsx
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts';

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map(p => (
        <div className="tooltip-row" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: p.color }}>{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function PCRChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#0e2040" strokeDasharray="3 3" />
        <ReferenceArea y1={1.2} y2={3}   fill="rgba(255,61,94,0.07)" />
        <ReferenceArea y1={0}   y2={0.7} fill="rgba(255,179,0,0.07)" />
        <XAxis dataKey="disp" tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis domain={[0, 'auto']} tick={{ fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={40} />
        <Tooltip content={<Tip />} />
        <ReferenceLine y={1.2} stroke="#ff3d5e" strokeDasharray="4 3"
          label={{ value: 'Fear 1.2', fill: '#ff3d5e', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
        <ReferenceLine y={0.7} stroke="#ffb300" strokeDasharray="4 3"
          label={{ value: 'Greed 0.7', fill: '#ffb300', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
        <Line type="monotone" dataKey="pcr_idx" name="Index PCR"
          stroke="#b87dff" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="pcr_stk" name="Stock PCR"
          stroke="#00c8ff" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="fii_pcr" name="FII PCR"
          stroke="#ffb300" strokeWidth={1.5} strokeDasharray="2 3" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

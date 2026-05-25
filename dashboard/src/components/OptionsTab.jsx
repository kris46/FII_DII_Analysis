// src/components/OptionsTab.jsx
// ─────────────────────────────────────────────────────────────────────────────
// OPTIONS INTELLIGENCE TAB
// Unlocks: dii_pcr, cl_pcr, dii_call_l, dii_put_l, dii_hedge
// (fii_pcr / fii_call_l / fii_put_l / fii_opt_net are in Overview already
//  but are brought here too for the full participant comparison)
// ─────────────────────────────────────────────────────────────────────────────
import {
  ComposedChart, AreaChart, Area, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Cell,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import { fmt } from '../utils/metrics.js';

// ─── Shared tooltip ───────────────────────────────────────────────────────────
function Tip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map(p => (
        <div className="tooltip-row" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: p.color }}>
            {formatter ? formatter(p.value) : Number(p.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

const TICK = { fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' };
const GRID = { stroke: '#0e2040', strokeDasharray: '3 3' };

// ─── 1. Participant PCR comparison ───────────────────────────────────────────
// Three lines: FII PCR (purple), Client PCR (amber), Index PCR (cyan)
// DII PCR omitted here — it is so extreme (0–222×) it lives on its own chart.
function ParticipantPCRChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <ReferenceArea y1={1.2} y2={4}   fill="rgba(255,61,94,0.06)"  />
        <ReferenceArea y1={0}   y2={0.7} fill="rgba(255,179,0,0.06)"  />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis domain={[0, 'auto']} tick={TICK} width={40} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(2)} />} />
        <ReferenceLine y={1.2} stroke="#ff3d5e" strokeDasharray="4 3"
          label={{ value: 'Fear 1.2', fill: '#ff3d5e', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <ReferenceLine y={0.7} stroke="#ffb300" strokeDasharray="4 3"
          label={{ value: 'Greed 0.7', fill: '#ffb300', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideBottomLeft' }} />
        <Line type="monotone" dataKey="fii_pcr"  name="FII PCR"    stroke="#b87dff" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="cl_pcr"   name="Client PCR" stroke="#ffb300" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="pcr_idx"  name="Index PCR"  stroke="#00c8ff" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 2. DII PCR — separate chart because scale is 0–222× ─────────────────────
// Uses area fill so the spikes are visually striking.
function DIIPCRChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis domain={[0, 'auto']} tick={TICK} width={44}
          tickFormatter={v => v >= 100 ? v.toFixed(0) : v.toFixed(1)} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(2) + '×'} />} />
        <ReferenceLine y={10}  stroke="#ff3d5e" strokeDasharray="3 4"
          label={{ value: 'Heavy hedge 10×', fill: '#ff3d5e', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <ReferenceLine y={5}   stroke="#ffb300" strokeDasharray="3 4"
          label={{ value: 'Elevated 5×', fill: '#ffb300', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <Area type="monotone" dataKey="dii_pcr" name="DII PCR"
          stroke="#00c8ff" strokeWidth={1.5}
          fill="rgba(0,200,255,0.08)" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 3. DII call vs put positioning ──────────────────────────────────────────
// Bars for dii_call_l (green) and dii_put_l (red) + dii_pcr line on right axis
function DIIOptionsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="bar" tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={TICK} width={54} />
        <YAxis yAxisId="line" orientation="right"
          tickFormatter={v => v.toFixed(1) + '×'} tick={TICK} width={44} />
        <Tooltip content={
          <Tip formatter={(v, name) =>
            name === 'DII PCR×' ? Number(v).toFixed(2) + '×' : (v / 1000).toFixed(1) + 'K'
          } />
        } />
        <Bar yAxisId="bar" dataKey="dii_call_l" name="DII Call Long" fill="#00e699" fillOpacity={0.55} maxBarSize={5} />
        <Bar yAxisId="bar" dataKey="dii_put_l"  name="DII Put Long"  fill="#ff3d5e" fillOpacity={0.55} maxBarSize={5} />
        <Line yAxisId="line" type="monotone" dataKey="dii_pcr" name="DII PCR×"
          stroke="#ffb300" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 4. DII hedge ratio over time ─────────────────────────────────────────────
// dii_hedge = ratio of DII index put longs to call longs.
// Spikes here are a fear signal independent of PCR.
function DIIHedgeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis domain={[0, 'auto']} tick={TICK} width={44}
          tickFormatter={v => v.toFixed(0) + '×'} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(1) + '×'} />} />
        <ReferenceLine y={10} stroke="#ff3d5e" strokeDasharray="4 3"
          label={{ value: 'Risk-off 10×', fill: '#ff3d5e', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <ReferenceLine y={5}  stroke="#ffb300" strokeDasharray="4 3"
          label={{ value: 'Caution 5×', fill: '#ffb300', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <Area type="monotone" dataKey="dii_hedge" name="DII Hedge ×"
          stroke="#ff3d5e" strokeWidth={2}
          fill="rgba(255,61,94,0.10)" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 5. FII call vs put (comparison with DII) ─────────────────────────────────
// Mirrors DIIOptionsChart so the two institutions can be compared visually.
function FIIOptionsFullChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="bar" tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={TICK} width={54} />
        <YAxis yAxisId="line" orientation="right"
          tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => (v / 1000).toFixed(1) + 'K'} />} />
        <ReferenceLine yAxisId="line" y={0} stroke="#2152a0" />
        <Bar yAxisId="bar" dataKey="fii_call_l" name="FII Call Long" fill="#00e699" fillOpacity={0.55} maxBarSize={5} />
        <Bar yAxisId="bar" dataKey="fii_put_l"  name="FII Put Long"  fill="#ff3d5e" fillOpacity={0.55} maxBarSize={5} />
        <Line yAxisId="line" type="monotone" dataKey="fii_opt_net" name="FII Net C−P"
          stroke="#b87dff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, accent }) {
  return (
    <div className="card metric-card" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent, fontSize: 20 }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

// ─── Insight box ──────────────────────────────────────────────────────────────
function Insight({ icon, text, type = 'neutral' }) {
  const colors = {
    bullish: { bg: 'var(--green-dim)',  border: 'var(--green)',  text: 'var(--green)'  },
    bearish: { bg: 'var(--red-dim)',    border: 'var(--red)',    text: 'var(--red)'    },
    caution: { bg: 'var(--amber-dim)',  border: 'var(--amber)',  text: 'var(--amber)'  },
    neutral: { bg: 'var(--cyan-dim)',   border: 'var(--cyan)',   text: 'var(--cyan)'   },
  };
  const c = colors[type] ?? colors.neutral;
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 14px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
    }}>
      <span style={{ color: c.text, flexShrink: 0, fontSize: 15 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ items }) {
  return (
    <div className="chart-legend" style={{ marginTop: 6 }}>
      {items.map(({ color, label }) => (
        <div className="legend-item" key={label}>
          <div className="legend-dot" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function OptionsTab({ data, latest }) {
  if (!data?.length || !latest) return null;

  const L = latest;

  // PCR regime labels
  const pcrLabel = pcr =>
    pcr >= 1.2 ? { txt: 'Fear Zone',    col: '#ff3d5e' } :
    pcr <= 0.7 ? { txt: 'Greed Zone',   col: '#ffb300' } :
                 { txt: 'Neutral',       col: '#00c8ff' };

  const idxPCR  = pcrLabel(L.pcr_idx);
  const fiiPCR  = pcrLabel(L.fii_pcr);
  const clPCR   = pcrLabel(L.cl_pcr);

  const diiHedgeType = L.dii_hedge > 10 ? 'bearish'
                     : L.dii_hedge >  5 ? 'caution'
                     : 'bullish';

  return (
    <div>
      <div className="section-title">Options Intelligence</div>

      {/* ── KPI row ── */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <KPI label="Index PCR"
          value={L.pcr_idx.toFixed(2)}
          sub={idxPCR.txt}
          accent={idxPCR.col} />
        <KPI label="FII PCR"
          value={L.fii_pcr.toFixed(2)}
          sub={fiiPCR.txt}
          accent={fiiPCR.col} />
        <KPI label="Client PCR"
          value={L.cl_pcr.toFixed(2)}
          sub={clPCR.txt}
          accent={clPCR.col} />
        <KPI label="DII Hedge ×"
          value={L.dii_hedge.toFixed(1) + '×'}
          sub="Put/call long ratio"
          accent={L.dii_hedge > 5 ? '#ff3d5e' : '#00e699'} />
      </div>

      {/* ── Insights ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <Insight
          icon="◈"
          type={L.fii_pcr > L.cl_pcr ? 'caution' : 'bullish'}
          text={
            L.fii_pcr > L.cl_pcr
              ? `FII PCR (${L.fii_pcr.toFixed(2)}) > Client PCR (${L.cl_pcr.toFixed(2)}). Institutions buying more puts than retail — classic divergence where smart money hedges and retail stays exposed.`
              : `Client PCR (${L.cl_pcr.toFixed(2)}) > FII PCR (${L.fii_pcr.toFixed(2)}). Retail buying more puts than institutions — retail fear exceeds institutional caution.`
          }
        />
        <Insight
          icon="🛡"
          type={diiHedgeType}
          text={
            L.dii_hedge > 10
              ? `DII hedge ratio is ${L.dii_hedge.toFixed(1)}× — extreme. For every 1 call long, DII holds ${L.dii_hedge.toFixed(1)} put longs. Domestic institutions are in heavy protection mode.`
              : L.dii_hedge > 5
              ? `DII hedge ratio ${L.dii_hedge.toFixed(1)}× is elevated. Domestic institutions adding put protection faster than calls — cautious near-term view.`
              : `DII hedge ratio ${L.dii_hedge.toFixed(1)}× is relatively calm. Domestic institutions not in fear mode currently.`
          }
        />
      </div>

      {/* ── Row 1: Participant PCR comparison + DII PCR scale ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="FII / Client / Index PCR"
          subtitle="Who is buying puts vs calls — fear above 1.2, greed below 0.7"
        >
          <Legend items={[
            { color: '#b87dff', label: 'FII PCR'    },
            { color: '#ffb300', label: 'Client PCR' },
            { color: '#00c8ff', label: 'Index PCR'  },
          ]} />
          <ParticipantPCRChart data={data} />
        </ChartCard>

        <ChartCard
          title="DII PCR — Institutional Hedge Intensity"
          subtitle="Scale 0–222×. Spikes = DII buying massive put protection"
        >
          <Legend items={[{ color: '#00c8ff', label: 'DII PCR×' }]} />
          <DIIPCRChart data={data} />
        </ChartCard>
      </div>

      {/* ── Row 2: DII options breakdown + FII options comparison ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="DII Options Positioning"
          subtitle="Call vs put longs (bars) + PCR line — DII is structurally put-heavy"
        >
          <Legend items={[
            { color: '#00e699', label: 'Call Long' },
            { color: '#ff3d5e', label: 'Put Long'  },
            { color: '#ffb300', label: 'PCR ×'     },
          ]} />
          <DIIOptionsChart data={data} />
        </ChartCard>

        <ChartCard
          title="FII Options Positioning"
          subtitle="Call vs put longs (bars) + net call−put line — compare with DII above"
        >
          <Legend items={[
            { color: '#00e699', label: 'Call Long'  },
            { color: '#ff3d5e', label: 'Put Long'   },
            { color: '#b87dff', label: 'Net C−P'    },
          ]} />
          <FIIOptionsFullChart data={data} />
        </ChartCard>
      </div>

      {/* ── Row 3: DII hedge area ── */}
      <ChartCard
        title="DII Hedge Ratio Timeline"
        subtitle="Put-to-call long ratio for DII index options. Fear indicator independent of PCR — spikes precede market stress"
        style={{ marginBottom: 14 }}
      >
        <Legend items={[{ color: '#ff3d5e', label: 'DII Hedge ×' }]} />
        <DIIHedgeChart data={data} />
      </ChartCard>
    </div>
  );
}

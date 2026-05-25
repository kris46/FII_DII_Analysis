// src/components/LSRatioTab.jsx
// ─────────────────────────────────────────────────────────────────────────────
// L/S RATIO DEEP DIVE TAB
// Key columns: fii_ls, dii_ls, cl_ls, pr_ls,
//              fii_tl, fii_ts, dii_tl, dii_ts
// The DII story: L/S of 0.05–0.13 vs FII at 1.3–1.6 tells the structural
// DII-is-always-hedging narrative that no other chart in the dashboard shows.
// ─────────────────────────────────────────────────────────────────────────────
import {
  ComposedChart, AreaChart, Area, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import { fmt } from '../utils/metrics.js';

const TICK = { fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' };
const GRID = { stroke: '#0e2040', strokeDasharray: '3 3' };

// Participant colour map — consistent across all charts
const PC = {
  fii: '#b87dff',  // purple
  dii: '#00c8ff',  // cyan
  cl:  '#ffb300',  // amber
  pr:  '#00e699',  // green
};

function Tip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map(p => (
        <div className="tooltip-row" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: p.color }}>
            {formatter ? formatter(p.value, p.name) : Number(p.value).toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="chart-legend" style={{ marginTop: 6 }}>
      {items.map(({ color, label, dash }) => (
        <div className="legend-item" key={label}>
          <div className="legend-dot" style={{
            background: dash ? 'transparent' : color,
            border: dash ? `1.5px dashed ${color}` : 'none',
          }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── 1. All-participant L/S ratio — dual Y axis ──────────────────────────────
// FII/Client/PRO on left axis (range ~0.8–2.0)
// DII on right axis (range ~0.03–0.20) — they are so different they need separation
function AllLSChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="main" domain={['auto','auto']} tick={TICK} width={44}
          tickFormatter={v => v.toFixed(2)} />
        <YAxis yAxisId="dii"  orientation="right" domain={['auto','auto']} tick={TICK} width={44}
          tickFormatter={v => v.toFixed(3)} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(3)} />} />
        <ReferenceLine yAxisId="main" y={1} stroke="#2152a0" strokeDasharray="4 2"
          label={{ value: 'L/S = 1.0', fill: '#3d6ea8', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <Line yAxisId="main" type="monotone" dataKey="fii_ls" name="FII L/S"
          stroke={PC.fii} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="main" type="monotone" dataKey="cl_ls"  name="Client L/S"
          stroke={PC.cl} strokeWidth={2} strokeDasharray="5 2" dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="main" type="monotone" dataKey="pr_ls"  name="PRO L/S"
          stroke={PC.pr} strokeWidth={1.5} strokeDasharray="2 3" dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="dii"  type="monotone" dataKey="dii_ls" name="DII L/S (R)"
          stroke={PC.dii} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 2. DII L/S isolation — tells the structural DII story clearly ────────────
function DIILSChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis domain={[0, 'auto']} tick={TICK} width={48}
          tickFormatter={v => v.toFixed(3)} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(4)} />} />
        <ReferenceLine y={1} stroke="#ff3d5e" strokeDasharray="4 3"
          label={{ value: 'Neutral = 1.0 (never reached)', fill: '#ff3d5e', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <Area type="monotone" dataKey="dii_ls" name="DII L/S"
          stroke={PC.dii} strokeWidth={2}
          fill="rgba(0,200,255,0.08)" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 3. FII gross book — longs vs shorts absolute scale ──────────────────────
// Shows the expanding gross book over time.
function FIIGrossChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => fmt(v)} />} />
        <Bar dataKey="fii_tl" name="FII Gross Long"  fill="#00e699" fillOpacity={0.55} maxBarSize={6} />
        <Bar dataKey="fii_ts" name="FII Gross Short" fill="#ff3d5e" fillOpacity={0.55} maxBarSize={6} />
        <Line type="monotone"
          dataKey={d => d.fii_tl - d.fii_ts}
          name="Net" stroke={PC.fii} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 4. DII gross book ────────────────────────────────────────────────────────
// DII gross shorts FAR exceed longs — structural hedging visible at gross level.
function DIIGrossChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => fmt(v)} />} />
        <Bar dataKey="dii_tl" name="DII Gross Long"  fill="#00c8ff" fillOpacity={0.55} maxBarSize={6} />
        <Bar dataKey="dii_ts" name="DII Gross Short" fill="#ff3d5e" fillOpacity={0.55} maxBarSize={6} />
        <Line type="monotone"
          dataKey={d => d.dii_tl - d.dii_ts}
          name="Net" stroke={PC.dii} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 5. FII L/S vs DII L/S on same scale (logged) ────────────────────────────
// Log Y axis makes both visible — shows regime alignment / divergence.
function LSRegimeChart({ data }) {
  // Compute a simple rolling 5-day avg for FII L/S
  const enriched = data.map((d, i) => {
    const window = data.slice(Math.max(0, i - 4), i + 1);
    const avg = window.reduce((s, w) => s + w.fii_ls, 0) / window.length;
    return { ...d, fii_ls_ma5: parseFloat(avg.toFixed(3)) };
  });
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={enriched} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="fii" domain={['auto','auto']} tick={TICK} width={44}
          tickFormatter={v => v.toFixed(2)} />
        <YAxis yAxisId="dii" orientation="right" domain={['auto','auto']} tick={TICK} width={48}
          tickFormatter={v => v.toFixed(3)} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(4)} />} />
        <Line yAxisId="fii" type="monotone" dataKey="fii_ls" name="FII L/S"
          stroke={PC.fii} strokeWidth={1.5} strokeOpacity={0.4} dot={false} />
        <Line yAxisId="fii" type="monotone" dataKey="fii_ls_ma5" name="FII L/S MA5"
          stroke={PC.fii} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="dii" type="monotone" dataKey="dii_ls" name="DII L/S (R)"
          stroke={PC.dii} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, accent, subAccent }) {
  return (
    <div className="card metric-card" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent, fontSize: 20 }}>{value}</div>
      {sub && <div className="metric-sub" style={subAccent ? { color: subAccent } : {}}>{sub}</div>}
    </div>
  );
}

function Insight({ icon, text, type = 'neutral' }) {
  const colors = {
    bullish: { bg: 'var(--green-dim)',  border: 'var(--green)'  },
    bearish: { bg: 'var(--red-dim)',    border: 'var(--red)'    },
    caution: { bg: 'var(--amber-dim)',  border: 'var(--amber)'  },
    neutral: { bg: 'var(--cyan-dim)',   border: 'var(--cyan)'   },
  };
  const c = colors[type] ?? colors.neutral;
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 14px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
    }}>
      <span style={{ flexShrink: 0, fontSize: 15 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LSRatioTab({ data, latest }) {
  if (!data?.length || !latest) return null;

  const L = latest;

  // FII net from gross
  const fiiNet = L.fii_tl - L.fii_ts;
  const diiNet = L.dii_tl - L.dii_ts;

  return (
    <div>
      <div className="section-title">L/S Ratio Deep Dive</div>

      {/* ── KPI row ── */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <KPI label="FII L/S Ratio"
          value={L.fii_ls.toFixed(3)}
          sub={L.fii_ls >= 1 ? 'Net long bias' : 'Net short bias'}
          accent={PC.fii}
          subAccent={L.fii_ls >= 1 ? '#00e699' : '#ff3d5e'} />
        <KPI label="DII L/S Ratio"
          value={L.dii_ls.toFixed(3)}
          sub="Structurally short — always hedged"
          accent={PC.dii} />
        <KPI label="Client L/S Ratio"
          value={L.cl_ls.toFixed(3)}
          sub={L.cl_ls >= 1 ? 'Retail net long' : 'Retail net short'}
          accent={PC.cl}
          subAccent={L.cl_ls >= 1 ? '#00e699' : '#ff3d5e'} />
        <KPI label="PRO L/S Ratio"
          value={L.pr_ls.toFixed(3)}
          sub="Proprietary traders"
          accent={PC.pr} />
      </div>

      {/* ── Insights ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <Insight
          icon="⇅"
          type="caution"
          text={
            `DII L/S ratio is ${L.dii_ls.toFixed(3)} — meaning DII holds ~${(1/L.dii_ls).toFixed(0)} short contracts for every 1 long. ` +
            `This is not bearishness — it is the structural reality of DII being the de-facto market maker and portfolio hedger for Indian mutual funds and insurance. ` +
            `Their gross longs (${fmt(L.dii_tl)}) are offset by massive short hedges (${fmt(L.dii_ts)}).`
          }
        />
        <Insight
          icon="▲"
          type={L.fii_ls >= 1.3 ? 'bullish' : L.fii_ls >= 1.0 ? 'neutral' : 'bearish'}
          text={
            `FII L/S ${L.fii_ls.toFixed(3)}: gross long ${fmt(L.fii_tl)}, gross short ${fmt(L.fii_ts)}, net ${fmt(fiiNet)}. ` +
            (L.fii_ls >= 1.3
              ? 'FII L/S above 1.3 — comfortable bullish skew. Institutional money positioned for upside.'
              : L.fii_ls >= 1.0
              ? 'FII L/S above 1.0 but below historic norm. Moderate positioning, watch for trend.'
              : 'FII L/S below 1.0 — net short. Institutional caution or active downside bets.')
          }
        />
      </div>

      {/* ── Row 1: All participant L/S + DII isolation ── */}
      <ChartCard
        title="All-Participant L/S Ratio — FII/Client/PRO (left) · DII (right)"
        subtitle="DII scale is 10–20× smaller — both axes needed. Horizontal line at L/S = 1.0 (neutral)"
        style={{ marginBottom: 14 }}
      >
        <Legend items={[
          { color: PC.fii, label: 'FII L/S'       },
          { color: PC.cl,  label: 'Client L/S', dash: true },
          { color: PC.pr,  label: 'PRO L/S'        },
          { color: PC.dii, label: 'DII L/S (R-axis)' },
        ]} />
        <AllLSChart data={data} />
      </ChartCard>

      {/* ── Row 2: DII isolated + FII MA ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="DII L/S — Isolated View"
          subtitle="Range 0.03–0.20. DII never crosses 1.0 — structural short book by design. Red line shows where neutral would be"
        >
          <Legend items={[{ color: PC.dii, label: 'DII L/S' }]} />
          <DIILSChart data={data} />
        </ChartCard>

        <ChartCard
          title="FII L/S + 5-Day MA"
          subtitle="Faded line = raw daily · Bold line = 5-day moving average. DII L/S overlaid on right axis for comparison"
        >
          <Legend items={[
            { color: PC.fii, label: 'FII L/S'   },
            { color: PC.fii, label: 'FII MA5'   },
            { color: PC.dii, label: 'DII L/S (R)', dash: true },
          ]} />
          <LSRegimeChart data={data} />
        </ChartCard>
      </div>

      {/* ── Row 3: Gross exposure ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="FII Gross Book — Long vs Short"
          subtitle="Absolute contracts. Net line shows direction. Growing gross book = increasing leverage"
        >
          <Legend items={[
            { color: '#00e699', label: 'Gross Long'  },
            { color: '#ff3d5e', label: 'Gross Short' },
            { color: PC.fii,    label: 'Net'         },
          ]} />
          <FIIGrossChart data={data} />
        </ChartCard>

        <ChartCard
          title="DII Gross Book — Long vs Short"
          subtitle="DII gross shorts consistently larger than longs — the hedging mandate of Indian MFs + insurance in raw numbers"
        >
          <Legend items={[
            { color: '#00c8ff', label: 'Gross Long'  },
            { color: '#ff3d5e', label: 'Gross Short' },
            { color: PC.dii,    label: 'Net'         },
          ]} />
          <DIIGrossChart data={data} />
        </ChartCard>
      </div>

      {/* ── Structural comparison table ── */}
      <ChartCard title="Latest Day — Gross Book Summary">
        <div className="heatmap-wrap">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Gross Long</th>
                <th>Gross Short</th>
                <th>Net</th>
                <th>L/S Ratio</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'FII', color: PC.fii,
                  tl: L.fii_tl, ts: L.fii_ts, ls: L.fii_ls,
                  note: L.fii_ls >= 1 ? 'Net long — directional bullish' : 'Net short — hedging / bearish',
                },
                {
                  name: 'DII', color: PC.dii,
                  tl: L.dii_tl, ts: L.dii_ts, ls: L.dii_ls,
                  note: 'Structurally short — portfolio hedge mandate',
                },
              ].map(r => {
                const net = r.tl - r.ts;
                return (
                  <tr key={r.name}>
                    <td style={{ color: r.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ color: '#00e699', fontFamily: 'JetBrains Mono' }}>{fmt(r.tl)}</td>
                    <td style={{ color: '#ff3d5e', fontFamily: 'JetBrains Mono' }}>{fmt(r.ts)}</td>
                    <td style={{ color: net >= 0 ? '#00e699' : '#ff3d5e', fontFamily: 'JetBrains Mono' }}>{fmt(net)}</td>
                    <td style={{ color: r.color, fontFamily: 'JetBrains Mono' }}>{r.ls.toFixed(3)}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 11 }}>{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

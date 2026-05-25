// src/components/SmartMoneyTab.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SMART MONEY ENGINE TAB
// Key columns: fii_dii_div, fii_net_idx, fii_net_stk, dii_net_stk,
//              pr_net_idx, cl_net_idx, fii_ls, cl_ls
// Derived: SmartMoney composite score, contrarian signal strength
// ─────────────────────────────────────────────────────────────────────────────
import {
  ComposedChart, AreaChart, Area, Bar, Line, Scatter, ScatterChart,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import { fmt } from '../utils/metrics.js';

const TICK = { fill: '#3d6ea8', fontSize: 10, fontFamily: 'JetBrains Mono' };
const GRID = { stroke: '#0e2040', strokeDasharray: '3 3' };

function Tip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {payload.map(p => (
        <div className="tooltip-row" key={p.dataKey}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: p.color }}>
            {formatter ? formatter(p.value, p.name) : fmt(p.value)}
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

// ─── Derived: compute smart money score (0–100) ───────────────────────────────
// Normalises FII + PRO contribution vs Client opposition.
function computeSmartScore(data) {
  if (!data.length) return [];
  const fiiVals = data.map(d => d.fii_net_idx);
  const fiiMin  = Math.min(...fiiVals);
  const fiiMax  = Math.max(...fiiVals);
  const fiiRange = fiiMax - fiiMin || 1;

  const clVals  = data.map(d => d.cl_net_idx);
  const clMin   = Math.min(...clVals);
  const clMax   = Math.max(...clVals);
  const clRange = clMax - clMin || 1;

  const prVals  = data.map(d => d.pr_net_idx);
  const prMin   = Math.min(...prVals);
  const prMax   = Math.max(...prVals);
  const prRange = prMax - prMin || 1;

  return data.map(d => {
    const fiiN  = (d.fii_net_idx - fiiMin) / fiiRange;   // 0–1
    const clN   = (d.cl_net_idx  - clMin)  / clRange;    // 0–1 (high = retail bullish)
    const prN   = (d.pr_net_idx  - prMin)  / prRange;    // 0–1
    // Score: FII drives 55%, PRO 30%, fade retail 15%
    const raw   = fiiN * 0.55 + prN * 0.30 + (1 - clN) * 0.15;
    return { ...d, sm_score: Math.round(raw * 100) };
  });
}

// ─── 1. FII–DII Divergence chart ─────────────────────────────────────────────
function DivergenceDetailChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="div" tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={TICK} width={54} />
        <YAxis yAxisId="net" orientation="right"
          tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => fmt(v)} />} />
        <ReferenceLine yAxisId="div" y={0} stroke="#2152a0" strokeWidth={1.5} />
        {/* Divergence as filled area above/below zero */}
        <Bar yAxisId="div" dataKey="fii_dii_div" name="FII−DII Div" maxBarSize={5}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fii_dii_div >= 0 ? '#00e699' : '#ff3d5e'} fillOpacity={0.65} />
          ))}
        </Bar>
        <Line yAxisId="net" type="monotone" dataKey="fii_net_idx" name="FII Net Idx"
          stroke="#b87dff" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="net" type="monotone" dataKey="dii_net_idx" name="DII Net Idx"
          stroke="#00c8ff" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 2. Contrarian signal: FII vs Client ─────────────────────────────────────
// When they are on opposite sides the difference is highlighted.
function ContrarianChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => fmt(v)} />} />
        <ReferenceLine y={0} stroke="#2152a0" strokeWidth={1.5} />
        <Line type="monotone" dataKey="fii_net_idx" name="FII Net Idx"
          stroke="#b87dff" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="cl_net_idx"  name="Client Net Idx"
          stroke="#ffb300" strokeWidth={2} strokeDasharray="5 2" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 3. Smart Money Composite Score ──────────────────────────────────────────
function SmartScoreChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={TICK} width={36}
          tickFormatter={v => v} />
        <Tooltip content={<Tip formatter={v => v + '/100'} />} />
        <ReferenceLine y={65} stroke="#00e699" strokeDasharray="4 3"
          label={{ value: 'Conviction 65', fill: '#00e699', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <ReferenceLine y={35} stroke="#ff3d5e" strokeDasharray="4 3"
          label={{ value: 'Cautious 35', fill: '#ff3d5e', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideBottomLeft' }} />
        <Area type="monotone" dataKey="sm_score" name="Smart Money Score"
          stroke="#00c8ff" strokeWidth={2}
          fill="rgba(0,200,255,0.08)" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 4. Stock futures vs Index futures scatter ────────────────────────────────
// FII typically: short index futures (hedge) + long stock futures (alpha).
// Quadrant analysis reveals whether this structural pattern is intact.
function StockVsIndexChart({ data }) {
  // Scatter wants { x, y, disp } shape
  const pts = data.map(d => ({
    x: d.fii_net_idx,
    y: d.fii_net_stk,
    disp: d.disp,
  }));
  const last = pts[pts.length - 1];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis type="number" dataKey="x" name="FII Net Index Fut"
          tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={TICK} label={{ value: '← Index Short   Index Long →', fill: '#3d6ea8', fontSize: 9, position: 'insideBottom', offset: -2, fontFamily: 'JetBrains Mono' }} />
        <YAxis type="number" dataKey="y" name="FII Net Stock Fut"
          tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          tick={TICK} width={54} />
        <ZAxis range={[18, 18]} />
        <Tooltip
          cursor={{ stroke: '#2152a0' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            return (
              <div className="custom-tooltip">
                <div className="tooltip-date">{d?.disp}</div>
                <div className="tooltip-row">
                  <span style={{ color: '#b87dff' }}>Index</span>
                  <span style={{ color: '#b87dff' }}>{fmt(d?.x)}</span>
                </div>
                <div className="tooltip-row">
                  <span style={{ color: '#00c8ff' }}>Stock</span>
                  <span style={{ color: '#00c8ff' }}>{fmt(d?.y)}</span>
                </div>
              </div>
            );
          }}
        />
        <ReferenceLine x={0} stroke="#2152a0" strokeWidth={1.5} />
        <ReferenceLine y={0} stroke="#2152a0" strokeWidth={1.5} />
        <Scatter data={pts} fill="#b87dff" fillOpacity={0.4} />
        {/* Highlight latest point */}
        <Scatter data={[last]} fill="#00e699" fillOpacity={1} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─── 5. FII L/S vs Client L/S — spread ───────────────────────────────────────
function LSSpreadChart({ data }) {
  const enriched = data.map(d => ({
    ...d,
    ls_spread: parseFloat((d.fii_ls - d.cl_ls).toFixed(3)),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={enriched} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="ls"    domain={['auto','auto']} tick={TICK} width={40} />
        <YAxis yAxisId="spread" orientation="right" domain={['auto','auto']} tick={TICK} width={40} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(3)} />} />
        <ReferenceLine yAxisId="ls" y={1} stroke="#2152a0" strokeDasharray="4 2" />
        <Line yAxisId="ls" type="monotone" dataKey="fii_ls" name="FII L/S"
          stroke="#b87dff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="ls" type="monotone" dataKey="cl_ls"  name="Client L/S"
          stroke="#ffb300" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 4 }} />
        <Bar yAxisId="spread" dataKey="ls_spread" name="FII−Client Spread" maxBarSize={4}>
          {enriched.map((d, i) => (
            <Cell key={i} fill={d.ls_spread >= 0 ? '#00e699' : '#ff3d5e'} fillOpacity={0.5} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── KPI / Gauge ──────────────────────────────────────────────────────────────
function ScoreGauge({ score }) {
  const color = score >= 65 ? '#00e699' : score >= 35 ? '#ffb300' : '#ff3d5e';
  const label = score >= 65 ? 'Conviction'  : score >= 35 ? 'Neutral'   : 'Cautious';
  const pct   = score; // 0–100
  return (
    <div className="card metric-card" style={{ borderLeft: `3px solid ${color}`, display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* Arc visual */}
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
        <svg viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${pct * 1.634} 163.4`}
            strokeLinecap="round" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 600, color,
        }}>{score}</div>
      </div>
      <div>
        <div className="metric-label">Smart Money Score</div>
        <div className="metric-value" style={{ color, fontSize: 18 }}>{label}</div>
        <div className="metric-sub">0 = Cautious · 100 = Conviction</div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, accent }) {
  return (
    <div className="card metric-card" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent, fontSize: 20 }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
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
export default function SmartMoneyTab({ data, latest }) {
  if (!data?.length || !latest) return null;

  const L = latest;
  const scored = computeSmartScore(data);
  const latestScore = scored[scored.length - 1]?.sm_score ?? 50;

  // Contrarian signal
  const opposite = L.fii_net_idx * L.cl_net_idx < 0;
  const fiiLong  = L.fii_net_idx >= 0;

  // Divergence magnitude
  const divPct = L.fii_dii_div !== 0
    ? ((Math.abs(L.fii_dii_div) / Math.max(Math.abs(L.fii_net_idx), Math.abs(L.dii_net_idx), 1)) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <div className="section-title">Smart Money Engine</div>

      {/* ── KPI row ── */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <ScoreGauge score={latestScore} />
        <KPI label="FII−DII Divergence"
          value={fmt(L.fii_dii_div)}
          sub={L.fii_dii_div >= 0 ? 'FII leads long' : 'DII leads long'}
          accent={L.fii_dii_div >= 0 ? '#b87dff' : '#00c8ff'} />
        <KPI label="FII Net Index"
          value={fmt(L.fii_net_idx)}
          sub={L.fii_net_idx >= 0 ? 'Institutional long' : 'Institutional short'}
          accent={L.fii_net_idx >= 0 ? '#00e699' : '#ff3d5e'} />
        <KPI label="Client Net Index"
          value={fmt(L.cl_net_idx)}
          sub={L.cl_net_idx >= 0 ? 'Retail long' : 'Retail short'}
          accent={L.cl_net_idx >= 0 ? '#ffb300' : '#ff3d5e'} />
      </div>

      {/* ── Insights ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {opposite && (
          <Insight
            icon="🔄"
            type={fiiLong ? 'bullish' : 'bearish'}
            text={
              fiiLong
                ? `FII long (${fmt(L.fii_net_idx)}) while Client short (${fmt(L.cl_net_idx)}) — institutional and retail on opposite sides. Historically: fade retail, lean LONG with FII.`
                : `FII short (${fmt(L.fii_net_idx)}) while Client long (${fmt(L.cl_net_idx)}) — institutional and retail on opposite sides. Historically: fade retail, lean SHORT with FII.`
            }
          />
        )}
        <Insight
          icon="⚡"
          type={Math.abs(L.fii_dii_div) > 100000 ? 'caution' : 'neutral'}
          text={
            `FII vs DII net index divergence: ${fmt(L.fii_dii_div)} contracts (${divPct}% of larger position). ` +
            (Math.abs(L.fii_dii_div) > 100000
              ? 'Large divergence — FII and DII are pulling in meaningfully different directions. Watch for resolution.'
              : 'Divergence moderate — FII and DII broadly aligned.')
          }
        />
        <Insight
          icon="◎"
          type={L.fii_net_stk >= 0 && L.fii_net_idx < 0 ? 'caution' : 'neutral'}
          text={
            L.fii_net_stk >= 0 && L.fii_net_idx < 0
              ? `FII structural play: Short index futures (${fmt(L.fii_net_idx)}) for macro hedge, Long stock futures (${fmt(L.fii_net_stk)}) for alpha. Classic institutional long-short. Watch index short unwind as signal.`
              : `FII stock futures: ${fmt(L.fii_net_stk)}. Index futures: ${fmt(L.fii_net_idx)}.`
          }
        />
      </div>

      {/* ── Row 1: Divergence bars + Contrarian ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="FII–DII Divergence"
          subtitle="Green = FII more bullish than DII · Red = DII more bullish. Overlaid FII + DII net lines"
        >
          <Legend items={[
            { color: '#00e699', label: 'Div +ve (FII leads)' },
            { color: '#ff3d5e', label: 'Div −ve (DII leads)' },
            { color: '#b87dff', label: 'FII Net Idx'         },
            { color: '#00c8ff', label: 'DII Net Idx', dash: true },
          ]} />
          <DivergenceDetailChart data={data} />
        </ChartCard>

        <ChartCard
          title="FII vs Client — Contrarian Signal"
          subtitle="When lines cross to opposite sides: institutional vs retail divergence. Fade retail, follow FII"
        >
          <Legend items={[
            { color: '#b87dff', label: 'FII Net Idx'    },
            { color: '#ffb300', label: 'Client Net Idx', dash: true },
          ]} />
          <ContrarianChart data={data} />
        </ChartCard>
      </div>

      {/* ── Row 2: Smart score + L/S spread ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="Smart Money Composite Score"
          subtitle="Derived: FII×0.55 + PRO×0.30 − Retail×0.15 (normalised 0–100). Above 65 = conviction, below 35 = caution"
        >
          <Legend items={[{ color: '#00c8ff', label: 'Smart Money Score' }]} />
          <SmartScoreChart data={scored} />
        </ChartCard>

        <ChartCard
          title="FII vs Client L/S Spread"
          subtitle="Both L/S ratios + spread bars. When FII L/S rises while Client falls — institutional conviction growing"
        >
          <Legend items={[
            { color: '#b87dff', label: 'FII L/S'         },
            { color: '#ffb300', label: 'Client L/S', dash: true },
            { color: '#00e699', label: 'Spread (FII−Cl)' },
          ]} />
          <LSSpreadChart data={data} />
        </ChartCard>
      </div>

      {/* ── Row 3: Stock vs Index scatter ── */}
      <ChartCard
        title="FII: Stock Futures vs Index Futures — Quadrant Analysis"
        subtitle="X = FII net index futures · Y = FII net stock futures. Top-left = short index + long stocks (structural hedge + alpha). Green dot = latest day"
        style={{ marginBottom: 14 }}
      >
        <StockVsIndexChart data={data} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10,
          fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)',
        }}>
          <div style={{ padding: '4px 8px', background: 'rgba(0,230,153,0.05)', borderRadius: 4, border: '1px solid #152d52' }}>
            ↖ Short Idx + Long Stk<br/>
            <span style={{ color: '#00e699' }}>Structural hedge (most common for FII)</span>
          </div>
          <div style={{ padding: '4px 8px', background: 'rgba(0,200,255,0.05)', borderRadius: 4, border: '1px solid #152d52' }}>
            ↗ Long Idx + Long Stk<br/>
            <span style={{ color: '#00c8ff' }}>Full bullish — directional conviction</span>
          </div>
          <div style={{ padding: '4px 8px', background: 'rgba(255,179,0,0.05)', borderRadius: 4, border: '1px solid #152d52' }}>
            ↙ Short Idx + Short Stk<br/>
            <span style={{ color: '#ffb300' }}>Full bearish — macro risk-off</span>
          </div>
          <div style={{ padding: '4px 8px', background: 'rgba(255,61,94,0.05)', borderRadius: 4, border: '1px solid #152d52' }}>
            ↘ Long Idx + Short Stk<br/>
            <span style={{ color: '#ff3d5e' }}>Index rally play without stock selection</span>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

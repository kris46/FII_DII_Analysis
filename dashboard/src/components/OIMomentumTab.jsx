// src/components/OIMomentumTab.jsx
// ─────────────────────────────────────────────────────────────────────────────
// OI MOMENTUM TAB
// Key columns: total_oi, date
// Derived: MA5, MA10, OI change %, cumulative OI change, weekly aggregation
// Adds the time-series depth that the Overview OIMomentumChart (basic) misses.
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

// ─── Derived: enrich with MA5, MA10, change%, cumulative change ───────────────
function enrichOI(data) {
  return data.map((d, i) => {
    const w5  = data.slice(Math.max(0, i - 4), i + 1);
    const w10 = data.slice(Math.max(0, i - 9), i + 1);
    const ma5  = w5.reduce((s, r)  => s + r.total_oi, 0) / w5.length;
    const ma10 = w10.reduce((s, r) => s + r.total_oi, 0) / w10.length;

    const prev   = i > 0 ? data[i - 1].total_oi : d.total_oi;
    const chgPct = prev !== 0 ? ((d.total_oi - prev) / prev) * 100 : 0;

    // Cumulative from first row
    const base     = data[0].total_oi;
    const cumulPct = base !== 0 ? ((d.total_oi - base) / base) * 100 : 0;

    return {
      ...d,
      ma5:      Math.round(ma5),
      ma10:     Math.round(ma10),
      chg_pct:  parseFloat(chgPct.toFixed(2)),
      cumul_pct: parseFloat(cumulPct.toFixed(2)),
    };
  });
}

// ─── Derived: weekly aggregation ─────────────────────────────────────────────
function weeklyOI(data) {
  const weeks = [];
  for (let i = 0; i < data.length; i += 5) {
    const chunk = data.slice(i, Math.min(i + 5, data.length));
    const avg   = chunk.reduce((s, r) => s + r.total_oi, 0) / chunk.length;
    const start = chunk[0];
    const end   = chunk[chunk.length - 1];
    const chg   = ((end.total_oi - start.total_oi) / start.total_oi) * 100;
    weeks.push({
      week:     end.date.slice(0, 10),
      disp:     end.disp,
      avg_oi:   Math.round(avg),
      end_oi:   end.total_oi,
      wk_chg:   parseFloat(chg.toFixed(2)),
      fii_net:  end.fii_net_idx,
      pcr:      end.pcr_idx,
    });
  }
  return weeks;
}

// ─── 1. OI trend with MA overlays ────────────────────────────────────────────
function OITrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => fmt(v)} />} />
        {/* Base area for total OI */}
        <Area type="monotone" dataKey="total_oi" name="Total OI"
          stroke="#00c8ff" strokeWidth={0} fill="rgba(0,200,255,0.06)" dot={false} />
        <Line type="monotone" dataKey="total_oi" name="Total OI"
          stroke="#00c8ff" strokeWidth={1.5} strokeOpacity={0.5} dot={false} />
        <Line type="monotone" dataKey="ma5"  name="MA 5"
          stroke="#00e699" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="ma10" name="MA 10"
          stroke="#ffb300" strokeWidth={2} strokeDasharray="5 2" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 2. Daily OI change % ─────────────────────────────────────────────────────
function OIChangePctChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis tick={TICK} width={44} tickFormatter={v => v.toFixed(1) + '%'} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(2) + '%'} />} />
        <ReferenceLine y={0} stroke="#2152a0" strokeWidth={1.5} />
        <ReferenceLine y={10}  stroke="#ffb300" strokeDasharray="3 4"
          label={{ value: '+10%', fill: '#ffb300', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopLeft' }} />
        <ReferenceLine y={-10} stroke="#ffb300" strokeDasharray="3 4"
          label={{ value: '-10%', fill: '#ffb300', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideBottomLeft' }} />
        <Bar dataKey="chg_pct" name="Daily OI Δ%" maxBarSize={6}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.chg_pct >= 0 ? '#00e699' : '#ff3d5e'} fillOpacity={0.7} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 3. Cumulative OI change % from start of period ──────────────────────────
function CumulOIChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis tick={TICK} width={48} tickFormatter={v => v.toFixed(1) + '%'} />
        <Tooltip content={<Tip formatter={v => Number(v).toFixed(2) + '% from start'} />} />
        <ReferenceLine y={0} stroke="#2152a0" strokeWidth={1.5} />
        <Area type="monotone" dataKey="cumul_pct" name="Cumulative OI Δ%"
          stroke="#b87dff" strokeWidth={2}
          fill="rgba(184,125,255,0.08)" dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 4. Weekly OI buildup matrix ─────────────────────────────────────────────
function WeeklyOIChart({ weeks }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={weeks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval={0} angle={-30} textAnchor="end" height={32} />
        <YAxis yAxisId="oi"  tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={TICK} width={54} />
        <YAxis yAxisId="chg" orientation="right" tick={TICK} width={44}
          tickFormatter={v => v.toFixed(1) + '%'} />
        <Tooltip content={
          <Tip formatter={(v, name) =>
            name === 'Wk Chg%' ? Number(v).toFixed(2) + '%' : fmt(v)
          } />
        } />
        <ReferenceLine yAxisId="chg" y={0} stroke="#2152a0" />
        <Bar yAxisId="oi" dataKey="end_oi" name="Week-end OI" fill="#00c8ff" fillOpacity={0.4} maxBarSize={16} />
        <Line yAxisId="oi" type="monotone" dataKey="avg_oi" name="Avg OI"
          stroke="#00c8ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Bar yAxisId="chg" dataKey="wk_chg" name="Wk Chg%" maxBarSize={6}>
          {weeks.map((w, i) => (
            <Cell key={i} fill={w.wk_chg >= 0 ? '#00e699' : '#ff3d5e'} fillOpacity={0.7} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 5. OI vs FII net — do institutions build when OI rises? ─────────────────
function OIvsFIIChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="disp" tick={TICK} interval="preserveStartEnd" />
        <YAxis yAxisId="oi"  tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'} tick={TICK} width={54} />
        <YAxis yAxisId="fii" orientation="right"
          tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={TICK} width={54} />
        <Tooltip content={<Tip formatter={v => fmt(v)} />} />
        <ReferenceLine yAxisId="fii" y={0} stroke="#2152a0" strokeWidth={1} />
        <Area yAxisId="oi" type="monotone" dataKey="total_oi" name="Total OI"
          stroke="#00c8ff" strokeWidth={1.5} fill="rgba(0,200,255,0.06)" dot={false} />
        <Line yAxisId="fii" type="monotone" dataKey="fii_net_idx" name="FII Net Idx"
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
export default function OIMomentumTab({ data, latest }) {
  if (!data?.length || !latest) return null;

  const L = latest;
  const enriched = enrichOI(data);
  const weeks    = weeklyOI(enriched);

  // Stats
  const latestE  = enriched[enriched.length - 1];
  const maxOI    = Math.max(...data.map(d => d.total_oi));
  const minOI    = Math.min(...data.map(d => d.total_oi));
  const maxDay   = data.find(d => d.total_oi === maxOI);
  const minDay   = data.find(d => d.total_oi === minOI);

  // 5-day and 10-day change
  const d5  = data[Math.max(0, data.length - 6)];
  const d10 = data[Math.max(0, data.length - 11)];
  const chg5  = d5  ? ((L.total_oi - d5.total_oi)  / d5.total_oi  * 100).toFixed(1) : '—';
  const chg10 = d10 ? ((L.total_oi - d10.total_oi) / d10.total_oi * 100).toFixed(1) : '—';

  const expansion = parseFloat(chg5) > 2;
  const contraction = parseFloat(chg5) < -2;

  return (
    <div>
      <div className="section-title">OI Momentum</div>

      {/* ── KPI row ── */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <KPI label="Current Total OI"
          value={(L.total_oi / 1_000_000).toFixed(2) + 'M'}
          sub="contracts outstanding"
          accent="#00c8ff" />
        <KPI label="5-Day Change"
          value={(parseFloat(chg5) >= 0 ? '+' : '') + chg5 + '%'}
          sub={expansion ? 'Leverage building' : contraction ? 'Positions unwinding' : 'Stable'}
          accent={expansion ? '#00e699' : contraction ? '#ff3d5e' : '#ffb300'} />
        <KPI label="Period High"
          value={(maxOI / 1_000_000).toFixed(2) + 'M'}
          sub={maxDay?.date?.slice(0, 10) ?? ''}
          accent="#b87dff" />
        <KPI label="Period Low"
          value={(minOI / 1_000_000).toFixed(2) + 'M'}
          sub={minDay?.date?.slice(0, 10) ?? ''}
          accent="#ffb300" />
      </div>

      {/* ── Insights ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <Insight
          icon="◉"
          type={expansion ? 'bullish' : contraction ? 'bearish' : 'neutral'}
          text={
            expansion
              ? `OI expanded ${chg5}% over 5 sessions. New positions being added at pace — whichever direction the market trends, it will likely accelerate. Watch FII net to confirm direction.`
              : contraction
              ? `OI contracted ${Math.abs(parseFloat(chg5))}% over 5 sessions. Positions unwinding — could be expiry-driven or exhaustion. Falling OI on rising market = lack of conviction (bullish fade). Falling OI on falling market = short covering (potential reversal).`
              : `OI stable over 5 sessions (${chg5}%). No aggressive position build or unwind. Consolidation phase — wait for OI expansion to confirm next move.`
          }
        />
        <Insight
          icon="📊"
          type="neutral"
          text={
            `10-day OI change: ${parseFloat(chg10) >= 0 ? '+' : ''}${chg10}%. ` +
            `Period range: ${fmt(minOI)} – ${fmt(maxOI)} contracts. ` +
            `Current OI of ${fmt(L.total_oi)} is at ${(((L.total_oi - minOI) / (maxOI - minOI)) * 100).toFixed(0)}% of the period range.`
          }
        />
      </div>

      {/* ── Row 1: OI trend with MAs ── */}
      <ChartCard
        title="Total OI — Trend with Moving Averages"
        subtitle="Blue area = raw OI · Green = MA5 · Amber = MA10. MA crossovers signal momentum shifts"
        style={{ marginBottom: 14 }}
      >
        <Legend items={[
          { color: '#00c8ff', label: 'Total OI'      },
          { color: '#00e699', label: 'MA 5 sessions' },
          { color: '#ffb300', label: 'MA 10 sessions', dash: true },
        ]} />
        <OITrendChart data={enriched} />
      </ChartCard>

      {/* ── Row 2: Daily change% + cumulative ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="Daily OI Change %"
          subtitle="Green = positions added · Red = positions closed. Large moves often precede trend days"
        >
          <OIChangePctChart data={enriched} />
        </ChartCard>

        <ChartCard
          title="Cumulative OI Change % (from period start)"
          subtitle="Shows structural accumulation or distribution trend across the full selected window"
        >
          <Legend items={[{ color: '#b87dff', label: 'Cumulative Δ%' }]} />
          <CumulOIChart data={enriched} />
        </ChartCard>
      </div>

      {/* ── Row 3: Weekly buildup + OI vs FII ── */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard
          title="Weekly OI Buildup Matrix"
          subtitle="Blue bars = week-end OI · Δ% bars = weekly change (green/red). Expiry weeks visible as large red bars"
        >
          <Legend items={[
            { color: '#00c8ff', label: 'Week-end OI' },
            { color: '#00e699', label: 'Wk Δ% +ve'  },
            { color: '#ff3d5e', label: 'Wk Δ% −ve'  },
          ]} />
          <WeeklyOIChart weeks={weeks} />
        </ChartCard>

        <ChartCard
          title="Total OI vs FII Net — Confirmation Signal"
          subtitle="When OI rises + FII net rises: confirmed long buildup. When OI rises + FII net falls: bearish buildup"
        >
          <Legend items={[
            { color: '#00c8ff', label: 'Total OI (L)'    },
            { color: '#b87dff', label: 'FII Net Idx (R)' },
          ]} />
          <OIvsFIIChart data={enriched} />
        </ChartCard>
      </div>

      {/* ── OI interpretation table ── */}
      <ChartCard title="OI Interpretation Guide — What Combinations Mean">
        <div className="heatmap-wrap">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Price</th>
                <th>OI Change</th>
                <th>FII Net</th>
                <th>Interpretation</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {[
                { price: '↑ Rising',   oi: '↑ Rising',   fii: '↑ Rising',   desc: 'Long buildup with institutional confirmation',      sig: 'BULLISH',      col: '#00e699' },
                { price: '↑ Rising',   oi: '↓ Falling',  fii: '↑ Rising',   desc: 'Short covering — rally on position unwind',        sig: 'FADE RALLY',   col: '#ffb300' },
                { price: '↓ Falling',  oi: '↑ Rising',   fii: '↓ Falling',  desc: 'Short buildup — FII adding shorts into decline',   sig: 'BEARISH',      col: '#ff3d5e' },
                { price: '↓ Falling',  oi: '↓ Falling',  fii: '↑ Rising',   desc: 'Long unwinding — closing longs, not adding shorts', sig: 'WEAK / FADE', col: '#ffb300' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ color: r.price.includes('↑') ? '#00e699' : '#ff3d5e' }}>{r.price}</td>
                  <td style={{ color: r.oi.includes('↑')    ? '#00e699' : '#ff3d5e' }}>{r.oi}</td>
                  <td style={{ color: r.fii.includes('↑')   ? '#b87dff' : '#ff3d5e' }}>{r.fii}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 11 }}>{r.desc}</td>
                  <td style={{ color: r.col, fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600 }}>{r.sig}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

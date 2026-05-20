// src/utils/metrics.js
// ─────────────────────────────────────────────────────────────────────────────
// The processed CSV (nse_oi_dashboard.csv) already has one row per trading day
// with all derived columns pre-computed by process_nse_data.py.
// This file does NOTHING but parse strings → numbers, add a display label,
// and derive signals + heatmap deltas — no pivoting, no raw-data gymnastics.
// ─────────────────────────────────────────────────────────────────────────────

const RATIO_COLS = new Set([
  'pcr_idx','pcr_stk','fii_pcr','dii_pcr','cl_pcr',
  'fii_ls','dii_ls','cl_ls','pr_ls','dii_hedge',
]);

/** Parse a PapaParse row (all strings) → typed object */
export function parseRow(raw) {
  const out = { date: raw.date?.trim() ?? '' };
  for (const [k, v] of Object.entries(raw)) {
    if (k === 'date') continue;
    const n = parseFloat(v);
    out[k] = isNaN(n) ? 0 : (RATIO_COLS.has(k) ? n : Math.round(n));
  }
  out.disp = out.date.length >= 10 ? out.date.slice(5, 10).replace('-', '/') : out.date;
  return out;
}

/** Slice to last N trading days (0 = all) */
export function sliceRange(data, days) {
  if (!days || days >= data.length) return data;
  return data.slice(-days);
}

// ─── Signal engine ─────────────────────────────────────────────────────────────
export function computeSignals(data) {
  if (!data?.length) return [];
  const L = data[data.length - 1];
  const W = data[Math.max(0, data.length - 6)];
  const signals = [];

  // ① FII index futures bias
  signals.push(
    L.fii_net_idx >= 0
      ? { type: 'bullish', icon: '▲',
          label: 'FII Index Futures — LONG',
          desc: `FII net index futures: ${fmt(L.fii_net_idx)} contracts. Institutional bullish bias — price tends to follow FII.` }
      : { type: 'bearish', icon: '▼',
          label: 'FII Index Futures — SHORT',
          desc: `FII net index futures: ${fmt(L.fii_net_idx)} contracts. FII holding net short — bearish or hedging mode.` }
  );

  // ② PCR zone
  if (L.pcr_idx >= 1.2) {
    signals.push({ type: 'fear', icon: '😨',
      label: 'PCR — Elevated Fear (≥ 1.2)',
      desc: `Index PCR: ${L.pcr_idx.toFixed(2)}. Heavy put buying signals hedging / fear. Contrarian: look for bounce at support.` });
  } else if (L.pcr_idx <= 0.7) {
    signals.push({ type: 'greed', icon: '🔥',
      label: 'PCR — Complacency (≤ 0.7)',
      desc: `Index PCR: ${L.pcr_idx.toFixed(2)}. Call-heavy market — overconfidence risk. Watch for sharp reversal.` });
  } else {
    signals.push({ type: 'neutral', icon: '⚖',
      label: 'PCR — Balanced',
      desc: `Index PCR: ${L.pcr_idx.toFixed(2)}. Put/call sentiment balanced — no extreme positioning.` });
  }

  // ③ FII vs DII divergence
  if (Math.abs(L.fii_dii_div) > 50000) {
    signals.push(
      L.fii_dii_div > 0
        ? { type: 'contrarian_bear', icon: '⚡',
            label: 'FII/DII Divergence — FII Leads Long',
            desc: `Gap: ${fmt(L.fii_dii_div)}. FII far longer than DII on index. Watch for reversal if DII starts hedging aggressively.` }
        : { type: 'contrarian_bull', icon: '⚡',
            label: 'FII/DII Divergence — DII Leads Long',
            desc: `Gap: ${fmt(L.fii_dii_div)}. DII net long while FII is short — domestic accumulation vs foreign selling.` }
    );
  }

  // ④ DII put hedge ratio
  if (L.dii_hedge > 10) {
    signals.push({ type: 'risk_off', icon: '🛡',
      label: `DII Risk-Off — Hedge Ratio ${L.dii_hedge.toFixed(1)}×`,
      desc: `DII index put-to-call long ratio extremely elevated. Domestic institutions in heavy protection mode.` });
  } else if (L.dii_hedge > 5) {
    signals.push({ type: 'risk_off', icon: '🛡',
      label: `DII Hedging Up — Ratio ${L.dii_hedge.toFixed(1)}×`,
      desc: `DII buying significantly more puts than calls. Elevated caution from domestic institutions.` });
  }

  // ⑤ OI momentum
  const oiChgPct = W.total_oi > 0 ? ((L.total_oi - W.total_oi) / W.total_oi) * 100 : 0;
  if (Math.abs(oiChgPct) > 5) {
    signals.push(
      oiChgPct > 0
        ? { type: 'momentum_build', icon: '📈',
            label: `OI Expansion +${oiChgPct.toFixed(1)}% (5-day)`,
            desc: `Total OI grew ${oiChgPct.toFixed(1)}% over last 5 sessions. New positions building — trend likely to accelerate.` }
        : { type: 'momentum_unwind', icon: '📉',
            label: `OI Contraction ${oiChgPct.toFixed(1)}% (5-day)`,
            desc: `Total OI shed ${Math.abs(oiChgPct).toFixed(1)}% over 5 sessions. Unwinding — expiry squeeze or trend exhaustion.` }
    );
  }

  // ⑥ Retail vs FII — contrarian
  if (L.cl_net_idx * L.fii_net_idx < 0) {
    const retailBull = L.cl_net_idx > 0;
    signals.push({
      type: retailBull ? 'bearish' : 'bullish', icon: '🔄',
      label: `Retail vs FII — ${retailBull ? 'Retail Long / FII Short' : 'Retail Short / FII Long'}`,
      desc: `Client (retail) and FII on OPPOSITE sides. Historically fade retail: lean ${retailBull ? 'SHORT' : 'LONG'} with FII.`,
    });
  }

  // ⑦ FII options direction
  if (Math.abs(L.fii_opt_net) > 100000) {
    signals.push(
      L.fii_opt_net > 0
        ? { type: 'bullish', icon: '📊',
            label: 'FII Options — Net Call Buyer',
            desc: `FII call-minus-put long: +${fmt(L.fii_opt_net)}. Bullish via options — double confirmation.` }
        : { type: 'bearish', icon: '📊',
            label: 'FII Options — Net Put Buyer',
            desc: `FII put-minus-call long: ${fmt(Math.abs(L.fii_opt_net))}. FII buying more puts — directional or macro hedge.` }
    );
  }

  return signals;
}

// ─── Weekly heatmap ───────────────────────────────────────────────────────────
export const HEATMAP_METRICS = [
  { key: 'fii_net_idx', label: 'FII Idx Fut' },
  { key: 'dii_net_idx', label: 'DII Idx Fut' },
  { key: 'cl_net_idx',  label: 'Client Idx'  },
  { key: 'pcr_idx',     label: 'PCR Idx'     },
  { key: 'fii_ls',      label: 'FII L/S'     },
  { key: 'dii_ls',      label: 'DII L/S'     },
  { key: 'total_oi',    label: 'Total OI'    },
  { key: 'fii_opt_net', label: 'FII Opt Net' },
  { key: 'dii_hedge',   label: 'DII Hedge×'  },
];

export function computeWeeklyHeatmap(data, weeks = 10) {
  const rows = [];
  for (let i = 5; i < data.length; i += 5) {
    if (rows.length >= weeks) break;
    const prev = data[i - 5];
    const curr = data[i];
    const row = { week: curr.date.slice(0, 10) };
    for (const { key } of HEATMAP_METRICS) {
      const p = prev[key];
      const c = curr[key];
      row[key] = p !== 0 ? parseFloat(((c - p) / Math.abs(p)) * 100) : 0;
    }
    rows.push(row);
  }
  return rows.reverse();
}

// ─── Formatter ────────────────────────────────────────────────────────────────
export function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return sign + (abs / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

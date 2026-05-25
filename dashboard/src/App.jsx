// src/App.jsx
import { useState, useMemo } from 'react';
import { useMarketData }    from './hooks/useMarketData.js';
import {
  sliceRange, computeSignals, computeWeeklyHeatmap, fmt,
} from './utils/metrics.js';

import Header          from './components/Header.jsx';
import RangeSelector   from './components/RangeSelector.jsx';
import MetricCard      from './components/MetricCard.jsx';
import ChartCard       from './components/ChartCard.jsx';
import SignalPanel     from './components/SignalPanel.jsx';
import FIIBiasChart    from './components/FIIBiasChart.jsx';
import PCRChart        from './components/PCRChart.jsx';
import LSRatioChart    from './components/LSRatioChart.jsx';
import DivergenceChart from './components/DivergenceChart.jsx';
import FIIOptionsChart from './components/FIIOptionsChart.jsx';
import OIMomentumChart from './components/OIMomentumChart.jsx';
import OIHeatmap       from './components/OIHeatmap.jsx';
import ConfigModal     from './components/ConfigModal.jsx';

// ── NEW TAB IMPORTS ──────────────────────────────────────────────────────────
import TabNav          from './components/TabNav.jsx';
import OptionsTab      from './components/OptionsTab.jsx';
import SmartMoneyTab   from './components/SmartMoneyTab.jsx';
import LSRatioTab      from './components/LSRatioTab.jsx';
import OIMomentumTab   from './components/OIMomentumTab.jsx';

const LEGEND = [
  ['#00e699', 'FII'],
  ['#00c8ff', 'DII'],
  ['#ffb300', 'Client / Amber'],
  ['#b87dff', 'Pro / Purple'],
];

function Legend({ items }) {
  return (
    <div className="chart-legend">
      {items.map(([color, label]) => (
        <div className="legend-item" key={label}>
          <div className="legend-dot" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const {
    data, status, error, lastUpdated,
    csvUrl, configOpen, setConfigOpen, saveUrl, refresh,
  } = useMarketData();

  const [rangeDays, setRangeDays] = useState(44);
  const [activeTab, setActiveTab] = useState('overview'); // ── NEW

  const sliced       = useMemo(() => sliceRange(data, rangeDays), [data, rangeDays]);
  const latest       = data[data.length - 1];
  const slicedLatest = sliced[sliced.length - 1] ?? null;  // ── NEW — latest within selected range
  const weekAgo      = data[Math.max(0, data.length - 6)];
  const signals      = useMemo(() => computeSignals(data),            [data]);
  const heatRows     = useMemo(() => computeWeeklyHeatmap(data, 10),  [data]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="loader-wrap">
        <div className="loader" />
        <span>FETCHING MARKET DATA…</span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="loader-wrap">
        <div style={{ color: 'var(--red)', fontSize: 28 }}>⚠</div>
        <span style={{ color: 'var(--red)' }}>Failed to load data</span>
        <span style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 520, textAlign: 'center' }}>
          {error}
        </span>
        <button className="btn btn-primary" onClick={() => setConfigOpen(true)}>
          ⚙ Configure CSV URL
        </button>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {configOpen && (
        <ConfigModal
          current={csvUrl}
          onSave={saveUrl}
          onClose={data.length ? () => setConfigOpen(false) : null}
        />
      )}

      <Header
        lastUpdated={lastUpdated}
        latestDate={latest?.date}
        refresh={refresh}
        setConfigOpen={setConfigOpen}
      />

      <RangeSelector
        active={rangeDays}
        onChange={setRangeDays}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
      />

      {/* ── TAB NAVIGATION ──────────────────────────────────────────────── */}
      <TabNav active={activeTab} onChange={setActiveTab} />

      {/* ══════════════════════════════════════════════════════════════════
          OVERVIEW TAB — all original content, zero changes
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div>
          {/* ── SIGNALS ─────────────────────────────────────────────────────── */}
          <div className="section-title">⚡ Market Intelligence Signals</div>
          <SignalPanel signals={signals} />

          {/* ── SUMMARY METRICS ROW 1 ────────────────────────────────────────── */}
          <div className="section-title">📊 Key Metrics — {latest?.date}</div>
          <div className="grid-5">
            <MetricCard
              label="FII Net Index Futures"
              value={latest?.fii_net_idx}
              sub="Contracts (long − short)"
              delta={latest?.fii_net_idx - (weekAgo?.fii_net_idx ?? 0)}
              accent={latest?.fii_net_idx >= 0 ? 'var(--green)' : 'var(--red)'}
            />
            <MetricCard
              label="PCR — Index Options"
              value={latest?.pcr_idx}
              sub=">1.2 fear · <0.7 greed"
              delta={latest?.pcr_idx - (weekAgo?.pcr_idx ?? 0)}
              accent="var(--purple)"
              isRatio
            />
            <MetricCard
              label="FII Long/Short Ratio"
              value={latest?.fii_ls}
              sub="Total long ÷ short"
              delta={latest?.fii_ls - (weekAgo?.fii_ls ?? 0)}
              accent="var(--green)"
              isRatio
            />
            <MetricCard
              label="DII Put Hedge Ratio"
              value={latest?.dii_hedge}
              sub="DII index put ÷ call long"
              delta={latest?.dii_hedge - (weekAgo?.dii_hedge ?? 0)}
              accent={latest?.dii_hedge > 5 ? 'var(--red)' : 'var(--cyan)'}
              isRatio
            />
            <MetricCard
              label="Total Market OI"
              value={latest?.total_oi}
              sub="All-participant longs sum"
              delta={latest?.total_oi - (weekAgo?.total_oi ?? 0)}
              accent="var(--amber)"
            />
          </div>

          {/* ── SUMMARY METRICS ROW 2 ────────────────────────────────────────── */}
          <div className="grid-5" style={{ marginTop: 10 }}>
            <MetricCard
              label="FII Net Stock Futures"
              value={latest?.fii_net_stk}
              sub="Stock futures net"
              accent={latest?.fii_net_stk >= 0 ? 'var(--green)' : 'var(--red)'}
            />
            <MetricCard
              label="DII Net Index Futures"
              value={latest?.dii_net_idx}
              sub="DII index futures net"
              accent="var(--cyan)"
            />
            <MetricCard
              label="FII – DII Divergence"
              value={latest?.fii_dii_div}
              sub="FII net − DII net (index)"
              accent={Math.abs(latest?.fii_dii_div ?? 0) > 100000 ? 'var(--amber)' : 'var(--text-2)'}
            />
            <MetricCard
              label="FII Options Net (C−P)"
              value={latest?.fii_opt_net}
              sub="FII index call − put long"
              accent={latest?.fii_opt_net >= 0 ? 'var(--green)' : 'var(--red)'}
            />
            <MetricCard
              label="PCR — Stock Options"
              value={latest?.pcr_stk}
              sub="Stock options put/call ratio"
              accent="var(--purple)"
              isRatio
            />
          </div>

          {/* ── FII BIAS + PCR ───────────────────────────────────────────────── */}
          <div className="section-title">📈 FII Positioning & PCR Trend</div>
          <div className="grid-2">
            <ChartCard
              title="FII FUTURES NET POSITION"
              subtitle="Index & stock futures net (long − short) · Above 0 = bullish bias"
            >
              <Legend items={[['#00e699','FII Net Index Fut'],['#00c8ff','FII Net Stock Fut']]} />
              <FIIBiasChart data={sliced} />
            </ChartCard>

            <ChartCard
              title="PUT / CALL RATIO (PCR)"
              subtitle="Shaded zones: red = fear (>1.2) · amber = greed (<0.7)"
            >
              <Legend items={[['#b87dff','Index PCR'],['#00c8ff','Stock PCR'],['#ffb300','FII PCR']]} />
              <PCRChart data={sliced} />
            </ChartCard>
          </div>

          {/* ── L/S RATIO + DIVERGENCE ───────────────────────────────────────── */}
          <div className="section-title">⚖ Long/Short Ratios & FII–DII Divergence</div>
          <div className="grid-2">
            <ChartCard
              title="PARTICIPANT LONG / SHORT RATIO"
              subtitle="Ratio >1 = net long · <1 = net short · Fade Client extremes — follow FII"
            >
              <Legend items={[['#00e699','FII'],['#00c8ff','DII'],['#ffb300','Client'],['#b87dff','Pro']]} />
              <LSRatioChart data={sliced} />
            </ChartCard>

            <ChartCard
              title="FII vs DII DIVERGENCE"
              subtitle="Bars = FII−DII net index gap · Wide gap = contrarian watch signal"
            >
              <Legend items={[['#00e699','Positive gap'],['#ff3d5e','Negative gap'],['#00c8ff','DII Net line']]} />
              <DivergenceChart data={sliced} />
            </ChartCard>
          </div>

          {/* ── FII OPTIONS + OI MOMENTUM ────────────────────────────────────── */}
          <div className="section-title">🔍 FII Options Positioning & OI Momentum</div>
          <div className="grid-2">
            <ChartCard
              title="FII OPTIONS — CALL vs PUT LONG"
              subtitle="Line = net call − put (index) · Positive = FII bullish via options"
            >
              <Legend items={[['#00e699','FII Call Long'],['#ff3d5e','FII Put Long'],['#ffb300','Net C−P']]} />
              <FIIOptionsChart data={sliced} />
            </ChartCard>

            <ChartCard
              title="TOTAL OI & DAILY MOMENTUM"
              subtitle="Bars = day-on-day OI Δ · Line = total OI level · Spike near expiry = sharp move"
            >
              <Legend items={[['#00e699','OI Added'],['#ff3d5e','OI Shed'],['#00c8ff','Total OI level']]} />
              <OIMomentumChart data={sliced} />
            </ChartCard>
          </div>

          {/* ── WEEKLY OI HEATMAP ────────────────────────────────────────────── */}
          <div className="section-title">🗓 Weekly OI Shift Heatmap</div>
          <div className="card">
            <div className="card-title">Week-on-week % change across 9 key metrics</div>
            <div className="card-subtitle">
              Deep green = strong expansion · Deep red = strong contraction ·
              Colour intensity = magnitude of move
            </div>
            <OIHeatmap rows={heatRows} />
          </div>

          {/* ── READING GUIDE ────────────────────────────────────────────────── */}
          <div className="section-title">📖 Signal Interpretation Guide</div>
          <div className="grid-3">
            {[
              {
                title: '▲ FII Long Bias → Bullish',
                color: 'var(--green)',
                text: 'FII net index futures > 0 means large foreign institutions are positioned long. This is the single strongest directional signal — price statistically follows FII index futures positioning.',
              },
              {
                title: '😨 PCR > 1.2 → Fear & Potential Reversal Up',
                color: 'var(--red)',
                text: 'Extreme put buying signals hedging / panic. Contrarian signal — heavy put activity near key support often marks short-term bottoms. Monitor for put unwinding as a buy signal.',
              },
              {
                title: '🔥 PCR < 0.7 → Complacency Warning',
                color: 'var(--amber)',
                text: 'Call-dominant market suggests overconfidence. Sellers of calls may get squeezed, but pure directional longs should tighten stops. Best used with FII net position for confirmation.',
              },
              {
                title: '⚡ FII ≠ DII → Divergence Trade',
                color: 'var(--cyan)',
                text: 'When FII and DII take opposite stances on index futures, watch for the weaker hand to capitulate. Historically FII is directionally correct; DII hedges aggressively before large macro moves.',
              },
              {
                title: '🛡 DII Put Spike → Risk-Off Environment',
                color: 'var(--purple)',
                text: 'DII (mutual funds, insurance) buying index puts signals institutional-grade hedging. A ratio > 5× means they\'re paying premium for downside protection — treat as a caution flag.',
              },
              {
                title: '📈 OI Build + FII Long → Conviction Move',
                color: 'var(--amber)',
                text: 'Rising OI with FII adding index longs confirms trend strength. OI spike near weekly/monthly expiry with net short-covering often triggers 1–3% intraday momentum moves. Watch for OI shedding as a reversal cue.',
              },
            ].map((card, i) => (
              <div className="card" key={i}>
                <div className="card-accent" style={{ background: card.color }} />
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  fontWeight: 600, color: card.color, marginBottom: 6,
                }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>
                  {card.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          NEW TABS — each receives the range-filtered slice + latest row
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'options' && (
        <OptionsTab data={sliced} latest={slicedLatest} />
      )}

      {activeTab === 'smartmoney' && (
        <SmartMoneyTab data={sliced} latest={slicedLatest} />
      )}

      {activeTab === 'lsratio' && (
        <LSRatioTab data={sliced} latest={slicedLatest} />
      )}

      {activeTab === 'oimomentum' && (
        <OIMomentumTab data={sliced} latest={slicedLatest} />
      )}

      <footer className="footer">
        NSE PARTICIPANT OI DASHBOARD · DATA SOURCED FROM NSE INDIA ·
        BUILT WITH REACT + RECHARTS · NOT INVESTMENT ADVICE
      </footer>
    </div>
  );
}

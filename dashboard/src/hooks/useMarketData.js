// src/hooks/useMarketData.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches the PRE-COMPUTED nse_oi_dashboard.csv from GitHub raw URL.
// No data transformation here — just fetch → Papa.parse → parseRow → done.
// URL is stored in localStorage so users only type it once.
// Auto-refreshes every 60 min so an open browser tab always shows latest data.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { parseRow } from '../utils/metrics.js';

const LS_KEY = 'nse_dashboard_csv_url';

export function useMarketData() {
  const [csvUrl, setCsvUrl]           = useState('');
  const [data, setData]               = useState([]);
  const [status, setStatus]           = useState('idle');   // idle|loading|ok|error
  const [error, setError]             = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [configOpen, setConfigOpen]   = useState(false);
  const timerRef = useRef(null);

  // ── 1. On mount: load saved URL or open config modal ───────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      setCsvUrl(saved);
      return;
    }
    // Fall back to public/config.json (pre-filled at build time)
    fetch('./config.json')
      .then(r => r.json())
      .then(cfg => {
        const url = cfg.csvUrl ?? '';
        if (!url || url.includes('YOUR_GITHUB_USERNAME')) {
          setConfigOpen(true);
        } else {
          setCsvUrl(url);
        }
      })
      .catch(() => setConfigOpen(true));
  }, []);

  // ── 2. Fetch + parse whenever URL changes ───────────────────────────────────
  const fetchData = useCallback(async (url) => {
    if (!url) return;
    setStatus('loading');
    setError('');
    try {
      // Cache-bust so browser doesn't serve a stale file
      const resp = await fetch(`${url}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${resp.statusText}`);
      const text = await resp.text();

      const { data: rows, errors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,   // we type ourselves in parseRow
      });

      if (errors.length && !rows.length) {
        throw new Error(`CSV parse error: ${errors[0]?.message}`);
      }
      if (!rows.length) throw new Error('CSV parsed but contains no data rows.');

      // Validate expected columns exist
      const firstRow = rows[0];
      if (!('fii_net_idx' in firstRow)) {
        throw new Error(
          'CSV does not look like a processed dashboard file. ' +
          'Run process_nse_data.py first, then push nse_oi_dashboard.csv to GitHub.'
        );
      }

      const processed = rows.map(parseRow).filter(r => r.date);
      processed.sort((a, b) => a.date.localeCompare(b.date));

      setData(processed);
      setStatus('ok');
      setLastUpdated(new Date());
    } catch (err) {
      setStatus('error');
      setError(err.message ?? 'Unknown error');
    }
  }, []);

  // Trigger on URL change + set up auto-refresh timer
  useEffect(() => {
    if (!csvUrl) return;
    fetchData(csvUrl);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchData(csvUrl), 60 * 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, [csvUrl, fetchData]);

  // ── 3. Save URL from ConfigModal ────────────────────────────────────────────
  const saveUrl = useCallback((url) => {
    const trimmed = url.trim();
    localStorage.setItem(LS_KEY, trimmed);
    setCsvUrl(trimmed);
    setConfigOpen(false);
  }, []);

  return {
    data,
    status,
    error,
    lastUpdated,
    csvUrl,
    configOpen,
    setConfigOpen,
    saveUrl,
    refresh: () => fetchData(csvUrl),
  };
}

// src/components/Header.jsx
export default function Header({ lastUpdated, latestDate, refresh, setConfigOpen }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">NSE<span>·</span>OI DASHBOARD</div>
        <div className="live-badge"><div className="dot" /> LIVE</div>
      </div>

      <div className="header-right">
        {latestDate && (
          <div className="header-meta">
            DATA AS OF&nbsp;<strong>{latestDate}</strong>
          </div>
        )}
        {lastUpdated && (
          <div className="header-meta">
            REFRESHED&nbsp;<strong>{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
        )}
        <div className="header-meta">IST&nbsp;<strong>{timeStr}</strong></div>
        <button className="refresh-btn" onClick={refresh} title="Force refresh">
          ↻ Refresh
        </button>
        <button className="refresh-btn" onClick={() => setConfigOpen(true)} title="Configure CSV URL">
          ⚙ Config
        </button>
      </div>
    </header>
  );
}

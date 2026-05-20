// src/components/SignalPanel.jsx
export default function SignalPanel({ signals }) {
  if (!signals?.length) return null;
  return (
    <div className="signals-grid">
      {signals.map((s, i) => (
        <div key={i} className={`signal-chip ${s.type}`}>
          <div className="signal-icon">{s.icon}</div>
          <div>
            <div className="signal-label">{s.label}</div>
            <div className="signal-desc">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

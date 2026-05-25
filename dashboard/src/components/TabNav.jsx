// src/components/TabNav.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tab navigation bar — sits between the RangeSelector and content.
// Styled to match existing .range-btn / .range-bar patterns from index.css.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',    label: '⬡ Overview'           },
  { id: 'options',     label: '◈ Options Intelligence' },
  { id: 'smartmoney',  label: '◎ Smart Money Engine'  },
  { id: 'lsratio',     label: '⇅ L/S Ratio Deep Dive' },
  { id: 'oimomentum',  label: '◉ OI Momentum'         },
];

export default function TabNav({ active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginBottom: 18,
      borderBottom: '1px solid var(--border)',
      paddingBottom: 12,
      flexWrap: 'wrap',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="range-btn"
          style={{
            background:   active === t.id ? 'rgba(0,200,255,0.08)'  : 'transparent',
            borderColor:  active === t.id ? 'var(--cyan)'            : 'var(--border)',
            color:        active === t.id ? 'var(--cyan)'            : 'var(--text-3)',
            letterSpacing: '0.06em',
            fontSize: 11,
            padding: '5px 14px',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

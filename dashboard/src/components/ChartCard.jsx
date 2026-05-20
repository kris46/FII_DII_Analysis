// src/components/ChartCard.jsx
export default function ChartCard({ title, subtitle, children, style }) {
  return (
    <div className="card" style={style}>
      {title && <div className="card-title">{title}</div>}
      {subtitle && <div className="card-subtitle">{subtitle}</div>}
      {children}
    </div>
  );
}

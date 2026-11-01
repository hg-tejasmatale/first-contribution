export default function StatsBar({ stats }) {
  if (!stats) return null;
  const items = [
    ["Total", stats.total],
    ["To do", stats.todo],
    ["In progress", stats.in_progress],
    ["Done", stats.done],
    ["Overdue", stats.overdue],
  ];
  return (
    <div className="stats">
      {items.map(([label, value]) => (
        <div className={`card stat ${label === "Overdue" && value > 0 ? "alert" : ""}`} key={label}>
          <div className="stat-value">{value}</div>
          <div className="muted small">{label}</div>
        </div>
      ))}
      <div className="card stat">
        <div className="stat-value">{stats.completion_rate}%</div>
        <div className="muted small">Complete</div>
      </div>
    </div>
  );
}

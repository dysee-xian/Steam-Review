function StatCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className={`dashboard-stat-card stat-card ${tone ?? ""}`}>
      <span className="stat-card-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <div className="stat-card-content">
        <p className="dashboard-stat-label">{label}</p>
        <p className="dashboard-stat-value">{value}</p>
        <p className="dashboard-stat-note">{note}</p>
      </div>
    </article>
  );
}

export default StatCard;

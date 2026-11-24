function ChartCard({ id, title, description, aside, children, className = "" }) {
  return (
    <article
      className={`dashboard-panel chart-card ${className}`.trim()}
      aria-labelledby={id}
    >
      <header className="dashboard-panel-heading">
        <div>
          <h3 id={id}>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </article>
  );
}

export default ChartCard;

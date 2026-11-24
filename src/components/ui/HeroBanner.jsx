function HeroBanner({ label, title, description, aside }) {
  return (
    <section
      className={`hero-banner${aside ? " has-aside" : ""}`}
      aria-labelledby="hero-banner-title"
    >
      <div className="hero-banner-content">
        <p className="hero-banner-label">{label}</p>
        <h2 id="hero-banner-title">{title}</h2>
        <p className="hero-banner-description">{description}</p>
      </div>
      {aside && <div className="hero-banner-aside">{aside}</div>}
    </section>
  );
}

export default HeroBanner;

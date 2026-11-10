function PagePlaceholder({ title }) {
  return (
    <section
      className="page-placeholder"
      aria-labelledby="page-placeholder-title"
    >
      <p className="eyebrow">Steam Review Analytics</p>
      <h2 id="page-placeholder-title">{title}</h2>
      <p>
        Kerangka halaman ini sudah tersedia. Konten dan data belum
        diintegrasikan.
      </p>
    </section>
  );
}

export default PagePlaceholder;

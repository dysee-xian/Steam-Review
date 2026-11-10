const researchStages = [
  "Teks ulasan Steam",
  "Aspect-Based Sentiment Analysis (ABSA)",
  "Ekstraksi fitur aspek",
  "Model Machine Learning regresi",
  "Prediksi tambahan durasi bermain",
];

const evaluationMetrics = [
  { label: "MAE", value: "5.035,64", unit: "menit" },
  { label: "RMSE", value: "23.579,22", unit: "menit" },
  { label: "R²", value: "-0,03345", unit: null },
];

function PlaytimePrediction() {
  return (
    <div className="playtime-page">
      <header className="playtime-page-heading">
        <div>
          <p className="eyebrow">Penelitian DPRF</p>
          <h2>Playtime Prediction</h2>
          <p className="playtime-page-description">
            Penelitian ini bertujuan memperkirakan tambahan durasi bermain
            yang tercatat setelah ulasan Steam ditulis.
          </p>
        </div>
        <span className="playtime-status">Prediksi langsung belum tersedia</span>
      </header>

      <section
        className="playtime-section playtime-target"
        aria-labelledby="playtime-target-title"
      >
        <div>
          <p className="playtime-overline">Target penelitian</p>
          <h3 id="playtime-target-title">Tambahan durasi setelah ulasan</h3>
          <p>
            Nilai target mengukur selisih antara total playtime dan playtime
            saat ulasan diberikan, dengan nilai minimum nol.
          </p>
        </div>
        <code className="playtime-formula">
          playtime_after_review = max(playtime_forever - playtime_at_review, 0)
        </code>
        <p className="playtime-unit-note">
          Satuan target dan prediksi yang direncanakan adalah menit.
        </p>
      </section>

      <section
        className="playtime-section"
        aria-labelledby="playtime-flow-title"
      >
        <div className="playtime-section-heading">
          <div>
            <h3 id="playtime-flow-title">Alur konseptual penelitian</h3>
            <p>
              Tahapan rancangan penelitian, bukan pipeline aktif di aplikasi.
            </p>
          </div>
        </div>
        <ol className="playtime-flow">
          {researchStages.map((stage, index) => (
            <li className="playtime-flow-step" key={stage}>
              <span className="playtime-flow-number">{index + 1}</span>
              <span>{stage}</span>
            </li>
          ))}
        </ol>
        <p className="playtime-flow-note">
          ABSA dan ekstraksi fitur aspek belum tersedia sebagai pipeline yang
          terintegrasi dengan model.
        </p>
      </section>

      <section
        className="playtime-section"
        aria-labelledby="playtime-metrics-title"
      >
        <div className="playtime-section-heading">
          <div>
            <h3 id="playtime-metrics-title">Metrik evaluasi historis</h3>
            <p>
              Angka eksperimen LightGBM Regressor yang tercatat dalam
              dokumentasi proyek.
            </p>
          </div>
        </div>
        <div className="playtime-metric-grid">
          {evaluationMetrics.map((metric) => (
            <article className="playtime-metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              {metric.unit && <span>{metric.unit}</span>}
            </article>
          ))}
        </div>
        <aside className="playtime-metric-caveat">
          Metrik ini merupakan hasil eksperimen yang tercatat dalam
          dokumentasi dan belum dapat diverifikasi ulang dari artefak proyek
          saat ini. Nilai R² negatif menunjukkan bahwa performa model pada
          evaluasi tersebut belum baik; model belum layak dianggap optimal.
        </aside>
      </section>

      <section className="playtime-availability" role="status">
        <span className="playtime-availability-indicator" aria-hidden="true" />
        <div>
          <h3>Model belum tersedia untuk prediksi langsung</h3>
          <p>
            File model terlatih, dataset lokal untuk menjalankan dan menguji
            prediksi, serta endpoint backend yang berfungsi belum tersedia
            dalam proyek. Halaman ini hanya menyajikan konteks penelitian dan
            metrik historis, bukan hasil prediksi.
          </p>
        </div>
      </section>
    </div>
  );
}

export default PlaytimePrediction;

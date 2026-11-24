import { useEffect, useMemo, useState } from "react";
import { getEngagementBatchAnalysis } from "../services/api";
import HeroBanner from "../components/ui/HeroBanner";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});

function formatMetric(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter.format(value)
    : "—";
}

function getMetricLabel(name) {
  const labels = {
    accuracy: "Akurasi",
    balanced_accuracy: "Akurasi seimbang",
    roc_auc: "Kemampuan membedakan kelas (ROC AUC)",
  };
  return labels[name] ?? name.replace(/_/g, " ");
}

function EngagementDeclinePrediction() {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      setStatus("loading");
      try {
        const result = await getEngagementBatchAnalysis();
        if (active) {
          setAnalysis(result);
          setStatus("success");
        }
      } catch {
        if (active) {
          setStatus("error");
        }
      }
    }

    loadAnalysis();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const model = analysis?.model_configuration;
  const evaluationMetrics = useMemo(
    () =>
      Object.entries(analysis?.evaluation_metrics ?? {}).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value),
      ),
    [analysis],
  );

  return (
    <div className="playtime-page">
      <HeroBanner
        label="PREDIKSI KETERLIBATAN"
        title="Risiko Penurunan Keterlibatan Pemain"
        description="Model ini memperkirakan kemungkinan aktivitas pemain menurun. Prediksi hanya ditampilkan jika data pemain cukup untuk dianalisis."
        aside={<span className="playtime-status">Analisis otomatis</span>}
      />

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Menyiapkan ringkasan analisis...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Ringkasan analisis gagal dimuat</h3>
            <p>
              Informasi analisis belum dapat dimuat. Silakan coba beberapa saat
              lagi.
            </p>
          </div>
          <button
            className="dashboard-retry"
            onClick={() => setReloadKey((key) => key + 1)}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="dashboard-empty" role="status">
            {analysis.analysis_status === "blocked"
              ? "Belum ada hasil prediksi per pemain. Data yang tersedia belum cukup untuk menyusun seluruh indikator aktivitas yang diperlukan, sehingga model tidak dijalankan dan angka prediksi tidak ditampilkan."
              : "Status prediksi belum tersedia."}
          </div>
          {analysis.firebase_error && (
            <div className="dashboard-error" role="alert">
              <div>
                <h3>Ringkasan pendukung belum tersedia</h3>
                <p>
                  Informasi evaluasi model tidak dapat dimuat saat ini. Status
                  prediksi tetap ditampilkan tanpa membuat angka pengganti.
                </p>
              </div>
            </div>
          )}

          <section
            className="dashboard-stat-grid"
            aria-label="Ringkasan prediksi keterlibatan"
          >
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Pemain yang diprediksi</p>
              <p className="dashboard-stat-value">—</p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Keterlibatan menurun</p>
              <p className="dashboard-stat-value">—</p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Persentase keterlibatan menurun
              </p>
              <p className="dashboard-stat-value">—</p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Keterlibatan tidak menurun
              </p>
              <p className="dashboard-stat-value">—</p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Persentase keterlibatan tidak menurun
              </p>
              <p className="dashboard-stat-value">—</p>
            </article>
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="engagement-distribution-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="engagement-distribution-title">
                  Hasil menurut tingkat keterlibatan
                </h3>
                <p>
                  Perbandingan jumlah pemain pada setiap kategori akan muncul
                  setelah data analisis tersedia.
                </p>
              </div>
            </div>
            <div className="dashboard-empty" role="status">
              Belum ada hasil untuk divisualisasikan.
            </div>
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="engagement-players-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="engagement-players-title">Ringkasan pemain</h3>
                <p>
                  Rincian pemain hanya akan ditampilkan jika tersedia data
                  aktivitas yang lengkap.
                </p>
              </div>
            </div>
            <div className="dashboard-empty" role="status">
              Belum ada rincian pemain yang dapat ditampilkan.
            </div>
          </section>

          {model && (
            <section
              className="playtime-section"
              aria-labelledby="engagement-model-title"
            >
              <div className="playtime-section-heading">
                <div>
                  <h3 id="engagement-model-title">Tentang metode analisis</h3>
                  <p>
                    Model menggunakan gradient boosting untuk mempelajari pola
                    aktivitas. Batas keputusan saat ini mengikuti pengaturan
                    yang telah ditetapkan.
                  </p>
                </div>
              </div>
              <dl className="analysis-result-grid">
                <div>
                  <dt>Metode</dt>
                  <dd>Gradient boosting berbasis histogram</dd>
                </div>
                <div>
                  <dt>Batas keputusan</dt>
                  <dd>
                    {typeof model.threshold === "number" &&
                    Number.isFinite(model.threshold)
                      ? `${formatMetric(model.threshold * 100)}%`
                      : "—"}
                  </dd>
                </div>
                {Object.entries(model.class_labels ?? {}).map(
                  ([classId, label]) => (
                    <div key={classId}>
                      <dt>Kategori {classId}</dt>
                      <dd>{label}</dd>
                    </div>
                  ),
                )}
              </dl>
              <div className="sentiment-section-heading">
                <div>
                  <h3>Metrik evaluasi tersimpan</h3>
                  <p>
                    Nilai berikut mengukur kinerja model pada evaluasi
                    sebelumnya; nilai tersebut bukan jumlah prediksi saat ini.
                  </p>
                </div>
              </div>
              {evaluationMetrics.length > 0 ? (
                <div className="playtime-metric-grid">
                  {evaluationMetrics.map(([name, value]) => (
                    <article className="playtime-metric-card" key={name}>
                      <p>{getMetricLabel(name)}</p>
                      <strong>{formatMetric(value)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty" role="status">
                  Metrik evaluasi belum tersedia.
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default EngagementDeclinePrediction;

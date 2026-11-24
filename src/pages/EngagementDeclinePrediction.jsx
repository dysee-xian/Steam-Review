import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleCheck,
  CircleX,
  Users,
} from "lucide-react";
import { getEngagementBatchAnalysis } from "../services/api";
import HeroBanner from "../components/ui/HeroBanner";
import ChartCard from "../components/ui/ChartCard";
import StatCard from "../components/ui/StatCard";

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
            className="dashboard-stat-grid engagement-stats-grid"
            aria-label="Ringkasan prediksi keterlibatan"
          >
            <StatCard
              icon={Users}
              label="Pemain yang diprediksi"
              value="—"
              note="Prediksi batch belum tersedia"
              tone="tone-blue"
            />
            <StatCard
              icon={Activity}
              label="Keterlibatan menurun"
              value="—"
              note="Belum dapat dihitung"
              tone="tone-orange"
            />
            <StatCard
              icon={Activity}
              label="Persentase menurun"
              value="—"
              note="Belum dapat dihitung"
              tone="tone-orange"
            />
            <StatCard
              icon={CircleCheck}
              label="Tidak menurun"
              value="—"
              note="Belum dapat dihitung"
              tone="tone-teal"
            />
            <StatCard
              icon={CircleX}
              label="Persentase tidak menurun"
              value="—"
              note="Belum dapat dihitung"
              tone="tone-rose"
            />
          </section>

          <ChartCard
            id="engagement-distribution-title"
            title="Hasil menurut tingkat keterlibatan"
            description="Distribusi hasil akan tersedia setelah fitur pemain yang diperlukan dapat dibentuk dari sumber data."
          >
            <div className="dashboard-empty" role="status">
              Belum ada prediksi per pemain untuk divisualisasikan.
            </div>
          </ChartCard>

          <ChartCard
            id="engagement-players-title"
            title="Hasil analisis pemain"
            description="Rincian hanya ditampilkan jika seluruh data aktivitas yang diperlukan tersedia."
          >
            <div className="dashboard-empty" role="status">
              Belum ada rincian hasil prediksi pemain.
            </div>
          </ChartCard>

          {model && (
            <ChartCard
              id="engagement-model-title"
              title="Tentang metode analisis"
              description="Model menggunakan gradient boosting untuk mempelajari pola aktivitas. Batas keputusan mengikuti konfigurasi model."
            >
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
              <div className="engagement-evaluation-heading">
                <h3>Metrik evaluasi tersimpan</h3>
                <p>
                  Metrik ini mengukur kinerja model saat evaluasi sebelumnya,
                  bukan jumlah prediksi pemain saat ini.
                </p>
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
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}

export default EngagementDeclinePrediction;

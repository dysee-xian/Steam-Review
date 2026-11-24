import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardSummary } from "../services/dashboardService";
import { analyzeSentiment } from "../services/api";
import {
  chartAxis,
  chartCursorStyle,
  chartGridColor,
  chartTooltipStyle,
  sentimentColors,
} from "../components/chartTheme";
import HeroBanner from "../components/ui/HeroBanner";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value) {
  return isFiniteNumber(value) ? numberFormatter.format(value) : "—";
}

function formatPercentage(value) {
  return isFiniteNumber(value)
    ? `${numberFormatter.format(value)}%`
    : "—";
}

function formatSentimentLabel(label) {
  if (label === "POSITIVE") return "Positif";
  if (label === "NEGATIVE") return "Negatif";
  return label ?? "—";
}

function SentimentAnalysis() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [review, setReview] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [analysisError, setAnalysisError] = useState("");

  async function handleAnalyzeReview(event) {
    event.preventDefault();
    const submittedReview = review.trim();
    if (!submittedReview) {
      setAnalysisError("Masukkan teks ulasan sebelum menjalankan analisis.");
      setAnalysisStatus("error");
      setAnalysis(null);
      return;
    }

    setAnalysis(null);
    setAnalysisError("");
    setAnalysisStatus("loading");
    try {
      const result = await analyzeSentiment(submittedReview);
      setAnalysis(result);
      setAnalysisStatus("success");
    } catch {
      setAnalysisError(
        "Ulasan belum dapat dianalisis saat ini. Silakan coba kembali.",
      );
      setAnalysisStatus("error");
    }
  }

  useEffect(() => {
    let active = true;

    async function loadSentiment() {
      setStatus("loading");

      try {
        const data = await getDashboardSummary();
        if (active) {
          setSummary(data);
          setStatus("success");
        }
      } catch {
        if (active) {
          setStatus("error");
        }
      }
    }

    loadSentiment();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const distribution = summary?.distribution;
  const chartData = useMemo(() => {
    if (!distribution || typeof distribution !== "object") {
      return [];
    }

    return [
      {
        sentiment: "Positif",
        sentimentKey: "POSITIVE",
        reviews: distribution.POSITIVE,
      },
      {
        sentiment: "Negatif",
        sentimentKey: "NEGATIVE",
        reviews: distribution.NEGATIVE,
      },
    ].filter((item) => isFiniteNumber(item.reviews));
  }, [distribution]);
  const hasAnyData =
    isFiniteNumber(summary?.total_reviews_analyzed) ||
    chartData.length > 0 ||
    isFiniteNumber(summary?.positive_percentage) ||
    isFiniteNumber(summary?.negative_percentage);

  return (
    <div className="sentiment-page">
      <HeroBanner
        label="ANALISIS SENTIMEN"
        title="Memahami Tanggapan Pemain"
        description="Analisis sentimen mengelompokkan ulasan menjadi tanggapan positif dan negatif. Ringkasan ini membantu melihat kecenderungan respons pemain terhadap game."
      />

      <section className="sentiment-section" aria-labelledby="sentiment-api-title">
        <div className="sentiment-section-heading">
          <div>
            <h3 id="sentiment-api-title">Analisis satu ulasan</h3>
            <p>
              Periksa nada sebuah ulasan secara langsung. Hasil menunjukkan
              kategori sentimen dan tingkat keyakinan analisis.
            </p>
          </div>
        </div>
        <form className="analysis-form" onSubmit={handleAnalyzeReview}>
          <label className="analysis-form-field" htmlFor="sentiment-review">
            Teks ulasan
            <textarea
              id="sentiment-review"
              onChange={(event) => setReview(event.target.value)}
              placeholder="Masukkan ulasan yang ingin dianalisis"
              required
              value={review}
            />
          </label>
          <button
            className="analysis-submit"
            disabled={analysisStatus === "loading"}
            type="submit"
          >
            {analysisStatus === "loading"
              ? "Menganalisis..."
              : "Analisis ulasan"}
          </button>
        </form>

        {analysisStatus === "loading" && (
          <div className="dashboard-state" role="status" aria-live="polite">
            <span className="loading-indicator" aria-hidden="true" />
            <span>Ulasan sedang dianalisis...</span>
          </div>
        )}
        {analysisStatus === "error" && (
          <div className="dashboard-error" role="alert">
            <div>
              <h3>Analisis sentimen gagal</h3>
              <p>{analysisError}</p>
            </div>
          </div>
        )}
        {analysisStatus === "success" && analysis && (
          <dl className="analysis-result-grid" aria-live="polite">
            <div>
              <dt>Sentimen</dt>
              <dd>{formatSentimentLabel(analysis.label)}</dd>
            </div>
            <div>
              <dt>Tingkat keyakinan</dt>
              <dd>{formatNumber(analysis.score)}</dd>
            </div>
          </dl>
        )}
      </section>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat ringkasan sentimen...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data sentimen gagal dimuat</h3>
            <p>
              Ringkasan sentimen belum dapat dimuat. Silakan coba kembali.
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

      {status === "success" && !hasAnyData && (
        <div className="dashboard-empty" role="status">
          Belum ada ringkasan sentimen yang dapat ditampilkan.
        </div>
      )}

      {status === "success" && hasAnyData && (
        <>
          <section className="dashboard-stat-grid" aria-label="Metrik sentimen">
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Ulasan dianalisis</p>
              <p className="dashboard-stat-value">
                {formatNumber(summary?.total_reviews_analyzed)}
              </p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Sentimen positif</p>
              <p className="dashboard-stat-value">
                {formatPercentage(summary?.positive_percentage)}
              </p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Sentimen negatif</p>
              <p className="dashboard-stat-value">
                {formatPercentage(summary?.negative_percentage)}
              </p>
            </article>
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="sentiment-distribution-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="sentiment-distribution-title">
                  Jumlah ulasan berdasarkan sentimen
                </h3>
                <p>
                  Nilai positif dan negatif ditampilkan sebagai agregat dataset,
                  bukan per persona.
                </p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="sentiment-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      stroke={chartGridColor}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="sentiment" tick={chartAxis} />
                    <YAxis
                      allowDecimals={false}
                      tickFormatter={formatNumber}
                      tick={chartAxis}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={chartCursorStyle}
                      formatter={(value) => [formatNumber(value), "Ulasan"]}
                    />
                    <Bar
                      dataKey="reviews"
                      name="Ulasan"
                      radius={[5, 5, 0, 0]}
                    >
                      {chartData.map((item) => (
                        <Cell
                          key={item.sentimentKey}
                          fill={sentimentColors[item.sentimentKey]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="sentiment-empty">
                Distribusi jumlah ulasan belum tersedia.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default SentimentAnalysis;

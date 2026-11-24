import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAbsaSummary } from "../services/absaService";
import { analyzeAspects } from "../services/api";
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

function ABSAAnalysis() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedAspect, setSelectedAspect] = useState("all");
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
      const result = await analyzeAspects(submittedReview);
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

    async function loadAbsa() {
      setStatus("loading");

      try {
        const data = await getAbsaSummary();
        if (active) {
          setRows(data);
          setSelectedAspect("all");
          setStatus("success");
        }
      } catch {
        if (active) {
          setStatus("error");
        }
      }
    }

    loadAbsa();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const aspects = useMemo(
    () =>
      rows
        .map((row) => row.aspect)
        .filter((aspect) => typeof aspect === "string" && aspect.trim()),
    [rows],
  );
  const visibleRows =
    selectedAspect === "all"
      ? rows
      : rows.filter((row) => row.aspect === selectedAspect);
  const chartData = visibleRows
    .filter((row) => typeof row.aspect === "string")
    .map((row) => ({
      aspect: row.aspect,
      positive: row.positive,
      negative: row.negative,
    }));
  const matchedAspects = Array.isArray(analysis?.aspects)
    ? analysis.aspects
    : [];

  return (
    <div className="sentiment-page">
      <HeroBanner
        label="ANALISIS ASPEK (ABSA)"
        title="Memahami Sentimen di Setiap Aspek Game"
        description="Aspect-Based Sentiment Analysis (ABSA) membantu melihat tanggapan pemain pada gameplay, grafis, cerita, performa, dan multiplayer. Informasi ini membantu menemukan aspek game yang paling sering mendapat respons positif maupun negatif."
        aside={
          status === "success" && (
            <label className="absa-filter">
              <span>Filter aspek</span>
              <select
                value={selectedAspect}
                onChange={(event) => setSelectedAspect(event.target.value)}
              >
                <option value="all">Semua aspek</option>
                {aspects.map((aspect) => (
                  <option key={aspect} value={aspect}>
                    {aspect}
                  </option>
                ))}
              </select>
            </label>
          )
        }
      />

      <section className="sentiment-section" aria-labelledby="absa-api-title">
        <div className="sentiment-section-heading">
          <div>
            <h3 id="absa-api-title">Tinjau satu ulasan</h3>
            <p>
              Aspek dikenali dari istilah yang muncul dalam teks. Sentimen yang
              ditampilkan menggambarkan keseluruhan ulasan, bukan penilaian
              terpisah untuk setiap kalimat.
            </p>
          </div>
        </div>
        <form className="analysis-form" onSubmit={handleAnalyzeReview}>
          <label className="analysis-form-field" htmlFor="absa-review">
            Teks ulasan
            <textarea
              id="absa-review"
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
            <span>Ulasan sedang ditinjau...</span>
          </div>
        )}
        {analysisStatus === "error" && (
          <div className="dashboard-error" role="alert">
            <div>
              <h3>Analisis ABSA gagal</h3>
              <p>{analysisError}</p>
            </div>
          </div>
        )}
        {analysisStatus === "success" && analysis && (
          <div className="analysis-result">
            <dl className="analysis-result-grid" aria-live="polite">
              <div>
                <dt>Sentimen seluruh ulasan</dt>
                <dd>{formatSentimentLabel(analysis.review_sentiment)}</dd>
              </div>
              <div>
                <dt>Skor model</dt>
                <dd>{formatNumber(analysis.review_sentiment_score)}</dd>
              </div>
              <div>
                <dt>Cakupan sentimen</dt>
                <dd>
                  {analysis.sentiment_scope === "entire_review"
                    ? "Seluruh ulasan"
                    : "—"}
                </dd>
              </div>
            </dl>
            {matchedAspects.length === 0 ? (
              <div className="dashboard-empty" role="status">
                Tidak ada keyword aspek yang cocok pada ulasan ini.
              </div>
            ) : (
              <div className="analysis-aspect-list">
                {matchedAspects.map((aspect) => (
                  <article
                    className="analysis-aspect-card"
                    key={aspect.aspect}
                  >
                    <h4>{aspect.aspect}</h4>
                    <p>
                      Istilah yang ditemukan:{" "}
                      {aspect.matched_keywords.join(", ")}
                    </p>
                    <p>
                      Sentimen ulasan:{" "}
                      {formatSentimentLabel(aspect.review_sentiment)} (
                      {formatNumber(aspect.score)})
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat ringkasan aspek...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data ABSA gagal dimuat</h3>
            <p>
              Ringkasan aspek belum dapat dimuat. Silakan coba kembali.
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

      {status === "success" && rows.length === 0 && (
        <div className="dashboard-empty" role="status">
          Ringkasan tanggapan per aspek belum tersedia.
        </div>
      )}

      {status === "success" && rows.length > 0 && (
        <>
          <section className="dashboard-stat-grid" aria-label="Metrik ABSA">
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Jumlah aspek</p>
              <p className="dashboard-stat-value">{formatNumber(rows.length)}</p>
            </article>
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="absa-chart-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="absa-chart-title">Tanggapan positif dan negatif</h3>
                <p>
                  Perbandingan jumlah ulasan positif dan negatif untuk setiap
                  aspek game.
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
                    <XAxis dataKey="aspect" tick={chartAxis} />
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
                    <Legend />
                    <Bar
                      dataKey="positive"
                      name="Positif"
                      stackId="sentiment"
                      fill={sentimentColors.POSITIVE}
                    />
                    <Bar
                      dataKey="negative"
                      name="Negatif"
                      stackId="sentiment"
                      fill={sentimentColors.NEGATIVE}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="sentiment-empty">
                Belum ada kategori aspek untuk ditampilkan pada grafik.
              </div>
            )}
          </section>

          <section className="sentiment-section">
            <div className="sentiment-section-heading">
              <div>
                <h3>Rincian tanggapan per aspek</h3>
                <p>Angka menunjukkan jumlah dan proporsi ulasan yang tersedia.</p>
              </div>
            </div>
            <div className="absa-table-wrapper">
              <table className="absa-table">
                <thead>
                  <tr>
                    <th scope="col">Aspek</th>
                    <th scope="col">Positif</th>
                    <th scope="col">Negatif</th>
                    <th scope="col">Positif (%)</th>
                    <th scope="col">Negatif (%)</th>
                    <th scope="col">Total ulasan</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">
                        {typeof row.aspect === "string" ? row.aspect : "—"}
                      </th>
                      <td>{formatNumber(row.positive)}</td>
                      <td>{formatNumber(row.negative)}</td>
                      <td>{formatPercentage(row.positive_pct)}</td>
                      <td>{formatPercentage(row.negative_pct)}</td>
                      <td>{formatNumber(row.total_reviews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ABSAAnalysis;

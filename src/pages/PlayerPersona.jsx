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
import { getPersonaBatchAnalysis } from "../services/api";
import {
  chartAxis,
  chartCursorStyle,
  chartGridColor,
  chartPalette,
  chartTooltipStyle,
} from "../components/chartTheme";
import HeroBanner from "../components/ui/HeroBanner";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});

function formatNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter.format(value)
    : "—";
}

function PlayerPersona() {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      setStatus("loading");
      try {
        const result = await getPersonaBatchAnalysis();
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

  const groups = analysis?.persona_groups ?? [];
  const contributionData = useMemo(
    () =>
      (analysis?.criteria_contributions ?? []).map((item) => ({
        criterion: item.criterion.replace(/_/g, " "),
        contribution: item.contribution,
      })),
    [analysis],
  );
  const groupScoreData = useMemo(
    () =>
      groups.map((group) => ({
        persona: group.persona,
        average: group.avg_saw_score,
      })),
    [groups],
  );

  return (
    <div className="persona-page">
      <HeroBanner
        label="KARAKTERISTIK PEMAIN (SAW)"
        title="Karakteristik Pemain dengan SAW"
        description="Simple Additive Weighting (SAW) menggabungkan indikator ulasan, waktu bermain, game yang dimiliki, dan suara membantu untuk merangkum karakteristik kelompok pemain."
        aside={<span className="dashboard-source">Ringkasan pemain</span>}
      />

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Menyiapkan ringkasan karakteristik pemain...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Analisis persona gagal dimuat</h3>
            <p>
              Ringkasan pemain belum dapat dimuat. Silakan coba kembali.
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

      {status === "success" && analysis?.analysis_status === "unavailable" && (
        <div className="dashboard-empty" role="status">
          Ringkasan karakteristik pemain belum tersedia. Skor tidak ditampilkan
          tanpa data pendukung yang memadai.
        </div>
      )}

      {status === "success" && analysis?.analysis_status === "summary_only" && (
        <>
          <div className="dashboard-empty" role="status">
            Informasi yang tersedia saat ini berupa ringkasan per kelompok,
            bukan catatan setiap pemain. Karena itu skor tertinggi/terendah,
            sebaran skor individual, dan hasil per pemain belum dapat
            ditampilkan.
          </div>

          <section className="dashboard-stat-grid" aria-label="Ringkasan SAW">
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Pemain dalam ringkasan kelompok
              </p>
              <p className="dashboard-stat-value">
                {formatNumber(analysis.players_in_summary)}
              </p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Rata-rata skor SAW dari agregat
              </p>
              <p className="dashboard-stat-value">
                {formatNumber(analysis.average_saw_score)}
              </p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Skor tertinggi individual
              </p>
              <p className="dashboard-stat-value">—</p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">
                Skor terendah individual
              </p>
              <p className="dashboard-stat-value">—</p>
            </article>
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="persona-score-chart-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="persona-score-chart-title">
                  Rata-rata skor SAW per kelompok
                </h3>
                <p>
                  Perbandingan ini menunjukkan nilai rata-rata kelompok, bukan
                  sebaran skor setiap pemain.
                </p>
              </div>
            </div>
            {groupScoreData.length > 0 ? (
              <div className="sentiment-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupScoreData}>
                    <CartesianGrid
                      stroke={chartGridColor}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="persona" tick={chartAxis} />
                    <YAxis
                      tick={chartAxis}
                      tickFormatter={formatNumber}
                      width={78}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={chartCursorStyle}
                      formatter={(value) => [
                        formatNumber(value),
                        "Rata-rata skor SAW",
                      ]}
                    />
                    <Bar
                      dataKey="average"
                      name="Rata-rata skor SAW"
                      radius={[5, 5, 0, 0]}
                    >
                      {groupScoreData.map((item, index) => (
                        <Cell
                          key={item.persona}
                          fill={
                            [
                              chartPalette.blue,
                              chartPalette.lavender,
                              chartPalette.teal,
                              chartPalette.sage,
                              chartPalette.amber,
                              chartPalette.rose,
                            ][index % 6]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="dashboard-empty">
                Data agregat skor persona belum tersedia.
              </div>
            )}
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="persona-contribution-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="persona-contribution-title">
                  Kontribusi indikator terhadap skor SAW
                </h3>
                <p>
                  Dihitung dari rata-rata indikator kelompok menggunakan bobot
                  dan acuan normalisasi yang ditetapkan.
                </p>
              </div>
            </div>
            {contributionData.length > 0 ? (
              <div className="sentiment-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contributionData}>
                    <CartesianGrid
                      stroke={chartGridColor}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="criterion" tick={chartAxis} />
                    <YAxis
                      tick={chartAxis}
                      tickFormatter={formatNumber}
                      width={78}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={chartCursorStyle}
                      formatter={(value) => [
                        formatNumber(value),
                        "Kontribusi",
                      ]}
                    />
                    <Bar
                      dataKey="contribution"
                      name="Kontribusi SAW"
                      radius={[5, 5, 0, 0]}
                    >
                      {contributionData.map((item, index) => (
                        <Cell
                          key={item.criterion}
                          fill={
                            [
                              chartPalette.blue,
                              chartPalette.sage,
                              chartPalette.lavender,
                              chartPalette.rose,
                              chartPalette.amber,
                              chartPalette.teal,
                            ][index % 6]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="dashboard-empty">
                Kontribusi kriteria belum dapat dihitung.
              </div>
            )}
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="persona-group-table-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="persona-group-table-title">
                  Ringkasan kelompok pemain
                </h3>
                <p>
                  Tabel ini menunjukkan jumlah pemain dan rata-rata indikator
                  pada setiap kelompok.
                </p>
              </div>
            </div>
            {groups.length > 0 ? (
              <div className="absa-table-wrapper">
                <table className="absa-table">
                  <thead>
                    <tr>
                      <th scope="col">Persona</th>
                      <th scope="col">Pemain</th>
                      <th scope="col">Rata-rata skor SAW</th>
                      <th scope="col">Rata-rata ulasan</th>
                      <th scope="col">Rata-rata waktu bermain</th>
                      <th scope="col">Rata-rata game dimiliki</th>
                      <th scope="col">Rata-rata suara membantu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.source_key}>
                        <th scope="row">{group.persona}</th>
                        <td>{formatNumber(group.total_players)}</td>
                        <td>{formatNumber(group.avg_saw_score)}</td>
                        <td>
                          {formatNumber(group.avg_criteria.review_count)}
                        </td>
                        <td>
                          {formatNumber(
                            group.avg_criteria.avg_playtime_hours,
                          )}
                        </td>
                        <td>
                          {formatNumber(group.avg_criteria.avg_games_owned)}
                        </td>
                        <td>
                          {formatNumber(group.avg_criteria.avg_helpful_votes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dashboard-empty">
                Ringkasan kelompok persona tidak tersedia.
              </div>
            )}
          </section>

          <div className="dashboard-empty" role="status">
            Data individual belum tersedia. Hasil per pemain dan distribusi
            skor akan tetap kosong sampai catatan pemain tersedia.
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerPersona;

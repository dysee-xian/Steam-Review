import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MessageSquareText, UserRound, Users } from "lucide-react";
import { getDashboardSummary } from "../services/dashboardService";
import { getPersonas } from "../services/personaService";
import {
  chartTooltipStyle,
  sentimentColors,
} from "../components/chartTheme";
import ChartCard from "../components/ui/ChartCard";
import HeroBanner from "../components/ui/HeroBanner";
import StatCard from "../components/ui/StatCard";

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

function getDistributionData(personas) {
  return personas.map((persona) => ({
    persona:
      typeof persona.persona === "string" && persona.persona.trim()
        ? persona.persona
        : `Kelompok ${persona.cluster}`,
    players: isFiniteNumber(persona.total_players)
      ? persona.total_players
      : null,
  }));
}

function getSentimentData(summary) {
  const distribution = summary?.distribution;
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
}

function ChartEmptyState() {
  return (
    <div className="dashboard-chart-empty" role="status">
      Belum ada informasi yang cukup untuk menampilkan visualisasi ini.
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      setStatus("loading");

      try {
        const [summaryResult, personaResult] = await Promise.all([
          getDashboardSummary(),
          getPersonas(),
        ]);

        if (active) {
          setSummary(summaryResult);
          setPersonas(personaResult);
          setStatus("success");
        }
      } catch {
        if (active) {
          setStatus("error");
        }
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const distributionData = useMemo(
    () => getDistributionData(personas),
    [personas],
  );
  const sentimentData = useMemo(
    () => getSentimentData(summary),
    [summary],
  );
  const sortedPersonas = useMemo(
    () => [...personas].sort((first, second) => first.cluster - second.cluster),
    [personas],
  );
  const maxPlayers = Math.max(
    1,
    ...distributionData.map((item) => item.players ?? 0),
  );

  const totalPlayers =
    personas.length > 0 &&
    personas.every((persona) => isFiniteNumber(persona.total_players))
      ? personas.reduce((total, persona) => total + persona.total_players, 0)
      : null;
  const hasAnyData =
    isFiniteNumber(summary?.total_reviews_analyzed) ||
    sentimentData.length > 0 ||
    personas.length > 0;

  return (
    <div className="dashboard-page">
      <HeroBanner
        label="OVERVIEW"
        title="Ringkasan Analitik"
        description="Gambaran umum tanggapan pemain dan karakteristik kelompok pemain untuk membantu memahami kondisi game secara menyeluruh."
      />

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Menyiapkan ringkasan analitik...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data Overview gagal dimuat</h3>
            <p>
              Ringkasan belum dapat ditampilkan. Silakan coba beberapa saat
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

      {status === "success" && !hasAnyData && (
        <div className="dashboard-empty" role="status">
          Ringkasan belum tersedia. Belum ada informasi yang dapat ditampilkan.
        </div>
      )}

      {status === "success" && hasAnyData && (
        <>
          <section className="dashboard-stat-grid" aria-label="Statistik utama">
            <StatCard
              icon={Users}
              label="Kelompok pemain"
              value={formatNumber(personas.length)}
              note="Jumlah kelompok yang tersedia"
              tone="tone-blue"
            />
            <StatCard
              icon={UserRound}
              label="Total pemain"
              value={formatNumber(totalPlayers)}
              note="Pemain yang tercakup dalam ringkasan kelompok"
              tone="tone-teal"
            />
            <StatCard
              icon={MessageSquareText}
              label="Ulasan dianalisis"
              value={formatNumber(summary?.total_reviews_analyzed)}
              note="Total ulasan yang telah dianalisis"
              tone="tone-orange"
            />
          </section>

          <section className="dashboard-chart-grid" aria-label="Grafik Overview">
            <ChartCard
              id="persona-distribution-title"
              title="Distribusi pemain SAW"
              description="Jumlah pemain dalam setiap kelompok"
            >
              {distributionData.some((item) => item.players !== null) ? (
                <div className="distribution-list">
                  {distributionData.map((item, index) => (
                    <div className="distribution-row" key={item.persona}>
                      <div className="distribution-row-label">
                        <span>{item.persona}</span>
                        <strong>{formatNumber(item.players)}</strong>
                      </div>
                      <div
                        className={`distribution-track tone-${["blue", "teal", "orange"][index % 3]}`}
                        role="meter"
                        aria-label={`Jumlah pemain pada ${item.persona}`}
                        aria-valuemin={0}
                        aria-valuemax={maxPlayers}
                        aria-valuenow={item.players ?? 0}
                        aria-valuetext={
                          item.players === null
                            ? "Data tidak tersedia"
                            : `${formatNumber(item.players)} pemain`
                        }
                      >
                        <span
                          className="distribution-fill"
                          style={{
                            width:
                              item.players === null
                                ? "0%"
                                : `${(item.players / maxPlayers) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </ChartCard>

            <ChartCard
              id="sentiment-distribution-title"
              title="Distribusi sentimen keseluruhan"
              description="Jumlah ulasan positif dan negatif"
            >
              {sentimentData.length > 0 ? (
                <div className="sentiment-donut-layout">
                  <div className="sentiment-donut">
                    <span className="sentiment-donut-center" aria-hidden="true">
                      Sentimen
                    </span>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          dataKey="reviews"
                          nameKey="sentiment"
                          innerRadius="64%"
                          outerRadius="88%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {sentimentData.map((item) => (
                            <Cell
                              key={item.sentimentKey}
                              fill={sentimentColors[item.sentimentKey]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) => [
                            formatNumber(value),
                            "Ulasan",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul
                    className="sentiment-donut-legend"
                    aria-label="Legenda sentimen"
                  >
                    {sentimentData.map((item) => (
                      <li key={item.sentimentKey}>
                        <span
                          className={`sentiment-legend-dot ${item.sentimentKey.toLowerCase()}`}
                          aria-hidden="true"
                        />
                        <span>{item.sentiment}</span>
                        <strong>{formatNumber(item.reviews)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </ChartCard>
          </section>

          <ChartCard
            id="positive-sentiment-trend-title"
            title="Tren sentimen positif"
            description="Perubahan tanggapan positif dari waktu ke waktu"
            className="dashboard-trend-card"
          >
            <div className="dashboard-chart-empty" role="status">
              Belum ada data tren sentimen per periode untuk ditampilkan.
            </div>
          </ChartCard>

          <section className="dashboard-panel dashboard-personas">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Ringkasan persona SAW</h3>
                <p>Jumlah pemain dan rata-rata indikator pada tiap kelompok</p>
              </div>
            </div>
            {sortedPersonas.length > 0 ? (
              <div className="persona-card-grid">
                {sortedPersonas.map((persona) => (
                  <article className="persona-summary-card" key={persona.id}>
                    <div className="persona-card-heading">
                      <h4>
                        {typeof persona.persona === "string" &&
                        persona.persona.trim()
                          ? persona.persona
                          : `Cluster ${persona.cluster}`}
                      </h4>
                      <span className="persona-cluster">
                        Kelompok {persona.cluster}
                      </span>
                    </div>
                    <p className="persona-player-count">
                      {formatNumber(persona.total_players)}
                      <span> pemain</span>
                    </p>
                    <div className="persona-sentiment">
                      <span>
                        Skor SAW{" "}
                        <strong>{formatNumber(persona.avg_saw_score)}</strong>
                      </span>
                      <span>
                        Rata-rata ulasan{" "}
                        <strong>{formatNumber(persona.avg_reviews)}</strong>
                      </span>
                      <span>
                        Rata-rata playtime{" "}
                        <strong>
                          {formatNumber(persona.avg_playtime_hours)} jam
                        </strong>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-section-empty">
                Ringkasan kelompok pemain belum tersedia.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;

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
import { getDashboardSummary } from "../services/dashboardService";
import { getPersonas } from "../services/personaService";

const numberFormatter = new Intl.NumberFormat("id-ID");
const percentageFormatter = new Intl.NumberFormat("id-ID", {
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
    ? `${percentageFormatter.format(value)}%`
    : "—";
}

function getDistributionData(distribution) {
  if (!Array.isArray(distribution?.cluster)) {
    return [];
  }

  return distribution.cluster.map((cluster, index) => ({
    cluster: `Cluster ${cluster}`,
    players: isFiniteNumber(distribution.jumlah_pemain?.[index])
      ? distribution.jumlah_pemain[index]
      : null,
  }));
}

function getSentimentData(sentiment) {
  if (!Array.isArray(sentiment?.cluster)) {
    return [];
  }

  return sentiment.cluster.map((cluster, index) => ({
    cluster: `Cluster ${cluster}`,
    positive: isFiniteNumber(sentiment.positif?.[index])
      ? sentiment.positif[index]
      : null,
    negative: isFiniteNumber(sentiment.negatif?.[index])
      ? sentiment.negatif[index]
      : null,
  }));
}

function ChartEmptyState() {
  return (
    <div className="dashboard-chart-empty">
      Data grafik belum tersedia di Firestore.
    </div>
  );
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const [summaryResult, personaResult] = await Promise.allSettled([
          getDashboardSummary(),
          getPersonas(),
        ]);
        const summaryIsMissing =
          summaryResult.status === "rejected" &&
          summaryResult.reason instanceof Error &&
          summaryResult.reason.message ===
            "Dokumen dashboard_summaries/persona_dashboard tidak ditemukan.";

        if (personaResult.status === "rejected") {
          throw personaResult.reason;
        }

        if (summaryResult.status === "rejected" && !summaryIsMissing) {
          throw summaryResult.reason;
        }

        if (active) {
          setDashboard(
            summaryResult.status === "fulfilled" ? summaryResult.value : null,
          );
          setPersonas(personaResult.value);
          setStatus("success");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data Dashboard.",
          );
          setStatus("error");
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const distributionData = useMemo(
    () => getDistributionData(dashboard?.grafik_distribusi),
    [dashboard],
  );
  const sentimentData = useMemo(
    () => getSentimentData(dashboard?.grafik_sentimen),
    [dashboard],
  );
  const sortedPersonas = useMemo(
    () =>
      [...personas].sort((first, second) => {
        const firstCluster = isFiniteNumber(first.cluster)
          ? first.cluster
          : Number.POSITIVE_INFINITY;
        const secondCluster = isFiniteNumber(second.cluster)
          ? second.cluster
          : Number.POSITIVE_INFINITY;
        return firstCluster - secondCluster;
      }),
    [personas],
  );

  const totalPlayers =
    personas.length > 0 &&
    personas.every((persona) => isFiniteNumber(persona.jumlah_pemain))
      ? personas.reduce((total, persona) => total + persona.jumlah_pemain, 0)
      : null;

  const hasAnyData =
    isFiniteNumber(dashboard?.jumlah_persona) ||
    distributionData.some((item) => item.players !== null) ||
    sentimentData.some(
      (item) => item.positive !== null || item.negative !== null,
    ) ||
    personas.length > 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Ringkasan analitik</p>
          <h2>Steam Review Dashboard</h2>
          <p className="dashboard-description">
            Gambaran distribusi pemain, sentimen, dan persona dari data yang
            tersedia.
          </p>
        </div>
        {status === "success" && (
          <span className="dashboard-source">
            {typeof dashboard?.sumber === "string"
              ? dashboard.sumber
              : "Sumber data"}
          </span>
        )}
      </div>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat data Dashboard dari Firestore...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data Dashboard gagal dimuat</h3>
            <p>{errorMessage}</p>
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
          Data Dashboard dan persona belum tersedia di Firestore.
        </div>
      )}

      {status === "success" && hasAnyData && (
        <>
          <section className="dashboard-stat-grid" aria-label="Statistik utama">
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Jumlah persona</p>
              <p className="dashboard-stat-value">
                {formatNumber(dashboard?.jumlah_persona)}
              </p>
              <p className="dashboard-stat-note">
                Berdasarkan ringkasan Dashboard
              </p>
            </article>
            <article className="dashboard-stat-card">
              <p className="dashboard-stat-label">Total pemain</p>
              <p className="dashboard-stat-value">
                {formatNumber(totalPlayers)}
              </p>
              <p className="dashboard-stat-note">
                Jumlah pemain dari seluruh persona
              </p>
            </article>
          </section>

          <section className="dashboard-chart-grid" aria-label="Grafik Dashboard">
            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h3>Distribusi pemain</h3>
                  <p>Jumlah pemain pada setiap cluster</p>
                </div>
              </div>
              {distributionData.some((item) => item.players !== null) ? (
                <div className="dashboard-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distributionData}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="#293647"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="cluster"
                        tick={{ fill: "#aab8ca", fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tick={{ fill: "#8293aa", fontSize: 11 }}
                        tickFormatter={formatNumber}
                        tickLine={false}
                        width={72}
                      />
                      <Tooltip
                        formatter={(value) => [formatNumber(value), "Pemain"]}
                        contentStyle={{
                          border: "1px solid #344357",
                          borderRadius: 10,
                          background: "#172230",
                          color: "#e8edf5",
                        }}
                      />
                      <Bar
                        dataKey="players"
                        name="Pemain"
                        fill="#6ba6f7"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h3>Distribusi sentimen</h3>
                  <p>Perbandingan positif dan negatif per cluster</p>
                </div>
              </div>
              {sentimentData.some(
                (item) => item.positive !== null || item.negative !== null,
              ) ? (
                <div className="dashboard-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sentimentData}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="#293647"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="cluster"
                        tick={{ fill: "#aab8ca", fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tick={{ fill: "#8293aa", fontSize: 11 }}
                        tickFormatter={(value) => `${formatNumber(value)}%`}
                        tickLine={false}
                        width={72}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          formatPercentage(value),
                          name,
                        ]}
                        contentStyle={{
                          border: "1px solid #344357",
                          borderRadius: 10,
                          background: "#172230",
                          color: "#e8edf5",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="positive"
                        name="Positif"
                        fill="#50c49a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="negative"
                        name="Negatif"
                        fill="#f07878"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </article>
          </section>

          <section className="dashboard-panel dashboard-personas">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Ringkasan persona</h3>
                <p>Profil persona yang tersedia di koleksi Firestore</p>
              </div>
            </div>
            {sortedPersonas.length > 0 ? (
              <div className="persona-card-grid">
                {sortedPersonas.map((persona, index) => (
                  <article
                    className="persona-summary-card"
                    key={persona.id ?? `persona-${index}`}
                  >
                    <div className="persona-card-heading">
                      <h4>
                        {typeof persona.nama_persona === "string" &&
                        persona.nama_persona.trim()
                          ? persona.nama_persona
                          : "Nama persona tidak tersedia"}
                      </h4>
                      <span className="persona-cluster">
                        {isFiniteNumber(persona.cluster)
                          ? `Cluster ${persona.cluster}`
                          : "Cluster —"}
                      </span>
                    </div>
                    <p className="persona-player-count">
                      {formatNumber(persona.jumlah_pemain)}
                      <span> pemain</span>
                    </p>
                    <div className="persona-sentiment">
                      <span>
                        Positif{" "}
                        <strong>
                          {formatPercentage(persona.persentase_positif)}
                        </strong>
                      </span>
                      <span>
                        Negatif{" "}
                        <strong>
                          {formatPercentage(persona.persentase_negatif)}
                        </strong>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-section-empty">
                Data persona belum tersedia di Firestore.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;

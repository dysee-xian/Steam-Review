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
import { getAbsaSummary } from "../services/absaService";

const percentageFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat("id-ID");

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPercentage(value) {
  return isFiniteNumber(value)
    ? `${percentageFormatter.format(value)}%`
    : "Data belum tersedia";
}

function formatPlayerCount(value) {
  return isFiniteNumber(value)
    ? numberFormatter.format(value)
    : "Data belum tersedia";
}

function formatMetric(value) {
  return isFiniteNumber(value) ? numberFormatter.format(value) : "—";
}

function formatUpdatedAt(value) {
  if (!value || typeof value.toDate !== "function") {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value.toDate());
}

function getAspectRows(summary) {
  if (!Array.isArray(summary?.ringkasan_per_aspek)) {
    return [];
  }

  return summary.ringkasan_per_aspek.filter(
    (row) => typeof row?.aspek === "string" && row.aspek.trim(),
  );
}

function AbsaSummaryCard({ label, value }) {
  return (
    <article className="sentiment-summary-card absa-stat-card">
      <p className="absa-stat-label">{label}</p>
      <p className="absa-stat-value">{formatMetric(value)}</p>
    </article>
  );
}

function AbsaTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="sentiment-chart-tooltip">
      <strong>{row.aspek}</strong>
      <span>
        <i className="sentiment-dot positive" aria-hidden="true" />
        Positif: {formatMetric(row.sentimen_positif)}
      </span>
      <span>
        <i className="sentiment-dot negative" aria-hidden="true" />
        Negatif: {formatMetric(row.sentimen_negatif)}
      </span>
    </div>
  );
}

function AbsaSection({
  status,
  summary,
  errorMessage,
  onRetry,
  selectedAspect,
  onAspectChange,
}) {
  const aspectRows = getAspectRows(summary);
  const aspects = [...new Set(aspectRows.map((row) => row.aspek))];
  const visibleRows =
    selectedAspect === "all"
      ? aspectRows
      : aspectRows.filter((row) => row.aspek === selectedAspect);
  const updatedAt = formatUpdatedAt(summary?.updated_at);

  return (
    <section className="sentiment-section absa-section" aria-labelledby="absa-title">
      <div className="sentiment-section-heading absa-section-heading">
        <div>
          <p className="eyebrow">Anotasi manual · data pilot</p>
          <h3 id="absa-title">
            Aspect-Based Sentiment Analysis (ABSA)
          </h3>
          <p>
            Hasil anotasi manual pada data pilot, bukan keseluruhan dataset
            Steam. Data yang tersedia hanya mencakup sentimen positif dan
            negatif; sentimen netral dan skor ABSA tidak tersedia.
          </p>
        </div>
        {aspects.length > 0 && status === "success" && (
          <label className="absa-filter">
            <span>Filter aspek</span>
            <select
              value={selectedAspect}
              onChange={(event) => onAspectChange(event.target.value)}
            >
              <option value="all">Semua aspek</option>
              {aspects.map((aspect) => (
                <option key={aspect} value={aspect}>
                  {aspect}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat data ABSA dari Firestore...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data ABSA gagal dimuat</h3>
            <p>{errorMessage}</p>
          </div>
          <button
            className="dashboard-retry"
            onClick={onRetry}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          {typeof summary.deskripsi === "string" && (
            <p className="absa-description">{summary.deskripsi}</p>
          )}

          <div className="sentiment-summary-grid absa-stat-grid">
            <AbsaSummaryCard
              label="Total ulasan pilot"
              value={summary.total_ulasan_pilot}
            />
            <AbsaSummaryCard
              label="Jumlah aspek"
              value={summary.jumlah_aspek}
            />
            <AbsaSummaryCard
              label="Jumlah anotasi manual"
              value={summary.jumlah_anotasi_manual}
            />
            <AbsaSummaryCard
              label="Jumlah perlu tinjauan"
              value={summary.jumlah_perlu_tinjauan}
            />
          </div>

          {aspectRows.length === 0 ? (
            <div className="sentiment-empty" role="status">
              Data ringkasan aspek belum tersedia di Firestore.
            </div>
          ) : (
            <>
              <div className="sentiment-section absa-data-panel">
                <div className="sentiment-section-heading">
                  <div>
                    <h4>Distribusi sentimen per aspek</h4>
                    <p>
                      Jumlah anotasi positif dan negatif berdasarkan aspek.
                    </p>
                  </div>
                  <div className="sentiment-chart-legend" aria-label="Legenda">
                    <span>
                      <i
                        className="sentiment-dot positive"
                        aria-hidden="true"
                      />
                      Positif
                    </span>
                    <span>
                      <i
                        className="sentiment-dot negative"
                        aria-hidden="true"
                      />
                      Negatif
                    </span>
                  </div>
                </div>
                {visibleRows.length > 0 ? (
                  <div className="sentiment-chart absa-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={visibleRows}
                        margin={{ top: 12, right: 12, left: 4, bottom: 56 }}
                      >
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          axisLine={false}
                          dataKey="aspek"
                          height={58}
                          interval={0}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          tickLine={false}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip content={<AbsaTooltip />} />
                        <Bar
                          dataKey="sentimen_positif"
                          name="Positif"
                          stackId="sentimen"
                          fill="#16a34a"
                        />
                        <Bar
                          dataKey="sentimen_negatif"
                          name="Negatif"
                          stackId="sentimen"
                          fill="#dc2626"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="sentiment-empty">
                    Tidak ada data untuk aspek yang dipilih.
                  </div>
                )}
              </div>

              <div className="sentiment-section absa-data-panel">
                <div className="sentiment-section-heading">
                  <div>
                    <h4>Rincian anotasi per aspek</h4>
                    <p>
                      Tabel mengikuti aspek yang dipilih pada filter dan grafik.
                    </p>
                  </div>
                </div>
                {visibleRows.length > 0 ? (
                  <div className="absa-table-wrapper">
                    <table className="absa-table">
                      <thead>
                        <tr>
                          <th scope="col">Nama aspek</th>
                          <th scope="col">Sentimen positif</th>
                          <th scope="col">Sentimen negatif</th>
                          <th scope="col">Total ulasan</th>
                          <th scope="col">Perlu tinjauan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row) => (
                          <tr key={row.aspek}>
                            <th scope="row">{row.aspek}</th>
                            <td>{formatMetric(row.sentimen_positif)}</td>
                            <td>{formatMetric(row.sentimen_negatif)}</td>
                            <td>{formatMetric(row.total_ulasan)}</td>
                            <td>{formatMetric(row.perlu_tinjauan)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sentiment-empty">
                    Tidak ada data untuk aspek yang dipilih.
                  </div>
                )}
              </div>
            </>
          )}

          <div className="absa-notes">
            {typeof summary.catatan === "string" && (
              <p>{summary.catatan}</p>
            )}
            {updatedAt && <p>Terakhir diperbarui: {updatedAt}</p>}
          </div>
        </>
      )}
    </section>
  );
}

function getPersonaName(persona) {
  return typeof persona?.nama_persona === "string" &&
    persona.nama_persona.trim()
    ? persona.nama_persona
    : null;
}

function buildSentimentRows(sentiment, personas) {
  if (!Array.isArray(sentiment?.cluster)) {
    return [];
  }

  const personaByCluster = new Map(
    personas
      .filter((persona) => isFiniteNumber(persona.cluster))
      .map((persona) => [persona.cluster, persona]),
  );

  return sentiment.cluster.map((cluster, index) => {
    const persona = personaByCluster.get(cluster);
    const name = getPersonaName(persona);

    return {
      cluster,
      label: name ?? `Cluster ${cluster}`,
      personaName: name,
      positive: isFiniteNumber(sentiment.positif?.[index])
        ? sentiment.positif[index]
        : null,
      negative: isFiniteNumber(sentiment.negatif?.[index])
        ? sentiment.negatif[index]
        : null,
    };
  });
}

function SentimentTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="sentiment-chart-tooltip">
      <strong>{row.label}</strong>
      {row.personaName && <span>Cluster {row.cluster}</span>}
      {payload.map((item) => (
        <span key={item.dataKey}>
          <i
            className={`sentiment-dot ${item.dataKey}`}
            aria-hidden="true"
          />
          {item.name}: {formatPercentage(item.value)}
        </span>
      ))}
    </div>
  );
}

function SentimentSummaryCard({ row }) {
  return (
    <article className="sentiment-summary-card">
      <div className="sentiment-summary-heading">
        <h3>{row.label}</h3>
        <span>Cluster {row.cluster}</span>
      </div>
      <div className="sentiment-summary-values">
        <span>
          <i className="sentiment-dot positive" aria-hidden="true" />
          Positif <strong>{formatPercentage(row.positive)}</strong>
        </span>
        <span>
          <i className="sentiment-dot negative" aria-hidden="true" />
          Negatif <strong>{formatPercentage(row.negative)}</strong>
        </span>
      </div>
    </article>
  );
}

function SentimentPersonaCard({ persona }) {
  const positive = persona.persentase_positif;
  const negative = persona.persentase_negatif;

  return (
    <article className="sentiment-persona-card">
      <div className="sentiment-persona-heading">
        <div>
          <p className="sentiment-persona-overline">Persona</p>
          <h3>{getPersonaName(persona) ?? "Nama persona belum tersedia"}</h3>
        </div>
        <span className="sentiment-persona-cluster">
          {isFiniteNumber(persona.cluster)
            ? `Cluster ${persona.cluster}`
            : "Cluster belum tersedia"}
        </span>
      </div>

      <p className="sentiment-persona-players">
        {formatPlayerCount(persona.jumlah_pemain)}
        <span> pemain</span>
      </p>

      <div className="sentiment-summary-values">
        <span>
          <i className="sentiment-dot positive" aria-hidden="true" />
          Positif <strong>{formatPercentage(positive)}</strong>
        </span>
        <span>
          <i className="sentiment-dot negative" aria-hidden="true" />
          Negatif <strong>{formatPercentage(negative)}</strong>
        </span>
      </div>

      <div
        className="sentiment-persona-bars"
        role="img"
        aria-label={`Positif ${formatPercentage(positive)}, negatif ${formatPercentage(negative)}`}
      >
        {isFiniteNumber(positive) && (
          <span
            className="sentiment-persona-bar positive"
            style={{ width: `${Math.min(Math.max(positive, 0), 100)}%` }}
          />
        )}
        {isFiniteNumber(negative) && (
          <span
            className="sentiment-persona-bar negative"
            style={{ width: `${Math.min(Math.max(negative, 0), 100)}%` }}
          />
        )}
      </div>
    </article>
  );
}

function SentimentAnalysis() {
  const [summary, setSummary] = useState(null);
  const [absaSummary, setAbsaSummary] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [absaStatus, setAbsaStatus] = useState("loading");
  const [absaErrorMessage, setAbsaErrorMessage] = useState("");
  const [absaReloadKey, setAbsaReloadKey] = useState(0);
  const [selectedAspect, setSelectedAspect] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadSentimentData() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const [dashboardData, personaData] = await Promise.all([
          getDashboardSummary(),
          getPersonas(),
        ]);

        if (active) {
          setSummary(dashboardData);
          setPersonas(personaData);
          setStatus("success");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data sentimen.",
          );
          setStatus("error");
        }
      }
    }

    loadSentimentData();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let active = true;

    async function loadAbsaData() {
      setAbsaStatus("loading");
      setAbsaErrorMessage("");

      try {
        const data = await getAbsaSummary();
        if (active) {
          setAbsaSummary(data);
          setSelectedAspect("all");
          setAbsaStatus("success");
        }
      } catch (error) {
        if (active) {
          setAbsaErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data ABSA.",
          );
          setAbsaStatus("error");
        }
      }
    }

    loadAbsaData();

    return () => {
      active = false;
    };
  }, [absaReloadKey]);

  const sentimentRows = useMemo(
    () => buildSentimentRows(summary?.grafik_sentimen, personas),
    [summary, personas],
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
  const hasSentimentValues = sentimentRows.some(
    (row) => row.positive !== null || row.negative !== null,
  );
  const hasAnyData = sentimentRows.length > 0 || personas.length > 0;

  return (
    <div className="sentiment-page">
      <header className="sentiment-page-heading">
        <div>
          <p className="eyebrow">Analisis sentimen</p>
          <h2>Distribusi Sentimen Persona</h2>
          <p className="sentiment-page-description">
            Persentase positif dan negatif yang tercatat untuk masing-masing
            cluster persona.
          </p>
        </div>
        {status === "success" && typeof summary?.sumber === "string" && (
          <span className="dashboard-source">{summary.sumber}</span>
        )}
      </header>

      <aside className="sentiment-interpretation">
        Persentase menunjukkan distribusi sentimen yang tercatat pada
        masing-masing persona, bukan persentase keseluruhan dataset. Sentimen
        tidak cukup untuk menyimpulkan kondisi psikologis atau fatigue pada
        pemain.
      </aside>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat data sentimen dari Firestore...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data sentimen gagal dimuat</h3>
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
          Data sentimen dan persona belum tersedia di Firestore.
        </div>
      )}

      {status === "success" && hasAnyData && (
        <>
          <section
            className="sentiment-section"
            aria-labelledby="sentiment-summary-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="sentiment-summary-title">Ringkasan sentimen</h3>
                <p>
                  Nilai ditampilkan per cluster; tidak dihitung sebagai
                  persentase keseluruhan.
                </p>
              </div>
            </div>
            {sentimentRows.length > 0 && hasSentimentValues ? (
              <div className="sentiment-summary-grid">
                {sentimentRows.map((row, index) => (
                  <SentimentSummaryCard
                    key={`${row.cluster}-${index}`}
                    row={row}
                  />
                ))}
              </div>
            ) : (
              <div className="sentiment-empty">
                Data persentase sentimen per cluster belum tersedia.
              </div>
            )}
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="sentiment-chart-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="sentiment-chart-title">Perbandingan per cluster</h3>
                <p>
                  Persentase positif dan negatif berdasarkan data ringkasan
                  Firestore.
                </p>
              </div>
              <div className="sentiment-chart-legend" aria-label="Legenda">
                <span>
                  <i className="sentiment-dot positive" aria-hidden="true" />
                  Positif
                </span>
                <span>
                  <i className="sentiment-dot negative" aria-hidden="true" />
                  Negatif
                </span>
              </div>
            </div>
            {sentimentRows.length > 0 && hasSentimentValues ? (
              <div className="sentiment-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sentimentRows}
                    margin={{ top: 12, right: 12, left: 4, bottom: 76 }}
                    barGap={5}
                  >
                    <CartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      height={78}
                      interval={0}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      angle={-18}
                      textAnchor="end"
                    />
                    <YAxis
                      axisLine={false}
                      domain={[0, 100]}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(value) => `${percentageFormatter.format(value)}%`}
                      tickLine={false}
                      width={64}
                    />
                    <Tooltip content={<SentimentTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="positive"
                      name="Positif"
                      fill="#16a34a"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="negative"
                      name="Negatif"
                      fill="#dc2626"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="sentiment-empty">
                Grafik tidak dapat ditampilkan karena nilai sentimen belum
                tersedia.
              </div>
            )}
          </section>

          <section
            className="sentiment-section"
            aria-labelledby="sentiment-personas-title"
          >
            <div className="sentiment-section-heading">
              <div>
                <h3 id="sentiment-personas-title">Detail sentimen persona</h3>
                <p>
                  Persentase dan jumlah pemain diambil dari dokumen persona.
                </p>
              </div>
            </div>
            {sortedPersonas.length > 0 ? (
              <div className="sentiment-persona-grid">
                {sortedPersonas.map((persona, index) => (
                  <SentimentPersonaCard
                    key={persona.id ?? `persona-${index}`}
                    persona={persona}
                  />
                ))}
              </div>
            ) : (
              <div className="sentiment-empty">
                Data persona belum tersedia di Firestore.
              </div>
            )}
          </section>
        </>
      )}

      <AbsaSection
        errorMessage={absaErrorMessage}
        onAspectChange={setSelectedAspect}
        onRetry={() => setAbsaReloadKey((key) => key + 1)}
        selectedAspect={selectedAspect}
        status={absaStatus}
        summary={absaSummary}
      />
    </div>
  );
}

export default SentimentAnalysis;

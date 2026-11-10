import { useEffect, useMemo, useState } from "react";
import { getRecommendationsData } from "../services/recommendationsService";

const clusters = [0, 1, 2, 3];
const numberFormatter = new Intl.NumberFormat("id-ID");
const scoreFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});
const percentageFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value) {
  return isFiniteNumber(value) ? numberFormatter.format(value) : "—";
}

function formatScore(value) {
  return isFiniteNumber(value) ? scoreFormatter.format(value) : "—";
}

function formatAppId(value) {
  return isFiniteNumber(value) ? String(value) : "—";
}

function formatPercentage(value) {
  return isFiniteNumber(value)
    ? `${percentageFormatter.format(value)}%`
    : "—";
}

function FatigueSummary({ fatigue }) {
  const levels = [
    { key: "persentase_rendah", label: "Rendah", tone: "low" },
    { key: "persentase_sedang", label: "Sedang", tone: "medium" },
    { key: "persentase_tinggi", label: "Tinggi", tone: "high" },
  ];

  return (
    <section className="recommendations-panel" aria-labelledby="fatigue-title">
      <div className="recommendations-panel-heading">
        <div>
          <h3 id="fatigue-title">Indikasi fatigue</h3>
          <p>Persentase ulasan per tingkat indikasi pada persona ini.</p>
        </div>
        {isFiniteNumber(fatigue?.indeks_indikasi_fatigue) && (
          <span className="recommendations-index">
            IIF {formatScore(fatigue.indeks_indikasi_fatigue)}
          </span>
        )}
      </div>

      {fatigue ? (
        <div className="recommendations-fatigue-grid">
          {levels.map(({ key, label, tone }) => {
            const value = fatigue[key];
            const width = isFiniteNumber(value)
              ? Math.min(Math.max(value, 0), 100)
              : 0;

            return (
              <div className="recommendations-fatigue-item" key={key}>
                <div className="recommendations-fatigue-label">
                  <span>{label}</span>
                  <strong>{formatPercentage(value)}</strong>
                </div>
                <div
                  className="recommendations-fatigue-track"
                  role="img"
                  aria-label={`${label}: ${formatPercentage(value)}`}
                >
                  <span
                    className={`recommendations-fatigue-bar ${tone}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="recommendations-unavailable">
          Ringkasan fatigue untuk persona ini belum tersedia.
        </p>
      )}
    </section>
  );
}

function RecommendationCard({ game }) {
  const metrics = [
    { label: "Skor resonance", value: formatScore(game.skor_resonance) },
    { label: "C1 · Sentimen", value: formatPercentage(game.C1_sentimen) },
    { label: "C2 · Playtime", value: formatPercentage(game.C2_playtime) },
    { label: "C3 · Review", value: formatPercentage(game.C3_review) },
    { label: "Total ulasan", value: formatNumber(game.total_ulasan) },
  ];

  return (
    <article className="recommendation-card">
      <header className="recommendation-card-heading">
        <span className="recommendation-rank">
          Peringkat {formatNumber(game.peringkat)}
        </span>
        <span className="recommendation-appid">
          App ID <strong>{formatAppId(game.appid)}</strong>
        </span>
      </header>
      <dl className="recommendation-metrics">
        {metrics.map(({ label, value }) => (
          <div className="recommendation-metric" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Recommendations() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCluster, setSelectedCluster] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const result = await getRecommendationsData();
        if (active) {
          setData(result);
          setStatus("success");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil rekomendasi.",
          );
          setStatus("error");
        }
      }
    }

    loadRecommendations();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedData = useMemo(() => {
    const recommendationGroup =
      data?.recommendations?.rekomendasi_per_persona?.[
        String(selectedCluster)
      ];
    const games = Array.isArray(recommendationGroup?.daftar_game)
      ? recommendationGroup.daftar_game
      : [];
    const personaName =
      typeof recommendationGroup?.nama_persona === "string"
        ? recommendationGroup.nama_persona
        : games.find((game) => typeof game.nama_persona === "string")
            ?.nama_persona;
    const summary = data?.resonance?.ringkasan_per_persona?.find(
      (item) => item.cluster === selectedCluster,
    );
    const fatigue = data?.fatigue?.data?.find(
      (item) => item.cluster === selectedCluster,
    );

    return { games, personaName, summary, fatigue };
  }, [data, selectedCluster]);

  return (
    <div className="recommendations-page">
      <div className="recommendations-heading">
        <div>
          <p className="eyebrow">Rekomendasi berbasis SAW</p>
          <h2>Recommendations</h2>
          <p className="recommendations-description">
            Sepuluh game teratas berdasarkan skor Persona Resonance untuk
            setiap cluster. Nama game tidak tersedia pada data sumber; App ID
            ditampilkan sebagai identitas.
          </p>
        </div>
      </div>

      <section
        className="recommendations-selector"
        aria-label="Pilih persona"
      >
        <div className="recommendations-selector-heading">
          <h3>Pilih persona</h3>
          {selectedData.personaName && status === "success" && (
            <span>{selectedData.personaName}</span>
          )}
        </div>
        <div className="recommendations-cluster-options">
          {clusters.map((cluster) => (
            <button
              aria-pressed={selectedCluster === cluster}
              className={`recommendations-cluster-option${
                selectedCluster === cluster ? " is-selected" : ""
              }`}
              key={cluster}
              onClick={() => setSelectedCluster(cluster)}
              type="button"
            >
              Cluster {cluster}
            </button>
          ))}
        </div>
      </section>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat rekomendasi dari Firestore...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Rekomendasi gagal dimuat</h3>
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

      {status === "success" && selectedData.games.length === 0 && (
        <div className="dashboard-empty" role="status">
          Rekomendasi untuk Cluster {selectedCluster} belum tersedia di
          Firestore.
        </div>
      )}

      {status === "success" && selectedData.games.length > 0 && (
        <>
          <section
            className="recommendations-overview"
            aria-label="Ringkasan persona"
          >
            <div className="recommendations-panel">
              <div className="recommendations-panel-heading">
                <div>
                  <h3>Ringkasan skor resonance</h3>
                  <p>
                    {selectedData.personaName || `Cluster ${selectedCluster}`}
                  </p>
                </div>
                <span className="recommendations-index">
                  {selectedData.games.length} rekomendasi
                </span>
              </div>
              {selectedData.summary ? (
                <dl className="recommendations-summary-grid">
                  <div>
                    <dt>Rata-rata</dt>
                    <dd>
                      {formatScore(
                        selectedData.summary.rata_rata_resonance,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Skor tertinggi</dt>
                    <dd>
                      {formatScore(
                        selectedData.summary.resonance_tertinggi,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Skor terendah</dt>
                    <dd>
                      {formatScore(
                        selectedData.summary.resonance_terendah,
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="recommendations-unavailable">
                  Ringkasan skor persona ini belum tersedia.
                </p>
              )}
            </div>

            <FatigueSummary fatigue={selectedData.fatigue} />
          </section>

          <section
            className="recommendations-list-section"
            aria-labelledby="recommendations-list-title"
          >
            <div className="recommendations-panel-heading">
              <div>
                <h3 id="recommendations-list-title">
                  Daftar rekomendasi game
                </h3>
                <p>
                  Peringkat dan nilai kriteria yang tercatat di Firestore.
                </p>
              </div>
            </div>
            <div className="recommendations-list">
              {selectedData.games.map((game, index) => (
                <RecommendationCard
                  game={game}
                  key={`${game.appid ?? "game"}-${game.peringkat ?? index}`}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Recommendations;
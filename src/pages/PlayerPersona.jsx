import { useEffect, useMemo, useState } from "react";
import { getPersonas } from "../services/personaService";

const numberFormatter = new Intl.NumberFormat("id-ID");
const percentageFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value) {
  return isFiniteNumber(value)
    ? numberFormatter.format(value)
    : "Data belum tersedia";
}

function formatPercentage(value) {
  return isFiniteNumber(value)
    ? `${percentageFormatter.format(value)}%`
    : "Data belum tersedia";
}

function formatPlaytime(value) {
  if (!isFiniteNumber(value)) {
    return "Data belum tersedia";
  }

  const hours = value / 60;
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(hours)} jam`;
}

function getPercentageWidth(value) {
  return isFiniteNumber(value) ? Math.min(Math.max(value, 0), 100) : 0;
}

function PersonaCard({ persona }) {
  const positiveWidth = getPercentageWidth(persona.persentase_positif);
  const negativeWidth = getPercentageWidth(persona.persentase_negatif);

  return (
    <article className="persona-detail-card">
      <header className="persona-detail-heading">
        <div>
          <p className="persona-detail-overline">Persona</p>
          <h3>
            {typeof persona.nama_persona === "string" &&
            persona.nama_persona.trim()
              ? persona.nama_persona
              : "Data belum tersedia"}
          </h3>
        </div>
        <span className="persona-detail-cluster">
          {isFiniteNumber(persona.cluster)
            ? `Cluster ${persona.cluster}`
            : "Cluster belum tersedia"}
        </span>
      </header>

      <div className="persona-detail-player-count">
        <span>Jumlah pemain</span>
        <strong>{formatNumber(persona.jumlah_pemain)}</strong>
      </div>

      <dl className="persona-metrics">
        <div className="persona-metric">
          <dt>Median jumlah review</dt>
          <dd>{formatNumber(persona.median_review)}</dd>
        </div>
        <div className="persona-metric">
          <dt>Median playtime saat review</dt>
          <dd>{formatPlaytime(persona.median_playtime_review)}</dd>
        </div>
        <div className="persona-metric">
          <dt>Median total playtime</dt>
          <dd>{formatPlaytime(persona.median_playtime_total)}</dd>
        </div>
      </dl>

      <section
        className="persona-sentiment-section"
        aria-label={`Sentimen ${persona.nama_persona || "persona"}`}
      >
        <h4>Sentimen</h4>
        <div className="persona-sentiment-values">
          <span>
            <i className="sentiment-dot positive" aria-hidden="true" />
            Positif <strong>{formatPercentage(persona.persentase_positif)}</strong>
          </span>
          <span>
            <i className="sentiment-dot negative" aria-hidden="true" />
            Negatif <strong>{formatPercentage(persona.persentase_negatif)}</strong>
          </span>
        </div>
        <div
          className="persona-sentiment-bars"
          role="img"
          aria-label={`Positif ${formatPercentage(persona.persentase_positif)}, negatif ${formatPercentage(persona.persentase_negatif)}`}
        >
          <span
            className="persona-sentiment-bar positive"
            style={{ width: `${positiveWidth}%` }}
          />
          <span
            className="persona-sentiment-bar negative"
            style={{ width: `${negativeWidth}%` }}
          />
        </div>
      </section>
    </article>
  );
}

function PlayerPersona() {
  const [personas, setPersonas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPersonas() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const data = await getPersonas();
        if (active) {
          setPersonas(data);
          setStatus("success");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data persona.",
          );
          setStatus("error");
        }
      }
    }

    loadPersonas();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const clusters = useMemo(
    () =>
      [...new Set(personas.filter((persona) => isFiniteNumber(persona.cluster))
        .map((persona) => persona.cluster))].sort((first, second) => first - second),
    [personas],
  );

  const visiblePersonas = useMemo(() => {
    const filteredPersonas =
      selectedCluster === "all"
        ? personas
        : personas.filter(
            (persona) => String(persona.cluster) === selectedCluster,
          );

    return [...filteredPersonas].sort((first, second) => {
      const firstCluster = isFiniteNumber(first.cluster)
        ? first.cluster
        : Number.POSITIVE_INFINITY;
      const secondCluster = isFiniteNumber(second.cluster)
        ? second.cluster
        : Number.POSITIVE_INFINITY;
      return firstCluster - secondCluster;
    });
  }, [personas, selectedCluster]);

  return (
    <div className="persona-page">
      <div className="persona-page-heading">
        <div>
          <p className="eyebrow">Profil hasil clustering</p>
          <h2>Player Persona</h2>
          <p className="persona-page-description">
            Ringkasan karakteristik pemain berdasarkan cluster dari data
            Firestore.
          </p>
          <p className="persona-page-note">
            Nama persona adalah label deskriptif hasil clustering, bukan
            kategori psikologis yang tervalidasi.
          </p>
        </div>
        {status === "success" && personas.length > 0 && (
          <label className="persona-filter">
            <span>Filter cluster</span>
            <select
              value={selectedCluster}
              onChange={(event) => setSelectedCluster(event.target.value)}
            >
              <option value="all">Semua cluster</option>
              {clusters.map((cluster) => (
                <option key={cluster} value={String(cluster)}>
                  Cluster {cluster}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {status === "loading" && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Memuat persona dari Firestore...</span>
        </div>
      )}

      {status === "error" && (
        <div className="dashboard-error" role="alert">
          <div>
            <h3>Data persona gagal dimuat</h3>
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

      {status === "success" && personas.length === 0 && (
        <div className="dashboard-empty" role="status">
          Data persona belum tersedia di Firestore.
        </div>
      )}

      {status === "success" && personas.length > 0 && (
        <>
          {visiblePersonas.length > 0 ? (
            <section
              className="persona-detail-grid"
              aria-label="Daftar persona"
            >
              {visiblePersonas.map((persona, index) => (
                <PersonaCard
                  key={persona.id ?? `persona-${index}`}
                  persona={persona}
                />
              ))}
            </section>
          ) : (
            <div className="dashboard-empty" role="status">
              Tidak ada persona untuk cluster yang dipilih.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PlayerPersona;
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Permintaan API gagal dengan status ${response.status}.`,
    );
  }

  return response.json();
}

export const getHealth = () => request("/health");
export const getDataset = () => request("/dataset");

export const analyzeSentiment = (review) =>
  request("/sentiment", {
    method: "POST",
    body: JSON.stringify({ review }),
  });

export const getPlayerPersona = (payload) =>
  request("/persona", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const predictPlaytime = (payload) =>
  request("/prediction", {
    method: "POST",
    body: JSON.stringify(payload),
  });
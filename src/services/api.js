const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      `Backend tidak dapat dihubungi di ${API_BASE_URL}. Periksa alamat API dan koneksi jaringan.`,
      { cause: error },
    );
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      }
    } catch {
      // Keep the response body as the error message when it is not JSON.
    }
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

export const analyzeAspects = (review) =>
  request("/absa", {
    method: "POST",
    body: JSON.stringify({ review }),
  });

export const getPersonaBatchAnalysis = () => request("/persona/batch");

export const getEngagementBatchAnalysis = () =>
  request("/prediction/batch");
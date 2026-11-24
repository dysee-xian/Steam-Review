import { get, ref } from "firebase/database";
import { database } from "./firebase";

export async function getEngagementEvaluationMetrics() {
  const path =
    "steam_review_analytics/v1/engagement_prediction/evaluation_metrics";

  try {
    const snapshot = await get(ref(database, path));

    if (!snapshot.exists()) {
      throw new Error(`Node ${path} tidak ditemukan.`);
    }

    const metrics = snapshot.val();
    if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
      throw new Error(`Format node ${path} tidak valid.`);
    }

    return metrics;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal membaca ${path}: ${details}`, { cause: error });
  }
}

import { get, ref } from "firebase/database";
import { database } from "./firebase";

export async function getDashboardSummary() {
  const path = "steam_review_analytics/v1/sentiment_analysis";

  try {
    const snapshot = await get(ref(database, path));

    if (!snapshot.exists()) {
      throw new Error(`Node ${path} tidak ditemukan.`);
    }

    return snapshot.val();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Gagal membaca ${path}: ${details}`,
      { cause: error },
    );
  }
}

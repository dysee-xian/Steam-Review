import { get, ref } from "firebase/database";
import { database } from "./firebase";

export async function getAbsaSummary() {
  const path = "steam_review_analytics/v1/absa/aspect_summary";

  try {
    const snapshot = await get(ref(database, path));

    if (!snapshot.exists()) {
      throw new Error(`Node ${path} tidak ditemukan.`);
    }

    const data = snapshot.val();
    if (!data || typeof data !== "object") {
      throw new Error(`Format node ${path} tidak valid.`);
    }

    const entries = Array.isArray(data)
      ? data.map((row, index) => [String(index), row])
      : Object.entries(data);

    return entries
      .sort(([first], [second]) => Number(first) - Number(second))
      .map(([id, row]) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) {
          throw new Error(`Data aspek pada node ${path}/${id} tidak valid.`);
        }
        return { ...row, id };
      });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal membaca ${path}: ${details}`, { cause: error });
  }
}

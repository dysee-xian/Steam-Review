import { get, ref } from "firebase/database";
import { database } from "./firebase";

export async function getPersonas() {
  const path = "steam_review_analytics/v1/saw/persona_summary";

  try {
    const snapshot = await get(ref(database, path));

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    if (!data || typeof data !== "object") {
      throw new Error(`Format node ${path} tidak valid.`);
    }

    const entries = Array.isArray(data)
      ? data.map((persona, index) => [String(index), persona])
      : Object.entries(data);

    return entries
      .sort(([first], [second]) => Number(first) - Number(second))
      .map(([id, persona]) => {
        const cluster = Number(id);
        if (
          !Number.isInteger(cluster) ||
          !persona ||
          typeof persona !== "object" ||
          Array.isArray(persona)
        ) {
          throw new Error(`Data persona pada node ${path}/${id} tidak valid.`);
        }

        return { ...persona, id, cluster };
      });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal membaca ${path}: ${details}`, {
      cause: error,
    });
  }
}

import { doc, getDocFromServer } from "firebase/firestore";
import { db } from "./firebase";

const sourceDocuments = [
  {
    key: "recommendations",
    collection: "recommendations",
    document: "game_ranking",
  },
  {
    key: "resonance",
    collection: "saw_results",
    document: "persona_resonance",
  },
  {
    key: "fatigue",
    collection: "fatigue_summaries",
    document: "playtime_patterns",
  },
];

export async function getRecommendationsData() {
  const results = await Promise.all(
    sourceDocuments.map(async ({ key, collection, document }) => {
      try {
        const snapshot = await getDocFromServer(
          doc(db, collection, document),
        );

        if (!snapshot.exists()) {
          throw new Error(`Dokumen ${collection}/${document} tidak ditemukan.`);
        }

        return [key, snapshot.data()];
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Gagal mengambil ${collection}/${document}: ${details}`,
          { cause: error },
        );
      }
    }),
  );

  return Object.fromEntries(results);
}

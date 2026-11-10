import { doc, getDocFromServer } from "firebase/firestore";
import { db } from "./firebase";

export async function getAbsaSummary() {
  try {
    const snapshot = await getDocFromServer(
      doc(db, "absa_summaries", "aspect_sentiment"),
    );

    if (!snapshot.exists()) {
      throw new Error(
        "Dokumen absa_summaries/aspect_sentiment tidak ditemukan.",
      );
    }

    return snapshot.data();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Gagal mengambil absa_summaries/aspect_sentiment: ${details}`,
      { cause: error },
    );
  }
}

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getDashboardSummary() {
  let snapshot;

  try {
    snapshot = await getDoc(
      doc(db, "dashboard_summaries", "persona_dashboard"),
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Gagal mengambil dashboard_summaries/persona_dashboard: ${details}`,
      { cause: error },
    );
  }

  if (!snapshot.exists()) {
    throw new Error(
      "Dokumen dashboard_summaries/persona_dashboard tidak ditemukan.",
    );
  }

  return snapshot.data();
}

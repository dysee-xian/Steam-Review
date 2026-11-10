import { collection, getDocsFromServer } from "firebase/firestore";
import { db } from "./firebase";

export async function getPersonas() {
  let snapshot;

  try {
    snapshot = await getDocsFromServer(collection(db, "personas"));
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal mengambil koleksi personas: ${details}`, {
      cause: error,
    });
  }

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((personaDoc) => ({
    id: personaDoc.id,
    ...personaDoc.data(),
  }));
}

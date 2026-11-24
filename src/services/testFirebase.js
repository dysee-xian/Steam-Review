import { ref, get } from "firebase/database";
import { database } from "./firebase";

export async function testFirebase() {
  try {
    const dbRef = ref(database, "steam_review_analytics/v1");
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      console.log("Firebase berhasil terhubung!");
      console.log("Data DPRF:", snapshot.val());
      return snapshot.val();
    } else {
      console.log("Koneksi berhasil, tetapi data tidak ditemukan.");
      return null;
    }
  } catch (error) {
    console.error("Gagal mengambil data Firebase:", error);
    throw error;
  }
}

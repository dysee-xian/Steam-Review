
import {
  collection,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";

import { db } from "./firebase";

export async function testFirebase() {
  try {
    console.log("Menghubungkan ke Firebase...");

    // Mengambil data dashboard
    const dashboardRef = doc(
      db,
      "dashboard_summaries",
      "persona_dashboard"
    );

    const dashboardSnapshot = await getDoc(dashboardRef);

    if (dashboardSnapshot.exists()) {
      console.log("Data Dashboard:", dashboardSnapshot.data());
    } else {
      console.log("Dokumen dashboard tidak ditemukan.");
    }

    // Mengambil data personas
    const personasSnapshot = await getDocs(
      collection(db, "personas")
    );

    const personasData = personasSnapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    console.log("Jumlah data personas:", personasSnapshot.size);
    console.log("Data Personas:", personasData);

    console.log("Pengujian Firebase selesai!");

  } catch (error) {
    console.error("Gagal mengambil data Firebase:", error);
  }
}

export default testFirebase;

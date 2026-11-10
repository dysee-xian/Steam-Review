import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const getReviews = async () => {
  const snapshot = await getDocs(
    collection(db, "dashboard_summaries")
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};
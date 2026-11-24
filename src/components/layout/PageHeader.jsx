import { UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/overview": "Overview",
  "/sentiment-analysis": "Analisis Sentimen",
  "/absa-analysis": "Analisis Aspek Game",
  "/player-persona": "Karakteristik Pemain",
  "/engagement-decline-prediction": "Keterlibatan Pemain",
  "/analysis-history": "Riwayat Analisis",
};

function PageHeader() {
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] ?? "Ikhtisar Analitik";

  return (
    <header className="topbar">
      <div>
        <p className="topbar-app-name">Steam Review Analytics</p>
        <h1 className="topbar-page-title">{pageTitle}</h1>
      </div>
      <div className="topbar-actions">
        <span className="topbar-section">Analitik Game</span>
        <span className="topbar-avatar" aria-hidden="true">
          <UserRound size={18} strokeWidth={1.8} />
        </span>
      </div>
    </header>
  );
}

export default PageHeader;
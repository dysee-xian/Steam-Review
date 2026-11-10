import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/player-persona": "Player Persona",
  "/sentiment-analysis": "Sentiment Analysis",
  "/playtime-prediction": "Playtime Prediction",
  "/recommendations": "Recommendations",
};

function Navbar() {
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="topbar">
      <div>
        <p className="topbar-app-name">Steam Review</p>
        <h1 className="topbar-page-title">{pageTitle}</h1>
      </div>
      <span className="topbar-section">Analytics</span>
    </header>
  );
}

export default Navbar;
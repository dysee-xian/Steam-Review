import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ABSAAnalysis from "./pages/ABSAAnalysis";
import AnalysisHistory from "./pages/AnalysisHistory";
import Dashboard from "./pages/Dashboard";
import EngagementDeclinePrediction from "./pages/EngagementDeclinePrediction";
import PlayerPersona from "./pages/PlayerPersona";
import SentimentAnalysis from "./pages/SentimentAnalysis";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Dashboard />} />
          <Route
            path="dashboard"
            element={<Navigate to="/overview" replace />}
          />
          <Route path="player-persona" element={<PlayerPersona />} />
          <Route path="sentiment-analysis" element={<SentimentAnalysis />} />
          <Route path="absa-analysis" element={<ABSAAnalysis />} />
          <Route
            path="engagement-decline-prediction"
            element={<EngagementDeclinePrediction />}
          />
          <Route path="analysis-history" element={<AnalysisHistory />} />
          <Route
            path="playtime-prediction"
            element={
              <Navigate to="/engagement-decline-prediction" replace />
            }
          />
          <Route
            path="recommendations"
            element={<Navigate to="/analysis-history" replace />}
          />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

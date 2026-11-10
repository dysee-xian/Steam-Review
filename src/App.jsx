import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import PlayerPersona from "./pages/PlayerPersona";
import PlaytimePrediction from "./pages/PlaytimePrediction";
import Recommendations from "./pages/Recommendations";
import SentimentAnalysis from "./pages/SentimentAnalysis";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="player-persona" element={<PlayerPersona />} />
          <Route path="sentiment-analysis" element={<SentimentAnalysis />} />
          <Route path="playtime-prediction" element={<PlaytimePrediction />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

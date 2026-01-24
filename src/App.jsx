import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/admin/Home";
import Expeditions from "./pages/admin/Expeditions";
import Factures from "./pages/admin/Factures";
import Clients from "./pages/admin/client";
import Paiements from "./pages/admin/Paiements";
import Reclamations from "./pages/admin/reclamation";
import Incidents from "./pages/admin/Incidents";
import Chauffeur from "./pages/admin/Chauffeur";
import Vehicule from "./pages/admin/Vehicule";
import Tournee from "./pages/admin/Tournee";
import Destination from "./pages/admin/Destination";
import Tarification from "./pages/admin/Tarification";
function App() {
  return (
    <Routes>
      {/* routes publiques */}
      <Route path="/login" element={<Login />} />

      {/* routes admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Home />} />

        <Route path="clients" element={<Clients />} />
        <Route path="expeditions" element={<Expeditions />} />
        <Route path="factures" element={<Factures />} />
        <Route path="paiements" element={<Paiements />} />
        <Route path="reclamations" element={<Reclamations />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="chauffeurs" element={<Chauffeur />} />
        <Route path="vehicules" element={<Vehicule />} />
        <Route path="tournees" element={<Tournee />} />
        <Route path="destinations" element={<Destination />} />
        <Route path="tarification" element={<Tarification />} />
        {/* Routes vides pour les autres sections */}
       
      </Route>

      {/* Redirection par défaut */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Composant temporaire pour les pages en construction
const ComingSoon = ({ title }) => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "70vh",
    flexDirection: "column",
    gap: 16
  }}>
    <h1 style={{ fontSize: 48, color: "#999" }}>🚧</h1>
    <h2>{title}</h2>
    <p style={{ color: "#666" }}>Cette section sera bientôt disponible</p>
  </div>
);

export default App;
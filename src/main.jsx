import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ExpeditionProvider } from "./context/ExpeditionContext";
import { FactureProvider } from "./context/FactureContext";
import { ClientProvider } from "./context/clientContext";
import { PaiementProvider } from "./context/PaiementContext";
import { ReclamationProvider } from "./context/ReclamationContext";
import { IncidentProvider } from "./context/incidentContext";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ExpeditionProvider>
      <FactureProvider>
        <ClientProvider>
          <PaiementProvider>
            <ReclamationProvider>
            <IncidentProvider>
            <App />
            </IncidentProvider>
            </ReclamationProvider>
          </PaiementProvider>
        </ClientProvider>
      </FactureProvider>
    </ExpeditionProvider>
  </BrowserRouter>
);
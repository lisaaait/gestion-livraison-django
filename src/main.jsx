import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ExpeditionProvider } from "./context/ExpeditionContext";
import { FactureProvider } from "./context/FactureContext";
import { ClientProvider } from "./context/clientContext";
import { PaiementProvider } from "./context/PaiementContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ExpeditionProvider>
      <FactureProvider>
        <ClientProvider>
          <PaiementProvider>
            <App />
          </PaiementProvider>
        </ClientProvider>
      </FactureProvider>
    </ExpeditionProvider>
  </BrowserRouter>
);
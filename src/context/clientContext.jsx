import React, { createContext, useState, useCallback } from "react";
import {
  mockClients,
  mockExpeditionsParClient,
  mockFacturesParClient,
} from "../data/mockDataClients";

export const ClientContext = createContext();

const USE_MOCK_DATA = true;

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);

  const fetchClients = useCallback(async () => {
    try {
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          setClients(mockClients);
        }, 300);
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur fetch clients", error);
      setClients([]);
    }
  }, []);

  const ajouterClient = async (client) => {
    try {
      if (USE_MOCK_DATA) {
        const nouveauClient = {
          ...client,
          id: clients.length + 1,
          code: `CLI-${String(clients.length + 1).padStart(3, "0")}`,
          solde: 0,
          dateInscription: new Date().toISOString().split("T")[0],
        };
        setClients([...clients, nouveauClient]);
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur ajout client", error);
    }
  };

  const modifierClient = async (id, clientModifie) => {
    try {
      if (USE_MOCK_DATA) {
        setClients(
          clients.map((client) =>
            client.id === id ? { ...client, ...clientModifie } : client
          )
        );
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur modification client", error);
    }
  };

  const supprimerClient = async (id) => {
    try {
      if (USE_MOCK_DATA) {
        setClients(clients.filter((client) => client.id !== id));
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur suppression client", error);
    }
  };

  const getExpeditionsClient = (clientId) => {
    return mockExpeditionsParClient[clientId] || [];
  };

  const getFacturesClient = (clientId) => {
    return mockFacturesParClient[clientId] || [];
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        fetchClients,
        ajouterClient,
        modifierClient,
        supprimerClient,
        getExpeditionsClient,
        getFacturesClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};
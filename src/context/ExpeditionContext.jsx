import React, { createContext, useState, useCallback } from "react";
import axios from "axios";
import { mockExpeditions } from "../data/mockData";

export const ExpeditionContext = createContext();

// Flag pour basculer entre mock et API réelle
const USE_MOCK_DATA = true; // Change en false quand le backend sera prêt

export const ExpeditionProvider = ({ children }) => {
  const [expeditions, setExpeditions] = useState([]);
  const role = localStorage.getItem("role");

  const fetchExpeditions = useCallback(async () => {
    try {
      if (USE_MOCK_DATA) {
        // Simulation d'un délai réseau
        setTimeout(() => {
          setExpeditions(mockExpeditions);
        }, 300);
      } else {
        const url =
          role === "admin"
            ? "http://localhost:5000/api/expeditions/admin"
            : "http://localhost:5000/api/expeditions";

        const res = await axios.get(url, { withCredentials: true });
        setExpeditions(res.data);
      }
    } catch (error) {
      console.error("Erreur fetch expéditions", error);
      setExpeditions([]);
    }
  }, [role]);

  const updateStatut = async (id, statut) => {
    try {
      if (USE_MOCK_DATA) {
        // Mise à jour locale des données mockées
        setExpeditions(prevExpeditions =>
          prevExpeditions.map(exp =>
            exp.id === id ? { ...exp, statut } : exp
          )
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/expeditions/${id}`,
          { statut },
          { withCredentials: true }
        );
        fetchExpeditions();
      }
    } catch (error) {
      console.error("Erreur MAJ statut", error);
    }
  };

  return (
    <ExpeditionContext.Provider
      value={{ expeditions, fetchExpeditions, updateStatut }}
    >
      {children}
    </ExpeditionContext.Provider>
  );
};
import React, { createContext, useState, useCallback } from "react";
import { mockPaiements, statistiquesPaiements } from "../data/mockDataPaiements";

export const PaiementContext = createContext();

const USE_MOCK_DATA = true;

export const PaiementProvider = ({ children }) => {
  const [paiements, setPaiements] = useState([]);
  const [statistiques, setStatistiques] = useState(statistiquesPaiements);

  const fetchPaiements = useCallback(async () => {
    try {
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          setPaiements(mockPaiements);
          setStatistiques(statistiquesPaiements);
        }, 300);
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur fetch paiements", error);
      setPaiements([]);
    }
  }, []);

  const ajouterPaiement = async (paiement) => {
    try {
      if (USE_MOCK_DATA) {
        const nouveauPaiement = {
          ...paiement,
          id: paiements.length + 1,
          reference: `PAY-2024-${String(paiements.length + 1).padStart(3, "0")}`,
          statut: "validé",
          agentNom: "Agent actuel",
        };
        setPaiements([nouveauPaiement, ...paiements]);
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur ajout paiement", error);
    }
  };

  const annulerPaiement = async (id, motif) => {
    try {
      if (USE_MOCK_DATA) {
        setPaiements(
          paiements.map((paiement) =>
            paiement.id === id
              ? {
                  ...paiement,
                  statut: "annulé",
                  commentaire: `${paiement.commentaire} | ANNULÉ: ${motif}`,
                }
              : paiement
          )
        );
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur annulation paiement", error);
    }
  };

  return (
    <PaiementContext.Provider
      value={{
        paiements,
        statistiques,
        fetchPaiements,
        ajouterPaiement,
        annulerPaiement,
      }}
    >
      {children}
    </PaiementContext.Provider>
  );
};
import React, { createContext, useState, useCallback } from "react";
import { mockFactures, mockClients } from "../data/mockDataFactures";

export const FactureContext = createContext();

const USE_MOCK_DATA = true;

export const FactureProvider = ({ children }) => {
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);

  const fetchFactures = useCallback(async () => {
    try {
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          setFactures(mockFactures);
        }, 300);
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur fetch factures", error);
      setFactures([]);
    }
  }, []);

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

  const ajouterPaiement = async (factureId, paiement) => {
    try {
      if (USE_MOCK_DATA) {
        setFactures((prevFactures) =>
          prevFactures.map((facture) => {
            if (facture.id === factureId) {
              const nouveauMontantPaye = facture.montantPaye + paiement.montant;
              const nouveauMontantRestant = facture.montantTTC - nouveauMontantPaye;
              const nouveauStatut =
                nouveauMontantRestant === 0
                  ? "payée"
                  : nouveauMontantPaye > 0
                  ? "partiellement payée"
                  : "impayée";

              return {
                ...facture,
                montantPaye: nouveauMontantPaye,
                montantRestant: nouveauMontantRestant,
                statut: nouveauStatut,
                paiements: [
                  ...facture.paiements,
                  { ...paiement, id: facture.paiements.length + 1 },
                ],
              };
            }
            return facture;
          })
        );

        // Mettre à jour le solde client si paiement partiel
        setClients((prevClients) =>
          prevClients.map((client) => {
            const facture = factures.find((f) => f.id === factureId);
            if (client.id === facture.clientId) {
              const nouveauMontantPaye = facture.montantPaye + paiement.montant;
              const nouveauMontantRestant = facture.montantTTC - nouveauMontantPaye;
              return {
                ...client,
                solde: client.solde - facture.montantRestant + nouveauMontantRestant,
              };
            }
            return client;
          })
        );
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur ajout paiement", error);
    }
  };

  const supprimerFacture = async (factureId) => {
    try {
      if (USE_MOCK_DATA) {
        const facture = factures.find((f) => f.id === factureId);
        
        // Mettre à jour le solde client
        setClients((prevClients) =>
          prevClients.map((client) => {
            if (client.id === facture.clientId) {
              return {
                ...client,
                solde: client.solde - facture.montantRestant,
              };
            }
            return client;
          })
        );

        // Supprimer la facture
        setFactures((prevFactures) =>
          prevFactures.filter((f) => f.id !== factureId)
        );
      } else {
        // API call ici
      }
    } catch (error) {
      console.error("Erreur suppression facture", error);
    }
  };

  return (
    <FactureContext.Provider
      value={{
        factures,
        clients,
        fetchFactures,
        fetchClients,
        ajouterPaiement,
        supprimerFacture,
      }}
    >
      {children}
    </FactureContext.Provider>
  );
};
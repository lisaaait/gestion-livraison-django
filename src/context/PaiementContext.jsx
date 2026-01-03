// src/context/PaiementContext.jsx
import React, { createContext, useState, useCallback } from "react";
import { api } from "../services/api";

export const PaiementContext = createContext();

// Normalisation d'un paiement venant du backend
const mapPaiementFromDB = (p) => ({
  id: p.id ?? null,
  reference: p.reference ?? p.reference_p ?? "",
  date: p.date ?? null,
  montant: parseFloat(p.montant_verse ?? p.montant ?? 0) || 0,
  mode: p.mode_paiement ?? "",
  modeDisplay: p.mode_paiement_display ?? "",
  remarques: p.remarques ?? "",
  // CORRECTION: Utiliser code_facture (string) au lieu de code_facture_id
  code_facture: p.code_facture ?? null,
  code_facture_str: p.code_facture_str ?? p.code_facture ?? null,
  date_creation: p.date_creation ?? null,
  raw: p,
});

const mapPaiementToDB = (paiementData) => {
  // CORRECTION CRITIQUE: Assurer que tous les champs requis sont présents
  const payload = {
    // Le backend attend 'code_facture' (string), pas 'code_client'
    code_facture: paiementData.code_facture,
    // Date au format YYYY-MM-DD
    date: paiementData.date,
    // Montant numérique (pas de string)
    montant_verse: Number(paiementData.montant),
    // Mode de paiement
    mode_paiement: paiementData.mode,
    // Remarques (optionnel)
    remarques: paiementData.remarques || "",
  };

  // Ajouter la référence seulement si fournie (sinon backend génère auto)
  if (paiementData.reference && paiementData.reference.trim() !== "") {
    payload.reference_p = paiementData.reference;
  }

  return payload;
};

export const PaiementProvider = ({ children }) => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Récupérer tous les paiements
  const fetchPaiements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.paiements.getAll();
      const arr = Array.isArray(data) ? data : data.results || [];
      setPaiements(arr.map(mapPaiementFromDB));
    } catch (error) {
      console.error("Erreur fetch paiements", error);
      setPaiements([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les paiements d'une facture spécifique
  const fetchPaiementsByFacture = useCallback(async (codeFacture) => {
    try {
      const data = await api.factures.getPaiements(codeFacture);
      return Array.isArray(data) ? data.map(mapPaiementFromDB) : [];
    } catch (error) {
      console.error("Erreur fetch paiements facture", error);
      throw error;
    }
  }, []);

  // Créer un paiement
  const creerPaiement = async (paiementData) => {
    try {
      const payload = mapPaiementToDB(paiementData);
      
      // === DEBUG: Afficher les données ===
console.log("=== CRÉATION PAIEMENT ===");
console.log("Données reçues:", JSON.stringify(paiementData, null, 2));
console.log("Payload envoyé au backend:", JSON.stringify(payload, null, 2));
console.log("========================");
      
      const nouveauPaiement = await api.paiements.create(payload);
      await fetchPaiements();
      return mapPaiementFromDB(nouveauPaiement);
    } catch (error) {
      console.error("Erreur création paiement", error);
      
      // Afficher les détails de l'erreur backend
      if (error.response?.data) {
        console.error("Détails erreur backend:", JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  };

  // Modifier un paiement
  const modifierPaiement = async (paiementId, paiementData) => {
    try {
      const payload = mapPaiementToDB(paiementData);
      console.log("Modification paiement - payload:", payload);
      
      const updated = await api.paiements.update(paiementId, payload);
      await fetchPaiements();
      return mapPaiementFromDB(updated);
    } catch (error) {
      console.error("Erreur modification paiement", error);
      
      if (error.response?.data) {
        console.error("Détails erreur backend:", error.response.data);
      }
      
      throw error;
    }
  };

  // Supprimer un paiement
  const supprimerPaiement = async (paiementId) => {
    try {
      await api.paiements.delete(paiementId);
      setPaiements((prev) => prev.filter((p) => p.id !== paiementId));
    } catch (error) {
      console.error("Erreur suppression paiement", error);
      throw error;
    }
  };

  // Récupérer les statistiques des paiements
  const fetchStatistiques = useCallback(async () => {
    try {
      const stats = await api.paiements.statistiques();
      return stats;
    } catch (error) {
      console.error("Erreur fetch statistiques paiements", error);
      throw error;
    }
  }, []);

  return (
    <PaiementContext.Provider
      value={{
        paiements,
        loading,
        fetchPaiements,
        fetchPaiementsByFacture,
        creerPaiement,
        modifierPaiement,
        supprimerPaiement,
        fetchStatistiques,
      }}
    >
      {children}
    </PaiementContext.Provider>
  );
};
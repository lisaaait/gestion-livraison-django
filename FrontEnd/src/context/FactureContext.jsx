import React, { createContext, useState, useCallback } from "react";
import { api } from "../services/api";

export const FactureContext = createContext();

/**
 * Normalise un objet client venant du backend vers la forme attendue par le front
 * Backend example fields: CodeClient, Nom, Prenom, Adresse, Tel, Email, Solde
 */
const normalizeClient = (c) => ({
  id: c.CodeClient ?? c.id ?? null,
  nom: c.Nom ?? c.nom ?? "",
  prenom: c.Prenom ?? c.prenom ?? "",
  adresse: c.Adresse ?? c.adresse ?? "",
  tel: c.Tel ?? c.tel ?? "",
  email: c.Email ?? c.email ?? "",
  solde: parseFloat(c.Solde ?? c.solde ?? 0) || 0,
  // keep original if needed
  raw: c,
});

const mapFactureFromDB = (factureDB) => {
  if (!factureDB) return null;
  const montantPaye =
    parseFloat(factureDB.montant_paye ?? factureDB.montantPaye ?? 0) || 0;
  const ttc = parseFloat(factureDB.ttc ?? 0) || 0;
  const montantRestant =
    parseFloat(factureDB.montant_restant ?? factureDB.reste_a_payer ?? (ttc - montantPaye)) || 0;

   return {
    // CORRECTION : utiliser code_facture comme ID
    id: factureDB.code_facture,
    code_facture: factureDB.code_facture,
    date_f: factureDB.date_f,
    ht: parseFloat(factureDB.ht) || 0,
    tva: parseFloat(factureDB.tva) || 0,
    ttc,
    code_client_id: factureDB.code_client ?? factureDB.code_client_id ?? null,
    date_creation: factureDB.date_creation,
    remarques: factureDB.remarques || "",
    est_payee: factureDB.est_payee || false,
    clientNom: factureDB.client_nom ?? factureDB.clientNom ?? "Client inconnu",
    clientPrenom: factureDB.client_prenom ?? factureDB.clientPrenom ?? "",
    montantPaye,
    montantRestant,
    paiements: factureDB.paiements || [],
  };
};

const mapFactureToDB = (factureData) => ({
  // Ne pas envoyer code_facture si vide (laisser le backend le générer)
  ...(factureData.code_facture && { code_facture: factureData.code_facture }),
  date_f: factureData.date_f,
  ht: factureData.ht || 0,
  tva: factureData.tva || 0,
  ttc: factureData.ttc,
  // CORRECTION CRITIQUE : envoyer 'code_client' pas 'code_client_id'
  code_client: factureData.code_client_id ?? factureData.code_client,
  remarques: factureData.remarques || "",
  est_payee: factureData.est_payee || false,
  // Ne pas envoyer date_creation, laissez Django le gérer automatiquement
});
export const FactureProvider = ({ children }) => {
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFactures = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.factures.getAll();
      const facturesArray = Array.isArray(data) ? data : data.results || [];
      const facturesMapped = facturesArray.map(mapFactureFromDB).filter(Boolean);
      setFactures(facturesMapped);
    } catch (error) {
      console.error("Erreur fetch factures", error);
      setFactures([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const data = await api.clients.getAll();
      const arr = Array.isArray(data) ? data : data.results || [];
      const normalized = arr.map(normalizeClient);
      setClients(normalized);
    } catch (error) {
      console.error("Erreur fetch clients", error);
      setClients([]);
      throw error;
    }
  }, []);

// Partie corrigée de FactureContext.jsx pour ajouterPaiement

const ajouterPaiement = async (codeFacture, paiement) => {
  try {
    // Construire les données selon ce que le backend attend
    const paiementData = {
      code_facture: codeFacture, // Code facture (string comme "FACT-00001")
      date: paiement.datePaiement, // Format: "YYYY-MM-DD"
      montant_verse: paiement.montant, // Montant en nombre
      mode_paiement: paiement.modePaiement, // Ex: "Espèces", "Chèque", etc.
      reference_p: paiement.reference, // Référence du paiement
      remarques: paiement.remarques || "",
    };

    console.log("Envoi paiement:", paiementData); // Pour debug

    const nouveauPaiement = await api.paiements.create(paiementData);
    
    // Recharger les factures pour mettre à jour les montants
    await fetchFactures();
    
    return nouveauPaiement;
  } catch (error) {
    console.error("Erreur ajout paiement:", error);
    
    // Afficher le message d'erreur détaillé
    if (error.response?.data) {
      console.error("Détails erreur backend:", error.response.data);
    }
    
    throw error;
  }
};
  async function supprimerFacture(code_Facture) {
    try {
      await api.factures.delete(code_Facture);
      setFactures((prev) => prev.filter((f) => f.id !== code_Facture));
    } catch (error) {
      console.error("Erreur suppression facture", error);
      throw error;
    }
  }

  const creerFacture = async (factureData) => {
    try {
      const factureBDD = mapFactureToDB(factureData);
      const nouvelleFacture = await api.factures.create(factureBDD);
      await fetchFactures();
      return nouvelleFacture;
    } catch (error) {
      console.error("Erreur création facture", error);
      throw error;
    }
  };

  const modifierFacture = async (factureId, factureData) => {
    try {
      const factureBDD = mapFactureToDB(factureData);
      const factureModifiee = await api.factures.update(factureId, factureBDD);
      await fetchFactures();
      return factureModifiee;
    } catch (error) {
      console.error("Erreur modification facture", error);
      throw error;
    }
  };

  return (
    <FactureContext.Provider
      value={{
        factures,
        clients,
        loading,
        fetchFactures,
        fetchClients,
        ajouterPaiement,
        supprimerFacture,
        creerFacture,
        modifierFacture,
      }}
    >
      {children}
    </FactureContext.Provider>
  );
};
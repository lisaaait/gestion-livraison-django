import React, { createContext, useState, useCallback } from "react";
import { tournees as apiTournees } from "../services/api.js";

export const TourneeContext = createContext();

export const TourneeProvider = ({ children }) => {
  const [tournees, setTournees] = useState([]);
  const [statistiques, setStatistiques] = useState({
    total: 0,
    aujourdHui: 0,
    Planifiée: 0,
    Encours: 0,
    Terminées: 0,
  });

  // --- Fetch toutes les tournées ---
  const fetchTournees = useCallback(async () => {
    try {
      const data = await apiTournees.getAll();

      // Si backend DRF paginé : récupérer data.results
      const listeTournees = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      setTournees(listeTournees);
      recalculerStats(listeTournees);
    } catch (error) {
      console.error("Erreur fetch tournées", error.response?.data || error.message);
      setTournees([]);
    }
  }, []);

  // --- Ajouter tournée ---
  const ajouterTournee = async (tournee) => {
    try {
      console.log("=== AJOUT TOURNÉE ===");
      console.log("Données envoyées:", tournee);
      console.log("JSON:", JSON.stringify(tournee, null, 2));

      const nouvelleTournee = await apiTournees.create(tournee);
      
      console.log("Réponse backend:", nouvelleTournee);
      
      // Rafraîchir la liste complète depuis le serveur
      await fetchTournees();
      
      return nouvelleTournee;
    } catch (error) {
      console.error("=== ERREUR AJOUT TOURNÉE ===");
      console.error("Status:", error.response?.status);
      console.error("Données erreur:", JSON.stringify(error.response?.data, null, 2));
      console.error("Message:", error.message);
      throw error; // Relancer l'erreur pour que le composant puisse la gérer
    }
  };

  // --- Modifier tournée ---
  const modifierTournee = async (code_t, tourneeModifiee) => {
    try {
      console.log("Modification tournée:", code_t, tourneeModifiee);
      const updated = await apiTournees.update(code_t, tourneeModifiee);
      await fetchTournees(); // Rafraîchir la liste
      return updated;
    } catch (error) {
      console.error("Erreur modification tournée", error.response?.data || error.message);
      throw error;
    }
  };

  // --- Changer statut tournée ---
  const changerStatutTournee = async (code_t, nouveauStatut) => {
    try {
      await apiTournees.patch(code_t, { statut: nouveauStatut });
      await fetchTournees(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur changement statut tournée", error.response?.data || error.message);
      throw error;
    }
  };

  // --- Supprimer tournée ---
  const supprimerTournee = async (code_t) => {
    try {
      await apiTournees.delete(code_t);
      await fetchTournees(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur suppression tournée", error.response?.data || error.message);
      throw error;
    }
  };

  // --- Recalcul statistiques ---
  const recalculerStats = (data) => {
    if (!Array.isArray(data)) return;
    
    const today = new Date().toISOString().slice(0, 10);
    
    setStatistiques({
      total: data.length,
      aujourdHui: data.filter((t) => t.date_tournee === today).length,
      Planifiée: data.filter((t) => t.statut === "Planifiée").length,
      Encours: data.filter((t) => t.statut === "EN_COURS").length,
      Terminées: data.filter((t) => t.statut === "TERMINEE").length,
    });
  };

  return (
    <TourneeContext.Provider
      value={{
        tournees,
        statistiques,
        fetchTournees,
        ajouterTournee,
        modifierTournee,
        changerStatutTournee,
        supprimerTournee,
        recalculerStats,
      }}
    >
      {children}
    </TourneeContext.Provider>
  );
};
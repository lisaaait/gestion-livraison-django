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
      console.error("Erreur fetch tournées", error);
      setTournees([]);
    }
  }, []);

  // --- Ajouter tournée ---
  const ajouterTournee = async (tournee) => {
    try {
      const nouvelleTournee = await apiTournees.create(tournee);
      const nouvellesTournees = [nouvelleTournee, ...tournees];
      setTournees(nouvellesTournees);
      recalculerStats(nouvellesTournees);
    } catch (error) {
      console.error("Erreur ajout tournée", error);
    }
  };

  // --- Modifier tournée ---
  const modifierTournee = async (id, tourneeModifiee) => {
    try {
      const updated = await apiTournees.update(id, tourneeModifiee);
      const nouvellesTournees = tournees.map((t) => (t.id === id ? updated : t));
      setTournees(nouvellesTournees);
      recalculerStats(nouvellesTournees);
    } catch (error) {
      console.error("Erreur modification tournée", error);
    }
  };

  // --- Changer statut tournée ---
  const changerStatutTournee = async (id, nouveauStatut) => {
    try {
      const t = tournees.find((t) => t.id === id);
      if (!t) return;
      const updated = await apiTournees.patch(id, { statut: nouveauStatut });
      const nouvellesTournees = tournees.map((t) => (t.id === id ? updated : t));
      setTournees(nouvellesTournees);
      recalculerStats(nouvellesTournees);
    } catch (error) {
      console.error("Erreur changement statut tournée", error);
    }
  };

  // --- Supprimer tournée ---
  const supprimerTournee = async (id) => {
    try {
      await apiTournees.delete(id);
      const nouvellesTournees = tournees.filter((t) => t.id !== id);
      setTournees(nouvellesTournees);
      recalculerStats(nouvellesTournees);
    } catch (error) {
      console.error("Erreur suppression tournée", error);
    }
  };

  // --- Recalcul statistiques ---
  const recalculerStats = (data) => {
    const today = new Date().toISOString().slice(0, 10);
    setStatistiques({
      total: data.length,
      aujourdHui: data.filter((t) => t.dateTournee === today).length,
      Planifiée: data.filter((t) => t.statut === "Planifiée").length,
      Encours: data.filter((t) => t.statut === "En cours").length,
      Terminées: data.filter((t) => t.statut === "Terminée").length,
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

import React, { createContext, useState, useCallback } from "react";
import { tournees as apiTournees } from "../services/api.js";
import { message } from "antd";
import { api } from "../services/api.js";
export const TourneeContext = createContext();


export const TourneeProvider = ({ children }) => {
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      const data = await api.tournees.getAll();
      setTournees(data);
      recalculerStats(data);
    } catch (error) {
      console.error("Erreur fetch tournées:", error);
      message.error("Erreur lors du chargement des tournées");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Ajouter tournée ---
  const ajouterTournee = async (data) => {
    try {
      console.log("=== AJOUT TOURNÉE ===");
      
      const correctedData = {
        ...data,
        expeditions: data.expeditions.map(exp => {
          return exp.numexp || exp.id || exp.code || exp;
        })
      };
      
      console.log("✅ Données corrigées:", correctedData);
      console.log("JSON envoyé:", JSON.stringify(correctedData, null, 2));
      
      const response = await api.tournees.create(correctedData);
      
      setTournees([...tournees, response]);
      message.success("Tournée ajoutée avec succès");
      fetchTournees();
      return response;
    } catch (error) {
      console.log("=== ERREUR AJOUT TOURNÉE ===");
      console.log("Status:", error.response?.status);
      console.log("Données erreur COMPLÈTES:", error.response?.data);
      
      const errorData = error.response?.data;
      
      // Afficher TOUS les détails de l'erreur
      if (errorData?.expeditions) {
        console.log("🔴 Erreur expeditions:", errorData.expeditions);
        console.log("🔴 Détail complet:", JSON.stringify(errorData.expeditions, null, 2));
      }
      
      if (errorData?.chauffeur) {
        console.log("🔴 Erreur chauffeur:", errorData.chauffeur);
      }
      
      if (errorData?.vehicule) {
        console.log("🔴 Erreur vehicule:", errorData.vehicule);
      }
      
      let errorMsg = "Erreur lors de l'ajout de la tournée";
      
      for (const key in errorData) {
        if (Array.isArray(errorData[key]) && errorData[key].length > 0) {
          errorMsg = `${key}: ${errorData[key][0]}`;
          break;
        }
      }
      
      console.log("📍 Message d'erreur final:", errorMsg);
      message.error(errorMsg);
      throw error;
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
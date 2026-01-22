import React, { createContext, useState, useCallback } from "react";
import { vehicules as vehiculeAPI } from "../services/api";

export const VehiculeContext = createContext();

export const VehiculeProvider = ({ children }) => {
  const [vehicules, setVehicules] = useState([]);
  const [statistiques, setStatistiques] = useState({ 
    total: 0, 
    disponibles: 0, 
    enMission: 0, 
    enMaintenance: 0 
  });

  const fetchVehicules = useCallback(async () => {
    try {
      const response = await vehiculeAPI.getAll();
      const data = Array.isArray(response) ? response : response.results || [];
      setVehicules(data);
      recalculerStats(data);
    } catch (error) {
      console.error("Erreur fetch véhicules", error.response?.data || error.message);
      setVehicules([]);
      setStatistiques({ total: 0, disponibles: 0, enMission: 0, enMaintenance: 0 });
    }
  }, []);

  const ajouterVehicule = async (vehicule) => {
    try {
      // Validation du matricule (doit être exactement 6 caractères)
      let matricule = vehicule.matricule.trim();
      
      if (matricule.length > 6) {
        throw new Error("Le matricule ne peut pas dépasser 6 caractères");
      }
      
      // Padding à 6 caractères si nécessaire
      matricule = matricule.padStart(6, "0");

      // Construction du payload pour le backend
      const payload = {
        matricule: matricule,
        type_vehicule: vehicule.type_vehicule,
        capacite_poids: Number(vehicule.capacite_poids),
        capacite_volume: Number(vehicule.capacite_volume),
        etat: "Opérationnel", // ✅ Correspond au défaut du modèle Django
      };

      console.log("Payload envoyé:", payload);
      console.log("Payload JSON:", JSON.stringify(payload));

      const res = await vehiculeAPI.create(payload);
      await fetchVehicules();
    } catch (error) {
      console.error("Erreur ajout véhicule - Status:", error.response?.status);
      console.error("Erreur ajout véhicule - Data:", error.response?.data);
      console.error("Erreur ajout véhicule - Message:", error.message);
      throw error;
    }
  };

  const modifierVehicule = async (matricule, vehiculeModifie) => {
    try {
      const payload = {
        matricule: vehiculeModifie.matricule,
        type_vehicule: vehiculeModifie.type_vehicule,
        capacite_poids: Number(vehiculeModifie.capacite_poids),
        capacite_volume: Number(vehiculeModifie.capacite_volume),
      };

      const res = await vehiculeAPI.update(matricule, payload);
      await fetchVehicules(); // Rafraîchir la liste
      return res;
    } catch (error) {
      console.error("Erreur modification véhicule", error.response?.data || error.message);
      throw error;
    }
  };

  const changerEtatVehicule = async (matricule, nouvelEtat) => {
    try {
      await vehiculeAPI.patch(matricule, { etat: nouvelEtat });
      await fetchVehicules(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur changement état", error.response?.data || error.message);
      throw error;
    }
  };

  const supprimerVehicule = async (matricule) => {
    try {
      await vehiculeAPI.delete(matricule);
      await fetchVehicules(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur suppression véhicule", error.response?.data || error.message);
      throw error;
    }
  };

  const recalculerStats = (data) => {
    if (!Array.isArray(data)) return;
    setStatistiques({
      total: data.length,
      disponibles: data.filter(v => v.etat === "Disponible").length,
      enMission: data.filter(v => v.etat === "En mission").length,
      enMaintenance: data.filter(v => v.etat === "En maintenance").length,
    });
  };

  return (
    <VehiculeContext.Provider 
      value={{ 
        vehicules, 
        statistiques, 
        fetchVehicules, 
        ajouterVehicule, 
        modifierVehicule, 
        supprimerVehicule, 
        changerEtatVehicule 
      }}
    >
      {children}
    </VehiculeContext.Provider>
  );
};
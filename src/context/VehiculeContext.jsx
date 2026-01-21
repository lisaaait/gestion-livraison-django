import React, { createContext, useState, useCallback } from "react";
import { vehicules as vehiculeAPI } from "../services/api";

export const VehiculeContext = createContext();

export const VehiculeProvider = ({ children }) => {
  const [vehicules, setVehicules] = useState([]);
  const [statistiques, setStatistiques] = useState({ total: 0, disponibles: 0, enMission: 0, enMaintenance: 0 });

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
      const payload = {
        matricule: String(vehicule.matricule).padStart(6, "0"),
        type_vehicule: vehicule.type_vehicule.toUpperCase(),
        capacite_poids: Number(vehicule.capacite_poids),
        capacite_volume: Number(vehicule.capacite_volume),
        etat: "Disponible",
      };
      const res = await vehiculeAPI.create(payload);
      const newList = [res, ...vehicules];
      setVehicules(newList);
      recalculerStats(newList);
    } catch (error) {
      console.error("Erreur ajout véhicule", error.response?.data || error.message);
      throw error;
    }
  };

  const modifierVehicule = async (matricule, vehiculeModifie) => {
    try {
      const res = await vehiculeAPI.update(matricule, vehiculeModifie);
      const newList = vehicules.map(v => v.matricule === matricule ? res : v);
      setVehicules(newList);
      recalculerStats(newList);
      return res;
    } catch (error) {
      console.error("Erreur modification véhicule", error.response?.data || error.message);
      throw error;
    }
  };

  const changerEtatVehicule = async (matricule, nouvelEtat) => {
    try {
      await vehiculeAPI.patch(matricule, { etat: nouvelEtat });
      const newList = vehicules.map(v => v.matricule === matricule ? { ...v, etat: nouvelEtat } : v);
      setVehicules(newList);
      recalculerStats(newList);
    } catch (error) {
      console.error("Erreur changement état", error.response?.data || error.message);
    }
  };

  const supprimerVehicule = async (matricule) => {
    try {
      await vehiculeAPI.delete(matricule);
      const newList = vehicules.filter(v => v.matricule !== matricule);
      setVehicules(newList);
      recalculerStats(newList);
    } catch (error) {
      console.error("Erreur suppression véhicule", error.response?.data || error.message);
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
    <VehiculeContext.Provider value={{ vehicules, statistiques, fetchVehicules, ajouterVehicule, modifierVehicule, supprimerVehicule, changerEtatVehicule }}>
      {children}
    </VehiculeContext.Provider>
  );
};

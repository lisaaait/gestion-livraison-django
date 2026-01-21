import React, { createContext, useState, useCallback } from "react";
import { message } from "antd";
import { api } from "../services/api.js";

export const DestinationContext = createContext();

export const DestinationProvider = ({ children }) => {
  const [destinations, setDestinations] = useState([]);
  const [statistiques, setStatistiques] = useState({
    total: 0,
    nord: 0,
    sud: 0,
    est: 0,
    ouest: 0,
    international: 0,
  });

  // --- Fetch destinations depuis le backend ---
  const fetchDestinations = useCallback(async () => {
    try {
      const data = await api.destinations.getAll();
      const list = Array.isArray(data) ? data : data.results || [];
      setDestinations(list);
      recalculerStats(list);
    } catch (error) {
      console.error("Erreur fetch destinations", error);
      setDestinations([]);
    }
  }, []);

  // --- Génération automatique du code ---
  const genererCode = () => {
    const codes = destinations
      .map(d => d.code_d)
      .filter(code => code?.startsWith("Des-"))
      .map(code => parseInt(code.split("-")[1]) || 0);

    const max = codes.length ? Math.max(...codes) : 0;
    return `Des-${max + 1}`;
  };

  // --- Ajouter une destination ---
  const ajouterDestination = async (payload) => {
    try {
      if (!payload.zone_geo) {
        message.error("Veuillez sélectionner une zone géographique !");
        return;
      }

      // Génération automatique du code
      payload.code_d = genererCode();

      const nouvelleDestination = await api.destinations.create(payload);

      setDestinations([nouvelleDestination, ...destinations]);
      recalculerStats([nouvelleDestination, ...destinations]);

      message.success(`Destination ajoutée ! Code : ${nouvelleDestination.code_d}`);
    } catch (error) {
      console.error("Erreur ajout destination", error.response?.data || error);
      message.error("Erreur lors de l'ajout de la destination");
    }
  };

  // --- Modifier une destination ---
  const modifierDestination = async (code_d, destinationModifiee) => {
    try {
      const payload = {
        ville: destinationModifiee.ville,
        pays: destinationModifiee.pays || "Algérie",
        zone_geo: destinationModifiee.zone_geo.toUpperCase(),
      };

      const updated = await api.destinations.update(code_d, payload);
      const nouvellesDestinations = destinations.map((d) =>
        d.code_d === code_d ? updated : d
      );
      setDestinations(nouvellesDestinations);
      recalculerStats(nouvellesDestinations);

      message.success("Destination modifiée !");
    } catch (error) {
      console.error("Erreur modification destination", error);
      message.error("Erreur lors de la modification");
    }
  };

  // --- Supprimer une destination ---
  const supprimerDestination = async (code_d) => {
    try {
      await api.destinations.delete(code_d);
      const nouvellesDestinations = destinations.filter((d) => d.code_d !== code_d);
      setDestinations(nouvellesDestinations);
      recalculerStats(nouvellesDestinations);
      message.success("Destination supprimée !");
    } catch (error) {
      console.error("Erreur suppression destination", error);
      message.error("Erreur lors de la suppression");
    }
  };

  // --- Recalcul des statistiques ---
  const recalculerStats = (data) => {
    setStatistiques({
      total: data.length,
      nord: data.filter((d) => d.zone_geo === "NORD").length,
      sud: data.filter((d) => d.zone_geo === "SUD").length,
      est: data.filter((d) => d.zone_geo === "EST").length,
      ouest: data.filter((d) => d.zone_geo === "OUEST").length,
      centre: data.filter((d) => d.zone_geo === "CENTRE").length,
      international: data.filter((d) => d.zone_geo === "INTERNATIONAL").length,
    });
  };

  return (
    <DestinationContext.Provider
      value={{
        destinations,
        statistiques,
        fetchDestinations,
        ajouterDestination,
        modifierDestination,
        supprimerDestination,
        recalculerStats,
      }}
    >
      {children}
    </DestinationContext.Provider>
  );
};

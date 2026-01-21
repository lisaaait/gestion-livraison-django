import React, { createContext, useState, useCallback } from "react";
import { message } from "antd";
import { api } from "../services/api";

export const TarificationContext = createContext();

export const TarificationProvider = ({ children }) => {
  const [tarifications, setTarifications] = useState([]);

  // --- Fetch ---
  const fetchTarifications = useCallback(async () => {
    try {
      const data = await api.tarifications.getAll();
      const list = Array.isArray(data) ? data : data.results || [];
      setTarifications(list);
    } catch (error) {
      console.error(error);
      setTarifications([]);
    }
  }, []);

  // --- Générer code ---
  const genererCode = () => {
    const codes = tarifications
      .map(t => t.code_tarif)
      .map(c => parseInt(c?.split("-")[1]) || 0);
    const max = codes.length ? Math.max(...codes) : 0;
    return `Tar-${max + 1}`;
  };

  // --- Ajouter ---
  const ajouterTarification = async (payload) => {
    try {
      payload.code_tarif = genererCode();

      // Forcer les valeurs numériques
      payload.tarif_base_destination = payload.tarif_base_destination ? parseFloat(payload.tarif_base_destination) : 0;
      payload.tarif_poids = payload.tarif_poids ? parseFloat(payload.tarif_poids) : 0;
      payload.tarif_volume = payload.tarif_volume ? parseFloat(payload.tarif_volume) : 0;

      const nouvelle = await api.tarifications.create(payload);
      setTarifications([nouvelle, ...tarifications]);
      message.success("Tarification ajoutée !");
    } catch (error) {
      console.error(error.response?.data || error);
      message.error("Erreur ajout tarification");
    }
  };

  // --- Modifier ---
  const modifierTarification = async (code_tarif, tarificationModifiee) => {
    try {
      const payload = {
        type_service: tarificationModifiee.type_service,
        tarif_base_destination: tarificationModifiee.tarif_base_destination ? parseFloat(tarificationModifiee.tarif_base_destination) : 0,
        tarif_poids: tarificationModifiee.tarif_poids ? parseFloat(tarificationModifiee.tarif_poids) : 0,
        tarif_volume: tarificationModifiee.tarif_volume ? parseFloat(tarificationModifiee.tarif_volume) : 0,
        destination: tarificationModifiee.destination
      };

      const updated = await api.tarifications.update(code_tarif, payload);

      setTarifications(
        tarifications.map(t => t.code_tarif === code_tarif ? updated : t)
      );

      message.success("Tarification modifiée !");
    } catch (error) {
      console.error("Erreur modification tarification", error.response?.data || error);
      message.error("Erreur lors de la modification de la tarification");
    }
  };

  // --- Supprimer ---
  const supprimerTarification = async (code_tarif) => {
    try {
      await api.tarifications.delete(code_tarif);
      setTarifications(tarifications.filter(t => t.code_tarif !== code_tarif));
      message.success("Tarification supprimée !");
    } catch (error) {
      message.error("Erreur suppression");
    }
  };

  return (
    <TarificationContext.Provider value={{
      tarifications,
      fetchTarifications,
      ajouterTarification,
      modifierTarification,
      supprimerTarification
    }}>
      {children}
    </TarificationContext.Provider>
  );
};

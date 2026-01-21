import React, { createContext, useState, useCallback } from "react";
import { api } from "../services/api";

export const ChauffeurContext = createContext();

const USE_MOCK_DATA = false; // On passe à false pour utiliser Django !

export const ChauffeurProvider = ({ children }) => {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistiques, setStatistiques] = useState({ total: 0, disponibles: 0, enMission: 0, indisponibles: 0 });

  // --- TRANSFORMATION DATA (BACK -> FRONT) ---
  const mapBackToFront = (ch) => ({
    id: ch.code_chauffeur, // Django utilise code_chauffeur comme PK
    codeChauffeur: ch.code_chauffeur,
    nom: ch.nom,
    numeroPermis: ch.num_permis,
    categoriePermis: ch.categorie_permis,
    // On transforme le booléen Django en texte pour ton UI
    statut: ch.statut_dispo ? "Disponible" : "En mission", 
  });

  // --- TRANSFORMATION DATA (FRONT -> BACK) ---
  const mapFrontToBack = (values) => ({
    code_chauffeur: values.codeChauffeur || `CH-${Math.floor(Math.random()*1000)}`,
    nom: values.nom,
    num_permis: values.numeroPermis,
    categorie_permis: values.categoriePermis,
    statut_dispo: values.statut === "Disponible",
  });

  const recalculerStats = (data) => {
    setStatistiques({
      total: data.length,
      disponibles: data.filter((c) => c.statut === "Disponible").length,
      enMission: data.filter((c) => c.statut === "En mission").length,
      indisponibles: 0, // Optionnel selon ta logique
    });
  };

  const fetchChauffeurs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.chauffeurs.getAll();
      const formatted = data.results.map(mapBackToFront);
      setChauffeurs(formatted);
      recalculerStats(formatted);
    } catch (error) {
      console.error("Erreur API Chauffeurs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const ajouterChauffeur = async (values) => {
    const payload = mapFrontToBack(values);
    const res = await api.chauffeurs.create(payload);
    const nouveau = mapBackToFront(res);
    setChauffeurs(prev => {
    const updated = [nouveau, ...prev];
    recalculerStats(updated); //  recalcul stats
    return updated;
  });

    return nouveau;
  };

  const modifierChauffeur = async (id, values) => {
    const payload = mapFrontToBack(values);
    const res = await api.chauffeurs.update(id, payload);
    const maj = mapBackToFront(res);
    setChauffeurs(prev => {
    const updated = prev.map(c => c.id === id ? maj : c);
    recalculerStats(updated); // recalcul stats
    return updated;
  });
  };

  const supprimerChauffeur = async (id) => {
    await api.chauffeurs.delete(id);
    setChauffeurs(prev => {
    const updated = prev.filter(c => c.id !== id);
    recalculerStats(updated); // recalcul stats
    return updated;
  });
  };

const changerStatutChauffeur = async (id, nouveauStatut) => {
  const isDispo = nouveauStatut === "Disponible";
  await api.chauffeurs.patch(id, { statut_dispo: isDispo });

  setChauffeurs(prev => {
    const updated = prev.map(c =>
      c.id === id ? { ...c, statut: nouveauStatut } : c
    );

    recalculerStats(updated); // 🔹 IMPORTANT pour mettre à jour les cards

    return updated;
  });
};


  return (
    <ChauffeurContext.Provider value={{ 
        chauffeurs, statistiques, loading, fetchChauffeurs, 
        ajouterChauffeur, modifierChauffeur, supprimerChauffeur, changerStatutChauffeur 
    }}>
      {children}
    </ChauffeurContext.Provider>
  );
};
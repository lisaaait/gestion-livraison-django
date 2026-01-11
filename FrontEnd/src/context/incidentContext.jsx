import { createContext, useState, useCallback } from "react";
import { message } from "antd";
import { api } from "../services/api";

export const IncidentContext = createContext();

export const IncidentProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Fetch incidents ---
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.incidents.getAll();
      const incidentsList = data.results || data;
      
      // Enrichir les données avec les champs d'affichage
      const enrichedIncidents = incidentsList.map(inc => ({
        ...inc,
        type_display: inc.type_display || inc.type,
        etat_display: inc.etat_display || inc.etat,
        commentaire: inc.commentaire || "", // S'assurer que commentaire existe toujours
      }));
      
      setIncidents(enrichedIncidents);
      console.log("📥 Incidents chargés :", enrichedIncidents);
    } catch (error) {
      console.error("❌ Erreur fetch incidents:", error);
      message.error("Impossible de charger les incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Fetch expéditions ---
  const fetchExpeditions = useCallback(async () => {
    try {
      const data = await api.expeditions.getAll();
      const expeditionsList = data.results || data;
      setExpeditions(expeditionsList);
      console.log("📥 Expéditions chargées :", expeditionsList);
    } catch (error) {
      console.error("❌ Erreur fetch expeditions:", error);
      message.error("Impossible de charger les expéditions");
    }
  }, []);

  // --- Ajouter incident ---
  const addIncident = async (payload) => {
    try {
      console.log("📤 Envoi de l'incident:", payload);
      
      // Créer l'incident temporaire pour l'affichage immédiat
      const tempId = `temp-${Date.now()}`;
      const tempIncident = {
        code_inc: tempId,
        type: payload.type,
        type_display: payload.type,
        commentaire: payload.commentaire,
        etat: "NOUVEAU",
        etat_display: "Nouveau",
        numexp: payload.numexp,
        expedition: `#${payload.numexp}`,
        wilaya: payload.wilaya,
        commune: payload.commune,
        date_creation: new Date().toISOString(),
        _isTemp: true,
      };

      // Ajouter temporairement à la liste
      setIncidents(prev => [tempIncident, ...prev]);

      // Envoyer au backend
      const newIncident = await api.incidents.create(payload);
      console.log("✅ Incident créé:", newIncident);

      // Remplacer l'incident temporaire par celui du backend
      setIncidents(prev =>
        prev.map(i => i.code_inc === tempId ? {
          ...newIncident,
          commentaire: newIncident.commentaire || payload.commentaire, // Force le commentaire
        } : i)
      );

      message.success("Incident créé avec succès !");
      
      // Rafraîchir la liste pour être sûr d'avoir les bonnes données
      setTimeout(() => fetchIncidents(), 500);
      
      return newIncident;
    } catch (error) {
      console.error("❌ Erreur ajout incident:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      console.error("Status:", error.response?.status);
      console.error("Payload envoyé:", payload);
      
      // Retirer l'incident temporaire en cas d'erreur
      setIncidents(prev => prev.filter(i => !i._isTemp));
      
      const errorMsg = error.response?.data?.commentaire?.[0]
        || error.response?.data?.detail 
        || error.response?.data?.message 
        || "Impossible d'ajouter l'incident";
      message.error(errorMsg);
      
      throw error;
    }
  };

  // --- Changer état incident ---
  const changerEtatIncident = async (code_inc, nouveauEtat) => {
    try {
      console.log(`🔄 Changement d'état: ${code_inc} -> ${nouveauEtat}`);
      
      // Trouver l'incident actuel
      const incidentActuel = incidents.find(i => i.code_inc === code_inc);
      if (!incidentActuel) {
        throw new Error("Incident non trouvé");
      }

      // Si on passe à RESOLU et qu'il n'y a pas de résolution, demander à l'utilisateur
      if (nouveauEtat === 'RESOLU' && !incidentActuel.resolution) {
        // Utiliser la fonction resoudreIncident qui gère le modal de résolution
        message.warning("Veuillez fournir une résolution pour marquer l'incident comme résolu");
        return;
      }

      // Mise à jour optimiste
      setIncidents(prev =>
        prev.map(i =>
          i.code_inc === code_inc
            ? {
                ...i,
                etat: nouveauEtat,
                etat_display: getEtatDisplay(nouveauEtat),
              }
            : i
        )
      );

      // Préparer le payload avec TOUTES les données obligatoires
      const payload = {
        type: incidentActuel.type,
        commentaire: incidentActuel.commentaire,
        numexp: incidentActuel.numexp,
        etat: nouveauEtat,
        wilaya: incidentActuel.wilaya,
        commune: incidentActuel.commune,
      };
      
      // Ajouter la résolution si elle existe
      if (incidentActuel.resolution) {
        payload.resolution = incidentActuel.resolution;
      }

      console.log("📤 Payload pour changement d'état:", payload);

      // Envoyer la requête au backend avec PUT complet
      const response = await api.incidents.update(code_inc, payload);
      console.log("✅ État changé:", response);
      
      message.success("État modifié avec succès !");
      
      // Rafraîchir pour synchroniser
      setTimeout(() => fetchIncidents(), 300);
    } catch (error) {
      console.error("❌ Erreur changement d'état:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      
      const errorMsg = error.response?.data?.resolution?.[0]
        || error.response?.data?.commentaire?.[0]
        || error.response?.data?.detail
        || "Impossible de modifier l'état";
      message.error(errorMsg);
      
      // Revenir à l'état précédent en cas d'erreur
      await fetchIncidents();
    }
  };

  // --- Résoudre incident ---
  const resoudreIncident = async (code_inc, resolution) => {
    try {
      await api.incidents.resoudre(code_inc, resolution);
      message.success("Incident résolu !");
      await fetchIncidents();
    } catch (error) {
      console.error("❌ Erreur résolution incident:", error);
      const errorMsg = error.response?.data?.error || "Impossible de résoudre l'incident";
      message.error(errorMsg);
    }
  };

  // --- Helper pour affichage de l'état ---
  const getEtatDisplay = (etat) => {
    const etats = {
      NOUVEAU: "Nouveau",
      EN_COURS: "En cours",
      RESOLU: "Résolu",
      FERME: "Fermé",
    };
    return etats[etat] || etat;
  };

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        expeditions,
        fetchIncidents,
        fetchExpeditions,
        addIncident,
        changerEtatIncident,
        resoudreIncident,
        loading,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};
import React, { createContext, useState, useCallback } from "react";
import { api } from "../services/api";

export const ExpeditionContext = createContext();

// Helpers pour normaliser les clés
const toCamelFromSnake = (s) =>
  s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const normalizeKey = (k) => {
  if (!k || typeof k !== "string") return k;
  if (k.includes("_")) return toCamelFromSnake(k);
  return k[0].toLowerCase() + k.slice(1);
};

const convertObjectKeys = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertObjectKeys);
  if (typeof obj !== "object") return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      let nk = normalizeKey(k);

      // Mappings spécifiques
      if (nk === "numexp") nk = "code";
      else if (nk === "codeClient") nk = "clientId";
      else if (nk === "clientNom") nk = "client";
      else if (nk === "dateCreation") nk = "dateCreation";
      else if (nk === "dateModification") nk = "dateModification";
      else if (nk === "montantEstime") nk = "montantEstime";
      else if (nk === "statutDisplay") nk = "statutDisplay";
      else if (nk === "peutEtreModifie") nk = "peutEtreModifie";
      else if (nk === "peutEtreSupprime") nk = "peutEtreSupprime";
      else if (nk === "nbIncidents") nk = "nbIncidents";

      return [nk, convertObjectKeys(v)];
    })
  );
};

const prepareExpedition = (raw) => {
  const converted = convertObjectKeys(raw);
  console.log("🟢 converted.clientNom:", converted.clientNom);
  return {
    ...converted,
    id: converted.code || converted.numexp || converted.id,
    client: converted.client || converted.clientNom || 'Client inconnu',
    code: converted.numexp || converted.code,
    montantEstime: converted.montantEstime || 0,
    dateCreation: converted.dateCreation || new Date().toISOString(),
  
  };
 
};

// Convertir frontend -> backend
const camelToBackendKey = (k) => {
  if (!k || typeof k !== "string") return k;
  
  // Mappings explicites
  const mappings = {
    'clientId': 'code_client',
    'montantEstime': 'montant_estime',
    'dateCreation': 'date_creation',
    'dateModification': 'date_modification',
    'statutDisplay': 'statut_display',
    'peutEtreModifie': 'peut_etre_modifie',
    'peutEtreSupprime': 'peut_etre_supprime',
    'nbIncidents': 'nb_incidents',
  };
  
  return mappings[k] || k;
};

const convertToBackendPayload = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertToBackendPayload);
  if (typeof obj !== "object") return obj;

  const result = {};
  
  for (const [k, v] of Object.entries(obj)) {
    // Ignorer les valeurs undefined
    if (v === undefined) continue;
    
    let value = v;
    
    // Gérer les dates moment/dayjs
    if (v && typeof v === "object" && typeof v.format === "function") {
      value = v.format("YYYY-MM-DD");
    }
    // Gérer les objets imbriqués
    else if (v && typeof v === "object" && !Array.isArray(v)) {
      value = convertToBackendPayload(v);
    }
    // Gérer les tableaux
    else if (Array.isArray(v)) {
      value = v.map(convertToBackendPayload);
    }
    
    const backendKey = camelToBackendKey(k);
    result[backendKey] = value;
  }
  
  console.log("🔄 Conversion payload:", obj, "→", result);
  return result;
};

export const ExpeditionProvider = ({ children }) => {
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchExpeditions = useCallback(async () => {
    try {
      console.log("🔄 Chargement des expéditions...");
      setLoading(true);
      
      const data = await api.expeditions.getAll();
      console.log("📥 Données reçues du backend:", data);
      
      const list = Array.isArray(data) ? data : data?.results ?? [];
      console.log("📋 Liste extraite:", list);
      
      const prepared = list.map(prepareExpedition);
      console.log("✅ Liste préparée:", prepared);
      
      setExpeditions(prepared);
      setLoading(false);
      console.log("✅ État mis à jour avec", prepared.length, "expéditions");
    } catch (error) {
      console.error("❌ Erreur fetch expéditions", error);
      setExpeditions([]);
      setLoading(false);
      throw error;
    }
  }, []);

  const ajouterExpedition = async (expedition) => {
    try {
      const payloadFrontend = {
        poids: expedition.poids || 0,
        volume: expedition.volume || 0,
        statut: expedition.statut || 'EN_ATTENTE',
        code_client: expedition.clientId,
        tarification: expedition.tarification || null,
        description: expedition.description || '',
      };

      const payload = convertToBackendPayload(payloadFrontend);
      console.log("Payload envoyé:", payload);
      
      const nouvelleExpeditionRaw = await api.expeditions.create(payload);
      const nouvelle = prepareExpedition(nouvelleExpeditionRaw);
      setExpeditions((prev) => [nouvelle, ...prev]);
      return nouvelle;
    } catch (error) {
      console.error("Erreur ajout expédition", error);
      throw error;
    }
  };

  const modifierExpedition = async (id, expeditionModifiee) => {
    try {
      const payloadFrontend = {
        poids: expeditionModifiee.poids,
        volume: expeditionModifiee.volume,
        statut: expeditionModifiee.statut,
        clientId: expeditionModifiee.clientId,
        tarification: expeditionModifiee.tarification,
        description: expeditionModifiee.description,
      };
      
      const payload = convertToBackendPayload(payloadFrontend);
      console.log("Payload modification:", payload);
      
      const expeditionMisAJourRaw = await api.expeditions.update(id, payload);
      const expeditionMisAJour = prepareExpedition(expeditionMisAJourRaw);
      
      setExpeditions((prev) =>
        prev.map((exp) => (String(exp.id) === String(id) ? expeditionMisAJour : exp))
      );
    } catch (error) {
      console.error("Erreur modification expédition", error);
      throw error;
    }
  };

  const supprimerExpedition = async (identifierOrRecord) => {
    try {
      let pk = null;

      if (identifierOrRecord && typeof identifierOrRecord === "object") {
        const rec = identifierOrRecord;
        pk = rec.id ?? rec.code ?? rec.numexp ?? null;
      } else {
        pk = identifierOrRecord;
      }

      if (!pk) {
        throw new Error("Impossible de déterminer l'identifiant à supprimer");
      }

      await api.expeditions.delete(pk);

      setExpeditions((prev) =>
        prev.filter(
          (exp) =>
            String(exp.id) !== String(pk) &&
            String(exp.code) !== String(pk)
        )
      );
    } catch (error) {
      console.error("Erreur suppression expédition:", error);
      throw error;
    }
  };

  // CORRECTION ICI : Utiliser l'endpoint /valider/ au lieu de PATCH
  const validerExpedition = async (id) => {
    try {
      console.log("✅ Validation de l'expédition:", id);
      
      const expeditionMisAJourRaw = await api.expeditions.valider(id);
      console.log("📥 Réponse backend validation:", expeditionMisAJourRaw);
      
      const expeditionMisAJour = prepareExpedition(expeditionMisAJourRaw);
      console.log("✅ Expédition validée préparée:", expeditionMisAJour);
      
      // Solution simple : rafraîchir toutes les expéditions depuis le serveur
      console.log("🔄 Rafraîchissement de la liste...");
      await fetchExpeditions();
      console.log("✅ Liste rafraîchie");
    } catch (error) {
      console.error("❌ Erreur validation expédition", error);
      console.error("❌ Détails:", error.response?.data);
      throw error;
    }
  };

  const getIncidentsExpedition = useCallback(async (expeditionId) => {
    try {
      const data = await api.incidents.getByExpedition(expeditionId);
      return Array.isArray(data) ? data : data?.results ?? [];
    } catch (error) {
      console.error("Erreur fetch incidents expédition", error);
      return [];
    }
  }, []);

  return (
    <ExpeditionContext.Provider
      value={{
        expeditions,
        loading,
        fetchExpeditions,
        ajouterExpedition,
        modifierExpedition,
        supprimerExpedition,
        validerExpedition, // CHANGÉ : on exporte validerExpedition au lieu de updateStatut
        getIncidentsExpedition,
      }}
    >
      {children}
    </ExpeditionContext.Provider>
  );
};
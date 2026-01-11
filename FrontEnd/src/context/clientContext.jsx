import React, { createContext, useState, useCallback } from "react";
import { api } from "../services/api";

export const ClientContext = createContext();

const USE_MOCK_DATA = false;

// Helpers pour conversion des clés (snake_case ou PascalCase -> camelCase)
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

      // mappings spécifiques pour correspondre à ton UI
      if (nk === "codeClient" || nk === "codeclient" || nk === "code_client") {
        nk = "code";
      } else if (nk === "tel") {
        nk = "telephone";
      } else if (nk === "codepostal") {
        nk = "codePostal";
      } else if (nk === "noteinterne") {
        nk = "noteInterne";
      }

      return [nk, convertObjectKeys(v)];
    })
  );
};

// Ensure an 'id' exists (used by Table rowKey)
const prepareClient = (raw) => {
  const cRaw = convertObjectKeys(raw);

  // Defaults minimal (do not invent fields you removed)
  const defaults = {
    prenom: "",
  };

  const c = { ...defaults, ...cRaw };

  const idFrom =
    c.id ?? c.code ?? c.codeClient ?? c.CodeClient ?? c.email ?? c.Email ?? null;

  const idValue =
    idFrom !== undefined && idFrom !== null ? String(idFrom) : `${c.email || ""}-${c.nom || ""}`;

  return { ...c, id: idValue };
};

// Convert frontend camelCase keys -> backend PascalCase / expected names
const camelToBackendKey = (k) => {
  if (!k || typeof k !== "string") return k;
  if (k === "telephone") return "Tel";
  if (k === "code") return "CodeClient";
  if (k === "codePostal") return "CodePostal";
  if (k === "noteInterne") return "NoteInterne";
  return k[0].toUpperCase() + k.slice(1);
};

const convertToBackendPayload = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertToBackendPayload);
  if (typeof obj !== "object") return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      let value = v;
      if (v && typeof v === "object" && typeof v.format === "function") {
        value = v.format("YYYY-MM-DD");
      }
      return [camelToBackendKey(k), convertToBackendPayload(value)];
    })
  );
};

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      if (USE_MOCK_DATA) {
        setClients([]);
        setLoading(false);
        return;
      } else {
        const data = await api.clients.getAll(); // should return response.data
        const list = Array.isArray(data) ? data : data?.results ?? [];
        const prepared = list.map(prepareClient);
        setClients(prepared);
        setLoading(false);
      }
    } catch (error) {
      console.error("Erreur fetch clients", error);
      setClients([]);
      setLoading(false);
      throw error;
    }
  }, []);

  const ajouterClient = async (client) => {
    try {
      if (USE_MOCK_DATA) {
        const nouveauClient = { ...client, id: clients.length + 1 };
        setClients((prev) => [...prev, nouveauClient]);
        return nouveauClient;
      } else {
        // Build payload limited to backend-expected fields
        const payloadFrontend = {
          prenom: client.prenom || "",
          nom: client.nom || "",
          adresse: client.adresse || "",
          telephone: client.telephone || "",
          email: client.email || "",
          solde: client.solde ?? 0,
          codePostal: client.codePostal || "",
          nif: client.nif || "",
          rc: client.rc || "",
          noteInterne: client.noteInterne || "",
        };

        const payload = convertToBackendPayload(payloadFrontend);
        const nouveauClientRaw = await api.clients.create(payload);
        const nouveau = prepareClient(nouveauClientRaw);
        setClients((prev) => [...prev, nouveau]);
        return nouveau;
      }
    } catch (error) {
      console.error("Erreur ajout client", error);
      throw error;
    }
  };

  const modifierClient = async (id, clientModifie) => {
    try {
      if (USE_MOCK_DATA) {
        setClients((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? { ...c, ...clientModifie } : c))
        );
      } else {
        const payloadFrontend = {
          prenom: clientModifie.prenom,
          nom: clientModifie.nom,
          adresse: clientModifie.adresse,
          telephone: clientModifie.telephone,
          email: clientModifie.email,
          solde: clientModifie.solde,
          codePostal: clientModifie.codePostal,
          nif: clientModifie.nif,
          rc: clientModifie.rc,
          noteInterne: clientModifie.noteInterne,
        };
        const payload = convertToBackendPayload(payloadFrontend);
        const clientMisAJourRaw = await api.clients.update(id, payload);
        const clientMisAJour = prepareClient(clientMisAJourRaw);
        setClients((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? clientMisAJour : c))
        );
      }
    } catch (error) {
      console.error("Erreur modification client", error);
      throw error;
    }
  };

  // Robust deletion: accept either id or record object, try several pk candidates
  const supprimerClient = async (identifierOrRecord) => {
    try {
      // identifierOrRecord can be either the id string/number or the record object
      let pk = null;

      if (identifierOrRecord && typeof identifierOrRecord === "object") {
        const rec = identifierOrRecord;
        // try known fields in priority order
        pk =
          rec.id ??
          rec.code ??
          rec.CodeClient ??
          rec.codeClient ??
          rec.Code ??
          rec.email ??
          rec.Email ??
          null;
      } else {
        pk = identifierOrRecord;
      }

      if (!pk) {
        throw new Error(
          "Impossible de déterminer l'identifiant à supprimer (id/code/CodeClient manquant)."
        );
      }

      // If pk looks numeric string, try as-is. Backend should accept the identifier used for retrieval.
      // Call API delete endpoint
      await api.clients.delete(pk);

      // update local state: remove items matching pk from id or code
      setClients((prev) =>
        prev.filter(
          (c) =>
            String(c.id) !== String(pk) &&
            String(c.code) !== String(pk) &&
            String(c.CodeClient ?? "") !== String(pk)
        )
      );
    } catch (error) {
      console.error("Erreur suppression client (frontend) :", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  };

  const getExpeditionsClient = useCallback(async (clientId) => {
    try {
      const data = await api.expeditions.getByClient(clientId);
      return Array.isArray(data) ? data : data?.results ?? [];
    } catch (error) {
      console.error("Erreur fetch expéditions client", error);
      return [];
    }
  }, []);

  const getFacturesClient = useCallback(async (clientId) => {
    try {
      const data = await api.factures.getByClient(clientId);
      return Array.isArray(data) ? data : data?.results ?? [];
    } catch (error) {
      console.error("Erreur fetch factures client", error);
      return [];
    }
  }, []);

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        fetchClients,
        ajouterClient,
        modifierClient,
        supprimerClient,
        getExpeditionsClient,
        getFacturesClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};
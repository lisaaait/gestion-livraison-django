import axios from "axios";
import AuthService from "../services/AuthService.js";

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api", // adapte si nécessaire
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true, // activer si tu utilises SessionAuth + CSRF

  
});

// --- Interceptor pour ajouter JWT à toutes les requêtes ---
apiClient.interceptors.request.use(
  (config) => {
    const token = AuthService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor pour gérer le refresh du token si 401 ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await AuthService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        AuthService.logout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);


export const clients = {
  getAll: () => apiClient.get("/clients/").then((r) => r.data),
  create: (payload) => apiClient.post("/clients/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/clients/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/clients/${id}/`).then((r) => r.data),
};

export const expeditions = {
   getAll: () => apiClient.get("/expeditions/").then((r) => r.data),
  getByClient: (clientId) => apiClient.get(`/expeditions/?code_client=${clientId}`).then((r) => r.data),
  create: (payload) => apiClient.post("/expeditions/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/expeditions/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/expeditions/${id}/`).then((r) => r.data),
   valider: (id) => apiClient.post(`/expeditions/${id}/valider/`), // NOUVEAU
};

export const factures = {
 getAll: () => apiClient.get("/factures/").then((r) => r.data),
getById: (id) => apiClient.get(`/factures/${id}/`).then((r) => r.data),
  getByClient: (clientId) => apiClient.get(`/factures/?code_client=${clientId}`).then((r) => r.data),
  create: (payload) => apiClient.post("/factures/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/factures/${id}/`, payload).then((r) => r.data),
  delete: (code_facture) =>
  apiClient.delete(`/factures/${code_facture}/`).then((r) => r.data),
  statistiques: () => apiClient.get("/factures/statistiques/").then((r) => r.data),
  impayees: () => apiClient.get("/factures/impayees/").then((r) => r.data),
  ajouterExpedition: (id, numexp) => 
    apiClient.post(`/factures/${id}/ajouter_expedition/`, { numexp }).then((r) => r.data),
  getPaiements: (id) => apiClient.get(`/factures/${id}/paiements/`).then((r) => r.data),
};
export const paiements = {
  getAll: () => apiClient.get("/paiements/").then((r) => r.data),
  getById: (id) => apiClient.get(`/paiements/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/paiements/", payload).then((r) => r.data), // ✅ POST
  update: (id, payload) => apiClient.put(`/paiements/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/paiements/${id}/`).then((r) => r.data),
  statistiques: () => apiClient.get("/paiements/statistiques/").then((r) => r.data),
};
export const reclamations = {
  getAll: () => apiClient.get("/reclamations/").then((r) => r.data),
  getById: (id) => apiClient.get(`/reclamations/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/reclamations/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/reclamations/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/reclamations/${id}/`).then((r) => r.data),
}
export const incidents = {
  getAll: () => apiClient.get("/incidents/").then((r) => r.data),
  getById: (id) => apiClient.get(`/incidents/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/incidents/", payload).then((r) => r.data),
  // PUT pour mise à jour complète (tous les champs requis)
  update: (id, payload) => apiClient.put(`/incidents/${id}/`, payload).then((r) => r.data),
  // PATCH pour mise à jour partielle (seulement les champs modifiés)
  patch: (id, payload) => apiClient.patch(`/incidents/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/incidents/${id}/`).then((r) => r.data),
  resoudre: (id, resolution) => apiClient.post(`/incidents/${id}/resoudre/`, { resolution }).then((r) => r.data),
  statistiques: () => apiClient.get("/incidents/statistiques/").then((r) => r.data),
};
export const chauffeurs = {
  getAll: () => apiClient.get("/chauffeurs/").then((r) => r.data),
  getById: (id) => apiClient.get(`/chauffeurs/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/chauffeurs/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/chauffeurs/${id}/`, payload).then((r) => r.data),
  patch: (id, payload) => apiClient.patch(`/chauffeurs/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/chauffeurs/${id}/`).then((r) => r.data),
};

export const vehicules = {
  getAll: () => apiClient.get("/vehicules/").then((r) => r.data),
  getById: (id) => apiClient.get(`/vehicules/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/vehicules/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/vehicules/${id}/`, payload).then((r) => r.data),
  patch: (id, payload) => apiClient.patch(`/vehicules/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/vehicules/${id}/`).then((r) => r.data),
};

export const tournees = {
  getAll: () => apiClient.get("/tournees/").then((r) => r.data),
  getById: (id) => apiClient.get(`/tournees/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/tournees/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/tournees/${id}/`, payload).then((r) => r.data),
  patch: (id, payload) => apiClient.patch(`/tournees/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/tournees/${id}/`).then((r) => r.data),
};

export const destinations = {
  // Récupérer toutes les destinations
  getAll: () => apiClient.get("/destinations/").then((r) => r.data),

  // Récupérer une destination par code_d
  getById: (code_d) => apiClient.get(`/destinations/${code_d}/`).then((r) => r.data),

  // Ajouter une nouvelle destination
  create: (payload) => apiClient.post("/destinations/", payload).then((r) => r.data),

  // Modifier une destination existante
  update: (code_d, payload) => apiClient.put(`/destinations/${code_d}/`, payload).then((r) => r.data),

  // Supprimer une destination
  delete: (code_d) => apiClient.delete(`/destinations/${code_d}/`).then((r) => r.data),
};


export const tarifications = {
  getAll: () => apiClient.get("/tarifs/").then(r => r.data),

  create: (payload) =>
    apiClient.post("/tarifs/", payload).then(r => r.data),

  update: (code_tarif, payload) =>
    apiClient.put(`/tarifs/${code_tarif}/`, payload).then(r => r.data),

  delete: (code_tarif) =>
    apiClient.delete(`/tarifs/${code_tarif}/`).then(r => r.data),
};





export const api = {
  clients,
  expeditions,
  factures,
  paiements,
  reclamations,
  incidents,
  chauffeurs,
  vehicules,
  tournees,
  destinations,
  tarifications,
};

export default apiClient;
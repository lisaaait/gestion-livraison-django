import axios from "axios";

// Axios client pointing to backend inside Docker
const apiClient = axios.create({
  baseURL: "http://web:8000/api", // backend Docker service name
  headers: {
    "Content-Type": "application/json",
  },
  // Uncomment the line below if using Django SessionAuth + CSRF
  // withCredentials: true,
});

// Clients API
export const clients = {
  getAll: () => apiClient.get("/clients/").then((r) => r.data),
  create: (payload) => apiClient.post("/clients/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/clients/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/clients/${id}/`).then((r) => r.data),
};

// Expeditions API
export const expeditions = {
  getAll: () => apiClient.get("/expeditions/").then((r) => r.data),
  getByClient: (clientId) => apiClient.get(`/expeditions/?code_client=${clientId}`).then((r) => r.data),
  create: (payload) => apiClient.post("/expeditions/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/expeditions/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/expeditions/${id}/`).then((r) => r.data),
  valider: (id) => apiClient.post(`/expeditions/${id}/valider/`),
};

// Factures API
export const factures = {
  getAll: () => apiClient.get("/factures/").then((r) => r.data),
  getById: (id) => apiClient.get(`/factures/${id}/`).then((r) => r.data),
  getByClient: (clientId) => apiClient.get(`/factures/?code_client=${clientId}`).then((r) => r.data),
  create: (payload) => apiClient.post("/factures/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/factures/${id}/`, payload).then((r) => r.data),
  delete: (code_facture) => apiClient.delete(`/factures/${code_facture}/`).then((r) => r.data),
  statistiques: () => apiClient.get("/factures/statistiques/").then((r) => r.data),
  impayees: () => apiClient.get("/factures/impayees/").then((r) => r.data),
  ajouterExpedition: (id, numexp) =>
    apiClient.post(`/factures/${id}/ajouter_expedition/`, { numexp }).then((r) => r.data),
  getPaiements: (id) => apiClient.get(`/factures/${id}/paiements/`).then((r) => r.data),
};

// Paiements API
export const paiements = {
  getAll: () => apiClient.get("/paiements/").then((r) => r.data),
  getById: (id) => apiClient.get(`/paiements/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/paiements/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/paiements/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/paiements/${id}/`).then((r) => r.data),
  statistiques: () => apiClient.get("/paiements/statistiques/").then((r) => r.data),
};

// Reclamations API
export const reclamations = {
  getAll: () => apiClient.get("/reclamations/").then((r) => r.data),
  getById: (id) => apiClient.get(`/reclamations/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/reclamations/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/reclamations/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/reclamations/${id}/`).then((r) => r.data),
};

// Incidents API
export const incidents = {
  getAll: () => apiClient.get("/incidents/").then((r) => r.data),
  getById: (id) => apiClient.get(`/incidents/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/incidents/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/incidents/${id}/`, payload).then((r) => r.data),
  patch: (id, payload) => apiClient.patch(`/incidents/${id}/`, payload).then((r) => r.data),
  delete: (id) => apiClient.delete(`/incidents/${id}/`).then((r) => r.data),
  resoudre: (id, resolution) => apiClient.post(`/incidents/${id}/resoudre/`, { resolution }).then((r) => r.data),
  statistiques: () => apiClient.get("/incidents/statistiques/").then((r) => r.data),
};

// Export all APIs as a single object
export const api = {
  clients,
  expeditions,
  factures,
  paiements,
  reclamations,
  incidents,
};

export default apiClient;

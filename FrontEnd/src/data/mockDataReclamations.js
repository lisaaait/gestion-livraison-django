export const mockReclamations = [
  {
    id: 1,
    numeroReclamation: "REC-001",
    client: "Société Atlas Express",
    type: "Retard de livraison",
    date: "2025-01-02",
    priorite: "Haute",
    statut: "En cours",
    description:
      "La livraison prévue le 30/12/2024 n’a pas été effectuée à la date annoncée.",
  },
  {
    id: 2,
    numeroReclamation: "REC-002",
    client: "SARL TransMaghreb",
    type: "Colis endommagé",
    date: "2025-01-04",
    priorite: "Critique",
    statut: "Nouvelle",
    description:
      "Le colis est arrivé avec un emballage déchiré et le contenu partiellement cassé.",

  },
  {
    id: 3,
    numeroReclamation: "REC-003",
    client: "EURL FastDelivery",
    type: "Erreur de facturation",
    date: "2025-01-05",
    priorite: "Moyenne",
    statut: "Résolue",
     description:
      "Le montant facturé ne correspond pas au devis initial signé par le client.",
  },
  {
    id: 4,
    numeroReclamation: "REC-004",
    client: "Client Particulier",
    type: "Livraison non reçue",
    date: "2025-01-06",
    priorite: "Haute",
    statut: "En cours",
    description:
    "Le client signale ne pas avoir reçu sa commande malgré la confirmation de livraison indiquée dans le système.",

  },
  {
    id: 5,
    numeroReclamation: "REC-005",
    client: "Société NordLog",
    type: "Mauvaise destination",
    date: "2025-01-07",
    priorite: "Basse",
    statut: "Nouvelle",
    description:
    "Le colis a été livré à une mauvaise adresse en raison d’une erreur de saisie. La situation a été corrigée et le colis redirigé.",

  },
];


export const reclamationStats = {
  total: mockReclamations.length,

  nouvelles: mockReclamations.filter(
    (rec) => rec.statut === "Nouvelle"
  ).length,

  enCours: mockReclamations.filter(
    (rec) => rec.statut === "En cours"
  ).length,

  resolues: mockReclamations.filter(
    (rec) => rec.statut === "Résolue"
  ).length,
};
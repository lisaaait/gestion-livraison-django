export const mockChauffeurs = [
  {
    id: 1,
    codeChauffeur: "CH-001",
    nom: "Benali Ahmed",
    numeroPermis: "ALG-548921",
    categoriePermis: "C",
    statut: "Disponible",
    Telephone: "0550-123-456",
    Email: "benali@gmail.com"
  },
  {
    id: 2,
    codeChauffeur: "CH-002",
    nom: "Kaci Mourad",
    numeroPermis: "ALG-784512",
    categoriePermis: "CE",
    statut: "En mission",
    Telephone: "0550-654-321",
    Email: "Kaci@gmail.com"
  },
  {
    id: 3,
    codeChauffeur: "CH-003",
    nom: "Bensaid Yacine",
    numeroPermis: "ALG-125874",
    categoriePermis: "B",
    statut: "Disponible",
    Telephone: "0550-585-321",
    Email: "Bensaid@gmail.com"
  },
  {
    id: 4,
    codeChauffeur: "CH-004",
    nom: "Toumi Sofiane",
    numeroPermis: "ALG-963258",
    categoriePermis: "C",
    statut: "Indisponible",
    Telephone: "0550-654-245",
    Email: "Toumi@gmail.com"
  },
  {
    id: 5,
    codeChauffeur: "CH-005",
    nom: "Ait Ali Karim",
    numeroPermis: "ALG-357159",
    categoriePermis: "CE",
    statut: "Disponible",
    Telephone: "078-654-321",
    Email: "AitAli@gmail.com"
  },
];

export const chauffeurStats = {
  total: mockChauffeurs.length,

  disponibles: mockChauffeurs.filter(
    (ch) => ch.statut === "Disponible"
  ).length,

  enMission: mockChauffeurs.filter(
    (ch) => ch.statut === "En mission"
  ).length,

  indisponibles: mockChauffeurs.filter(
    (ch) => ch.statut === "Indisponible"
  ).length,
};

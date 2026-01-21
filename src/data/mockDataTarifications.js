export const mockTarifications = [
  {
    id: 1,
    codeTarif: "TF-001",
    typeService: "Standard",
    tarifBase: 1500,
    tarifPoids: 50,     // par kg
    tarifVolume: 30,    // par m3
    destinationId: 1,
    etat: "Active",
  },
  {
    id: 2,
    codeTarif: "TF-002",
    typeService: "Express",
    tarifBase: 3000,
    tarifPoids: 80,
    tarifVolume: 50,
    destinationId: 2,
    etat: "Active",
  },
  {
    id: 3,
    codeTarif: "TF-003",
    typeService: "International",
    tarifBase: 6000,
    tarifPoids: 120,
    tarifVolume: 90,
    destinationId: 3,
    etat: "Suspendue",
  },
  {
    id: 4,
    codeTarif: "TF-004",
    typeService: "Standard",
    tarifBase: 1800,
    tarifPoids: 60,
    tarifVolume: 40,
    destinationId: 1,
    etat: "Active",
  },
  {
    id: 5,
    codeTarif: "TF-005",
    typeService: "Économique",
    tarifBase: 1000,
    tarifPoids: 40,
    tarifVolume: 25,
    destinationId: 4,
    etat: "Inactive",
  },
];
export const tarificationStats = {
  total: mockTarifications.length,

  actives: mockTarifications.filter(
    (t) => t.etat === "Active"
  ).length,

  suspendues: mockTarifications.filter(
    (t) => t.etat === "Suspendue"
  ).length,

  inactives: mockTarifications.filter(
    (t) => t.etat === "Inactive"
  ).length,
};

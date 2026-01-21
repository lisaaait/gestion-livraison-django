export const mockVehicules = [
  {
    id: 1,
    matricule: "123-ALG-45",
    typeVehicule: "Camion",
    capacitePoids: "10 ",
    capaciteVolume: "45 ",
    etat: "Disponible",
  },
  {
    id: 2,
    matricule: "456-ALG-78",
    typeVehicule: "Fourgon",
    capacitePoids: "3 ",
    capaciteVolume: "15 ",
    etat: "En maintenance",
  },
  {
    id: 3,
    matricule: "789-ALG-12",
    typeVehicule: "Camion Frigorifique",
    capacitePoids: "8 ",
    capaciteVolume: "35 ",
    etat: "En mission",
  },
  {
    id: 4,
    matricule: "321-ALG-90",
    typeVehicule: "Semi-remorque",
    capacitePoids: "25 ",
    capaciteVolume: "80 ",
    etat: "Disponible",
  },
  {
    id: 5,
    matricule: "654-ALG-33",
    typeVehicule: "Pickup",
    capacitePoids: "1",
    capaciteVolume: "5 ",
    etat: "Disponible",
  },
];

export const vehiculeStats = {
  total: mockVehicules.length,

  disponibles: mockVehicules.filter(
    (v) => v.etat === "Disponible"
  ).length,

  enMission: mockVehicules.filter(
    (v) => v.etat === "En mission"
  ).length,

  enMaintenance: mockVehicules.filter(
    (v) => v.etat === "En maintenance"
  ).length,
};

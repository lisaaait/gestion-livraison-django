export const mockTournees = [
  {
  id: 1,
  codeTournee: "TR-001",
  dateTournee: "2025-01-12",
  chauffeurId: 3,
  vehiculeId: 2,
  statut: "Planifiée"
},{
  id: 2,
  codeTournee: "TR-001",
  dateTournee: "2025-07-10",
  chauffeurId: 3,
  vehiculeId: 1,
  statut: "Planifiée"
},{
  id: 3,
  codeTournee: "TR-001",
  dateTournee: "2025-11-10",
  chauffeurId: 1,
  vehiculeId: 2,
  statut: "Planifiée"
},
  
];
export const tourneeStats = {
  total: mockTournees.length,

  aujourdHui: mockTournees.filter(
    (t) => t.dateTournee === new Date().toISOString().slice(0, 10)
  ).length,
  
    Planifiée: mockTournees.filter(
      (t) => t.statut === "Planifiée"
    ).length,
  
    Encours: mockTournees.filter(
      (t) => t.statut === "En cours"
    ).length,
  
    Terminées: mockTournees.filter(
      (t) => t.statut === "Terminées"
    ).length,
  };
